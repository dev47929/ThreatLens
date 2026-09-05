import { parseOpenAISSEStream } from './sseParser.js';

export interface LLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
  usage?: LLMUsage;
}

export interface LLMStreamCallbacks {
  onToken?: (token: string) => void;
  onReasoning?: (delta: string) => void;
  onToolCallStart?: (toolName: string, callId: string) => void;
  onUsage?: (usage: LLMUsage) => void;
}

export interface LLMClient {
  chat(
    messages: LLMMessage[],
    tools: Array<{ type: 'function'; function: any }>,
    callbacks?: LLMStreamCallbacks
  ): Promise<LLMMessage>;
}

export interface ScriptedStep {
  thought?: string;
  toolCalls?: Array<{ name: string; args: Record<string, any> }>;
  finalResponse?: string;
}

/**
 * Scripted Mock LLM driver for deterministic headless scenario tests and CI.
 */
export class ScriptedLLMClient implements LLMClient {
  private steps: ScriptedStep[];
  private currentStepIndex = 0;

  constructor(steps: ScriptedStep[]) {
    this.steps = steps;
  }

  public async chat(
    messages: LLMMessage[],
    tools: Array<{ type: 'function'; function: any }>,
    callbacks?: LLMStreamCallbacks
  ): Promise<LLMMessage> {
    if (this.currentStepIndex >= this.steps.length) {
      return {
        role: 'assistant',
        content: 'Task completed successfully.',
      };
    }

    const step = this.steps[this.currentStepIndex++];

    if (step.thought && callbacks?.onToken) {
      for (const char of step.thought) {
        callbacks.onToken(char);
      }
    }

    if (step.toolCalls && step.toolCalls.length > 0) {
      const formattedToolCalls = step.toolCalls.map((tc, idx) => ({
        id: `call_${this.currentStepIndex}_${idx}`,
        type: 'function' as const,
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.args),
        },
      }));

      return {
        role: 'assistant',
        content: step.thought || null,
        tool_calls: formattedToolCalls,
      };
    }

    if (step.finalResponse && callbacks?.onToken) {
      for (const char of step.finalResponse) {
        callbacks.onToken(char);
      }
    }

    return {
      role: 'assistant',
      content: step.finalResponse || 'Completed.',
    };
  }
}

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

/**
 * Live OpenAI / OpenRouter HTTP Client.
 */
export class OpenAILLMClient implements LLMClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    this.model = config.model || 'anthropic/claude-3.5-sonnet';
  }

  public async chat(
    messages: LLMMessage[],
    tools: Array<{ type: 'function'; function: any }>,
    callbacks?: LLMStreamCallbacks
  ): Promise<LLMMessage> {
    const payload = {
      model: this.model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      max_tokens: 4096,
      stream: true,
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`LLM API Error (${res.status}): ${errorText}`);
    }

    if (!res.body) {
      throw new Error('LLM Response body is empty');
    }

    return parseOpenAISSEStream(res.body, callbacks);
  }
}
