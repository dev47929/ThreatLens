import { LLMClient, LLMMessage, LLMStreamCallbacks } from './llmClient.js';

export interface FallbackTier {
  id: string;
  name: string;
  client: LLMClient;
  isAvailable?: () => boolean;
}

export interface FallbackLLMClientOptions {
  onTierSwitched?: (fromTier: string, toTier: string, error: Error) => void;
  maxRetriesPerTier?: number;
}

/**
 * Resilient multi-tier LLM Client that automatically cascades across
 * fallback API endpoints and model providers when upstream errors occur.
 */
export class FallbackLLMClient implements LLMClient {
  private tiers: FallbackTier[];
  private activeTierIndex: number = 0;
  private onTierSwitched?: (fromTier: string, toTier: string, error: Error) => void;
  private maxRetriesPerTier: number;

  constructor(tiers: FallbackTier[], options?: FallbackLLMClientOptions) {
    this.tiers = tiers.filter((t) => (t.isAvailable ? t.isAvailable() : true));
    this.onTierSwitched = options?.onTierSwitched;
    this.maxRetriesPerTier = options?.maxRetriesPerTier ?? 1;
  }

  public getActiveTier(): FallbackTier | undefined {
    return this.tiers[this.activeTierIndex];
  }

  public getTierNames(): string[] {
    return this.tiers.map((t) => t.name);
  }

  public async chat(
    messages: LLMMessage[],
    tools: Array<{ type: 'function'; function: any }>,
    callbacks?: LLMStreamCallbacks
  ): Promise<LLMMessage> {
    if (this.tiers.length === 0) {
      throw new Error('No LLM client tiers configured in FallbackLLMClient');
    }

    const errors: Array<{ tier: string; error: string }> = [];

    // Attempt through tiers starting from current active tier
    for (let i = 0; i < this.tiers.length; i++) {
      const tierIndex = (this.activeTierIndex + i) % this.tiers.length;
      const currentTier = this.tiers[tierIndex];

      let lastTierError: any = null;

      for (let attempt = 1; attempt <= this.maxRetriesPerTier; attempt++) {
        try {
          // Wrapped callbacks to track whether tokens were already emitted
          let tokensEmitted = 0;
          const wrappedCallbacks: LLMStreamCallbacks = {
            ...callbacks,
            onToken: (token: string) => {
              tokensEmitted++;
              callbacks?.onToken?.(token);
            },
            onReasoning: (delta: string) => {
              callbacks?.onReasoning?.(delta);
            },
            onToolCallStart: (toolName: string, callId: string) => {
              callbacks?.onToolCallStart?.(toolName, callId);
            },
            onUsage: (usage) => {
              callbacks?.onUsage?.(usage);
            },
          };

          const response = await currentTier.client.chat(messages, tools, wrappedCallbacks);

          // Success: update active tier index if switched
          if (tierIndex !== this.activeTierIndex) {
            this.activeTierIndex = tierIndex;
          }
          return response;
        } catch (err: any) {
          lastTierError = err;
          const errMsg = err?.message || String(err);

          // If this tier failed, record error
          errors.push({
            tier: `${currentTier.name} (attempt ${attempt}/${this.maxRetriesPerTier})`,
            error: errMsg,
          });

          // Check if error is retryable or if we should switch tier immediately
          const isAuthError = errMsg.includes('401') || errMsg.includes('Missing Authentication') || errMsg.includes('Unauthorized');
          const isRateLimit = errMsg.includes('429') || errMsg.includes('rate limit');
          const isNotFoundOrModelError = errMsg.includes('404') || errMsg.includes('model') || errMsg.includes('does not exist');

          // On auth / rate limit / model error, do not waste retries on same tier
          if (isAuthError || isRateLimit || isNotFoundOrModelError) {
            break;
          }
        }
      }

      // If more tiers exist, switch and notify
      if (i < this.tiers.length - 1) {
        const nextIndex = (tierIndex + 1) % this.tiers.length;
        const nextTier = this.tiers[nextIndex];
        const reason = (lastTierError?.message || 'Error').slice(0, 100);

        const notice = `\n⚡ [Fallback Active] ${currentTier.name} unavailable (${reason}). Auto-switching to: ${nextTier.name}...\n`;

        if (callbacks?.onReasoning) {
          callbacks.onReasoning(notice);
        } else if (callbacks?.onToken) {
          // Send brief reasoning delta if reasoning not supported
          callbacks.onToken(notice);
        }

        if (this.onTierSwitched) {
          this.onTierSwitched(currentTier.name, nextTier.name, lastTierError);
        }
      }
    }

    // All tiers exhausted
    const summary = errors.map((e) => `  • ${e.tier}: ${e.error}`).join('\n');
    throw new Error(`All LLM API fallback tiers failed:\n${summary}`);
  }
}
