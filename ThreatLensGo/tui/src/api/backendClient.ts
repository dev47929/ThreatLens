import type {
  AttackType,
  AttackStatus,
  Chat,
  ChatRequest,
  LimitData,
  UsageData,
} from './types.js';

export class RateLimitError extends Error {
  public retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number = 60) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class BackendError extends Error {
  public status: number;
  public detail: string;

  constructor(status: number, detail: string) {
    super(`HTTP ${status}: ${detail}`);
    this.name = 'BackendError';
    this.status = status;
    this.detail = detail;
  }
}

export class BackendAPIClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || process.env.THREATLENS_BACKEND_URL || 'http://localhost:1234')
      .replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  private onUnauthorized?: () => void;

  setOnUnauthorized(cb: () => void): void {
    this.onUnauthorized = cb;
  }

  /** Core fetch wrapper. Injects Authorization header if token is set.
   *  Parses JSON response. Throws on non-2xx with parsed error detail.
   *  On fetch failure, waits 1 second and retries once. */
  async request<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await this.rawRequest(path, options);
    } catch (err: any) {
      if (options?.signal?.aborted) {
        throw err;
      }
      // Retry once after 1 second on network/fetch failure
      await new Promise((r) => setTimeout(r, 1000));
      res = await this.rawRequest(path, options);
    }

    if (!res.ok) {
      if (res.status === 401) {
        this.authToken = null;
        this.onUnauthorized?.();
      }

      if (res.status === 429) {
        const retryHeader = res.headers.get('Retry-After');
        let retrySeconds = retryHeader ? parseInt(retryHeader, 10) : 60;
        if (isNaN(retrySeconds) || retrySeconds <= 0) {
          retrySeconds = 60;
        }

        let errorDetail = 'Rate limit exceeded';
        try {
          const errorJson = await res.json();
          errorDetail = errorJson.detail || errorJson.message || errorJson.error || errorDetail;
          if (errorJson.retry_after || errorJson.retryAfter) {
            const parsed = parseInt(errorJson.retry_after || errorJson.retryAfter, 10);
            if (!isNaN(parsed) && parsed > 0) {
              retrySeconds = parsed;
            }
          }
        } catch {
          // retain default
        }

        throw new RateLimitError(`HTTP 429: ${errorDetail}`, retrySeconds);
      }
      let errorDetail = res.statusText;
      try {
        const errorJson = await res.json();
        errorDetail = errorJson.detail || errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch {
        // Not a JSON response, retain statusText
      }
      throw new BackendError(res.status, errorDetail);
    }

    return (await res.json()) as T;
  }

  /** Returns raw Response for SSE consumers (LLM streaming, attack streaming). */
  async rawRequest(path: string, options?: RequestInit): Promise<Response> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseUrl}${normalizedPath}`;

    const headers = new Headers(options?.headers || {});
    if (this.authToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }
    if (options?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /** SSE stream helper. See 🔧 PATCH below for the exact buffering contract. */
  async *streamSSE<T>(path: string, options?: RequestInit): AsyncGenerator<T> {
    const res = await this.rawRequest(path, options);
    if (!res.body) throw new Error('No response body for SSE stream');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ''; // holds any incomplete trailing line between reads

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // last element may be incomplete — keep it

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data) as T;
          } catch {
            // malformed line — skip, don't crash the whole stream
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // --- Auth ---
  async pulse(): Promise<{ status: string; connect: boolean }> {
    return this.request<{ status: string; connect: boolean }>('/pulse');
  }

  async passwordLogin(id: string, pw: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/password/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: id, password: pw }),
    });
  }

  async getMe(): Promise<any> {
    return this.request<any>('/me');
  }

  getOAuthLoginUrl(provider: 'google' | 'github'): string {
    return `${this.baseUrl}/${provider}/login`;
  }

  // --- LLM ---
  async chatCompletionRaw(body: ChatRequest): Promise<Response> {
    return this.rawRequest('/llm/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getUsage(): Promise<UsageData> {
    return this.request<UsageData>('/llm/usage');
  }

  async patchUsage(prompt: number, completion: number): Promise<any> {
    return this.request<any>('/llm/usage', {
      method: 'PATCH',
      body: JSON.stringify({
        prompt_tokens: prompt,
        completion_tokens: completion,
      }),
    });
  }

  async getLimit(): Promise<LimitData> {
    return this.request<LimitData>('/llm/limit');
  }

  async getLlmProvider(): Promise<{
    current: { provider: string | null; base_url: string; default_model: string };
    available: Record<string, { base_url: string; default_model: string; configured: boolean }>;
  }> {
    return this.request<{
      current: { provider: string | null; base_url: string; default_model: string };
      available: Record<string, { base_url: string; default_model: string; configured: boolean }>;
    }>('/llm/provider');
  }

  async setLlmProvider(provider: string): Promise<any> {
    return this.request<any>(`/llm/provider?provider=${encodeURIComponent(provider)}`, {
      method: 'PATCH',
    });
  }

  async setCustomLlmProvider(config: {
    base_url: string;
    api_key?: string;
    default_model: string;
  }): Promise<any> {
    return this.request<any>('/llm/provider/custom', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async testLlmProvider(config: {
    base_url: string;
    api_key?: string;
    model?: string;
  }): Promise<{ success: boolean; status_code: number | null; message: string; endpoint?: string }> {
    return this.request<{ success: boolean; status_code: number | null; message: string; endpoint?: string }>(
      '/llm/provider/test',
      {
        method: 'POST',
        body: JSON.stringify(config),
      }
    );
  }

  // --- Attacks (same shape for each type) ---
  async startAttack(type: AttackType, config: any, options?: RequestInit): Promise<{ attack_id: string; status: string }> {
    return this.request<{ attack_id: string; status: string }>(`/attack/${type}`, {
      method: 'POST',
      body: JSON.stringify(config),
      ...options,
    });
  }

  async getAttackStatus(type: AttackType, id: string): Promise<AttackStatus> {
    return this.request<AttackStatus>(`/attack/${type}/${id}`);
  }

  async stopAttack(type: AttackType, id: string): Promise<{ attack_id: string; status: string }> {
    return this.request<{ attack_id: string; status: string }>(`/attack/${type}/${id}/stop`, {
      method: 'POST',
    });
  }

  streamAttack(type: AttackType, id: string, options?: RequestInit): AsyncGenerator<AttackStatus> {
    return this.streamSSE<AttackStatus>(`/attack/${type}/${id}/stream`, options);
  }

  async getAttackCases(type: 'sqli' | 'xss' | 'origin-proxy'): Promise<any> {
    return this.request<any>(`/attack/${type}/cases`);
  }

  async patchAttackCases(type: 'sqli' | 'xss' | 'origin-proxy', cases: any): Promise<any> {
    return this.request<any>(`/attack/${type}/cases`, {
      method: 'PATCH',
      body: JSON.stringify(cases),
    });
  }

  // --- Chats ---
  async createChat(title?: string, model?: string): Promise<Chat> {
    return this.request<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify({ title, model }),
    });
  }

  async listChats(): Promise<Chat[]> {
    return this.request<Chat[]>('/chats');
  }

  async getChats(): Promise<Chat[]> {
    return this.listChats();
  }

  async deleteChat(id: number): Promise<any> {
    return this.request<any>(`/chats/${id}`, {
      method: 'DELETE',
    });
  }

  async saveChatHistory(chatId: number, messages: any[]): Promise<any> {
    return this.request<any>('/chats/history', {
      method: 'POST',
      body: JSON.stringify({ chat_id: chatId, messages }),
    });
  }

  async getChatHistory(chatId: number, page?: number, limit?: number): Promise<any> {
    const params = new URLSearchParams();
    if (page !== undefined) params.set('page', String(page));
    if (limit !== undefined) params.set('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/chats/${chatId}/history${query}`);
  }

  // --- Git ---
  async buildRepo(url: string, signal?: AbortSignal): Promise<{ status: string; count: number | null }> {
    return this.request<{ status: string; count: number | null }>('/git/build', {
      method: 'PATCH',
      body: JSON.stringify({ url }),
      signal,
    });
  }
}

export type { AttackType };
export const backendClient = new BackendAPIClient();
