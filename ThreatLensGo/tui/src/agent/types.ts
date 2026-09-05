export interface DiffApprovalPayload {
  id: string;
  file: string;
  originalContent: string;
  newContent: string;
  patch: string; // Unified diff format for terminal syntax highlighting
  description: string;
}

export type AgentEvent =
  | { type: 'token'; delta: string }
  | { type: 'reasoning'; delta: string }
  | { type: 'tool_start'; toolName: string; args: Record<string, any>; callId: string }
  | { type: 'tool_result'; toolName: string; result: any; callId: string; isError?: boolean }
  | { type: 'require_approval'; payload: DiffApprovalPayload }
  | { type: 'status'; message: string }
  | {
      type: 'done';
      summary: string;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens?: number };
    }
  | {
      type: 'turn_complete';
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens?: number };
    }
  | { type: 'error'; error: string };

export interface AgentController {
  submitQuery(query: string): void;
  approveDiff(payloadId: string): void;
  rejectDiff(payloadId: string, reason?: string): void;
  cancel(): void;
  onEvent(listener: (event: AgentEvent) => void): () => void;
}
