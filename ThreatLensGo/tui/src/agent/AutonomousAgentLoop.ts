import { AgentController, AgentEvent, DiffApprovalPayload } from './types.js';
import { ToolRegistry } from './tools/toolRegistry.js';
import { LLMClient, LLMMessage } from './llm/llmClient.js';
import { AGENT_SYSTEM_PROMPT } from './prompt.js';
import { AgentConfig, DEFAULT_AGENT_CONFIG } from './config.js';
import { pruneMessageHistory, truncateToolData } from './guardrails/resourceGuard.js';

export class AutonomousAgentLoop implements AgentController {
  private llmClient: LLMClient;
  private toolRegistry: ToolRegistry;
  private config: AgentConfig;
  private listeners: Set<(event: AgentEvent) => void> = new Set();
  private messages: LLMMessage[] = [];
  private isRunning = false;
  private pendingApproval: {
    payload: DiffApprovalPayload;
    toolCallId: string;
    toolName: string;
  } | null = null;

  constructor(
    llmClient: LLMClient,
    toolRegistry: ToolRegistry,
    config: AgentConfig = DEFAULT_AGENT_CONFIG
  ) {
    this.llmClient = llmClient;
    this.toolRegistry = toolRegistry;
    this.config = config;
  }

  public onEvent(listener: (event: AgentEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: AgentEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in AgentEventListener:', err);
      }
    }
  }

  public async submitQuery(query: string): Promise<void> {
    if (this.isRunning) {
      this.emit({ type: 'error', error: 'Agent is already running a task.' });
      return;
    }

    this.isRunning = true;
    this.messages = [
      { role: 'system', content: AGENT_SYSTEM_PROMPT },
      { role: 'user', content: query },
    ];

    this.emit({ type: 'status', message: 'Analyzing request and scanning codebase...' });
    await this.runLoop();
  }

  /**
   * Main Autonomous ReAct Loop.
   */
  private async runLoop(): Promise<void> {
    let iteration = 0;
    const tools = this.toolRegistry.getToolDefinitions();

    while (this.isRunning && iteration < this.config.maxIterations) {
      iteration++;

      try {
        this.messages = pruneMessageHistory(this.messages);

        this.emit({
          type: 'status',
          message:
            iteration === 1
              ? 'Analyzing request and planning codebase inspection...'
              : `Analyzing codebase results (Step ${iteration}/${this.config.maxIterations})...`,
        });

        const responseMessage = await this.llmClient.chat(this.messages, tools, {
          onToken: (token) => this.emit({ type: 'token', delta: token }),
          onReasoning: (delta) => this.emit({ type: 'reasoning', delta }),
          onToolCallStart: (name, callId) => {
            this.emit({ type: 'status', message: `Preparing tool invocation: [${name}]...` });
            this.emit({ type: 'tool_start', toolName: name, args: {}, callId });
          },
        });

        this.messages.push(responseMessage);

        if (responseMessage.usage) {
          this.emit({
            type: 'turn_complete',
            usage: responseMessage.usage,
          });
        }

        // Check if LLM decided to conclude without calling further tools
        if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
          this.isRunning = false;
          this.emit({
            type: 'done',
            summary: responseMessage.content || 'Task completed successfully.',
            usage: responseMessage.usage,
          });
          return;
        }

        // Execute returned tool calls sequentially
        for (const tc of responseMessage.tool_calls) {
          if (!this.isRunning) return;

          let args: Record<string, any> = {};
          try {
            args = JSON.parse(tc.function.arguments || '{}');
          } catch {
            args = {};
          }

          this.emit({
            type: 'status',
            message: `Executing tool [${tc.function.name}]...`,
          });

          this.emit({
            type: 'tool_start',
            toolName: tc.function.name,
            args,
            callId: tc.id,
          });

          const result = await this.toolRegistry.execute(tc.function.name, args);

          // Handle Diff Approval Gate (edit_file)
          if (result.requiresApproval) {
            this.pendingApproval = {
              payload: result.requiresApproval,
              toolCallId: tc.id,
              toolName: tc.function.name,
            };

            this.emit({
              type: 'require_approval',
              payload: result.requiresApproval,
            });

            // Pause execution and wait for user approval or rejection
            return;
          }

          // Tool executed without approval requirement
          this.emit({
            type: 'tool_result',
            toolName: tc.function.name,
            result: result.data || result.error,
            callId: tc.id,
            isError: !result.success,
          });

          this.emit({
            type: 'status',
            message: `Completed [${tc.function.name}] · Processing results...`,
          });

          const safeData = truncateToolData(result.success ? result.data : { error: result.error });
          this.messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(safeData),
          });
        }
      } catch (err: any) {
        this.isRunning = false;
        this.emit({ type: 'error', error: `Agent runtime error: ${err?.message || String(err)}` });
        return;
      }
    }

    if (iteration >= this.config.maxIterations) {
      this.isRunning = false;
      this.emit({
        type: 'error',
        error: `Agent reached maximum iteration limit (${this.config.maxIterations}) without resolving.`,
      });
    }
  }

  /**
   * User approves the pending diff -> applies to disk and resumes the loop.
   */
  public async approveDiff(payloadId: string): Promise<void> {
    if (!this.pendingApproval || this.pendingApproval.payload.id !== payloadId) {
      this.emit({ type: 'error', error: 'No matching pending diff approval found.' });
      return;
    }

    const { payload, toolCallId, toolName } = this.pendingApproval;
    this.pendingApproval = null;

    this.emit({ type: 'status', message: `Applying approved diff to ${payload.file}...` });
    const applied = await this.toolRegistry.applyDiff(payload);

    if (!applied) {
      this.emit({ type: 'error', error: `Failed to write modifications to ${payload.file}` });
      this.messages.push({
        role: 'tool',
        tool_call_id: toolCallId,
        content: JSON.stringify({ error: `Failed to apply diff to ${payload.file}` }),
      });
    } else {
      this.emit({
        type: 'tool_result',
        toolName,
        result: { message: `Changes successfully applied to ${payload.file}` },
        callId: toolCallId,
      });

      this.messages.push({
        role: 'tool',
        tool_call_id: toolCallId,
        content: JSON.stringify({
          success: true,
          message: `Diff successfully approved and written to ${payload.file}. Now verify remediation.`,
        }),
      });
    }

    // Resume the agent loop
    await this.runLoop();
  }

  /**
   * User rejects the pending diff -> notifies LLM and resumes loop for retry.
   */
  public async rejectDiff(payloadId: string, reason?: string): Promise<void> {
    if (!this.pendingApproval || this.pendingApproval.payload.id !== payloadId) {
      this.emit({ type: 'error', error: 'No matching pending diff approval found.' });
      return;
    }

    const { toolCallId, toolName } = this.pendingApproval;
    this.pendingApproval = null;

    const rejectionMsg = reason || 'User rejected the proposed patch.';
    this.emit({ type: 'status', message: `Diff rejected: ${rejectionMsg}` });

    this.emit({
      type: 'tool_result',
      toolName,
      result: { error: rejectionMsg },
      callId: toolCallId,
      isError: true,
    });

    this.messages.push({
      role: 'tool',
      tool_call_id: toolCallId,
      content: JSON.stringify({
        error: `Patch was rejected by user. Reason: ${rejectionMsg}. Propose an alternative fix.`,
      }),
    });

    // Resume loop
    await this.runLoop();
  }

  public cancel(): void {
    this.isRunning = false;
    this.pendingApproval = null;
    this.emit({ type: 'status', message: 'Agent operation cancelled by user.' });
    this.emit({ type: 'done', summary: 'Operation cancelled.' });
  }
}
