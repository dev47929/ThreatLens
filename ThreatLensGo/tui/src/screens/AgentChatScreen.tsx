import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { TerminalLayout } from '../components/TerminalLayout.js';
import { ToolBadge } from '../components/ToolBadge.js';
import { DiffApprovalModal } from '../components/DiffApprovalModal.js';
import { Spinner } from '../components/Spinner.js';
import { useNavigation } from '../state/navigation.js';
import { useTheme } from '../state/themeContext.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { THEMES } from '../theme/themes.js';
import type { ThemeId } from '../theme/types.js';
import { AgentController, AgentEvent, DiffApprovalPayload } from '../agent/types.js';
import { ThreatLensAgentManager, AgentManagerStats } from '../agent/agentManager.js';
import { MockAgentController } from '../agent/MockAgentController.js';
import { backendClient } from '../api/backendClient.js';
import type { UsageData, LimitData } from '../api/types.js';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
}

interface ToolExecution {
  callId: string;
  toolName: string;
  args?: Record<string, any>;
  status: 'running' | 'completed' | 'error';
  result?: any;
}

export interface AgentChatScreenProps {
  controller?: AgentController;
  chatId?: number;
  initialPrompt?: string;
}

export const AgentChatScreen: React.FC<AgentChatScreenProps> = ({
  controller: customController,
  chatId: initialChatId,
  initialPrompt,
}) => {
  const { push, pop } = useNavigation();
  const { theme, setTheme } = useTheme();
  const { rows } = useTerminalSize();

  const [controller, setController] = useState<AgentController | null>(customController || null);
  const [managerStats, setManagerStats] = useState<AgentManagerStats | null>(null);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgentText, setCurrentAgentText] = useState('');
  const [tools, setTools] = useState<ToolExecution[]>([]);
  const [activeApproval, setActiveApproval] = useState<DiffApprovalPayload | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing codebase index and agent engine...');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [thinkingText, setThinkingText] = useState<string>('');
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [limits, setLimits] = useState<LimitData | null>(null);

  // Persistence Refs & State
  const chatIdRef = useRef<number | null>(initialChatId ?? null);
  const isSavingHistoryRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false);
  const latestMessagesRef = useRef<Message[]>([]);
  const initialPromptSentRef = useRef<boolean>(false);
  const controllerRef = useRef<AgentController | null>(null);

  // Sync messages ref
  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    controllerRef.current = controller;
  }, [controller]);

  // Cancel controller only on full component unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.cancel();
    };
  }, []);

  // Restore chat history on mount if launched with existing chatId
  useEffect(() => {
    if (initialChatId) {
      backendClient
        .getChatHistory(initialChatId)
        .then((res) => {
          const list = Array.isArray(res) ? res : (res as any)?.data || [];
          if (list && list.length > 0) {
            const restored: Message[] = list.map((item: any, idx: number) => ({
              id: `restored-${initialChatId}-${idx}`,
              sender: item.role === 'user' ? 'user' : 'agent',
              text: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
            }));
            setMessages(restored);
            latestMessagesRef.current = restored;
            setStatusMessage(`Restored chat session #${initialChatId} (${restored.length} messages)`);
          }
        })
        .catch(() => {
          // Silently fail restore on backend offline without clobbering Ink stdout
        });
    }
  }, [initialChatId]);

  // Fetch initial usage from backend
  useEffect(() => {
    backendClient
      .getUsage()
      .then((data) => {
        if (data && typeof data.total_tokens === 'number') {
          setUsage(data);
        }
      })
      .catch(() => {});
  }, []);

  // NO animation hooks here — Spinner/StreamCursor are isolated leaf components
  const managerRef = useRef<ThreatLensAgentManager | null>(null);
  const textBufferRef = useRef<string>('');
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const thinkingBufferRef = useRef<string>('');
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const flushTextBuffer = () => {
    if (textBufferRef.current) {
      const textToAppend = textBufferRef.current;
      textBufferRef.current = '';
      setCurrentAgentText((prev) => prev + textToAppend);
    }
  };

  // Initialize Agent Manager if controller not provided
  useEffect(() => {
    let isMounted = true;

    if (!customController) {
      const manager = new ThreatLensAgentManager();
      managerRef.current = manager;

      manager
        .init()
        .then((ctrl) => {
          if (isMounted) {
            setController(ctrl);
            const stats = manager.getStats();
            setManagerStats(stats);
            setStatusMessage(
              `Ready · ${stats.totalFiles} files · ${stats.totalSymbols} symbols · ${stats.totalDependencies} deps`
            );

            // Fetch usage and limits after agent init
            backendClient
              .getUsage()
              .then((u) => {
                if (isMounted && u && typeof u.total_tokens === 'number') setUsage(u);
              })
              .catch(() => {});

            backendClient
              .getLimit()
              .then((l) => {
                if (isMounted && l && typeof l.total_tokens === 'number') setLimits(l);
              })
              .catch(() => {});
          }
        })
        .catch((err) => {
            const fallback = new MockAgentController();
            setController(fallback);
            setStatusMessage(`Ready (Fallback Mock Mode: ${err?.message || 'Agent Init Error'})`);
        });
    }

    return () => {
      isMounted = false;
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
      }
      if (managerRef.current) {
        managerRef.current.shutdown().catch(() => {});
      }
    };
  }, [customController]);

  const triggerSaveChatHistory = useCallback(async (msgsToSave?: Message[]) => {
    const currentChatId = chatIdRef.current;
    if (!currentChatId) return;

    const messagesToSave = msgsToSave || latestMessagesRef.current;
    if (messagesToSave.length === 0) return;

    if (isSavingHistoryRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    isSavingHistoryRef.current = true;
    pendingSaveRef.current = false;

    const payloadMessages = messagesToSave.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    try {
      await backendClient.saveChatHistory(currentChatId, payloadMessages);
    } catch {
      // Non-blocking: background save failures must never disrupt terminal UI
    } finally {
      isSavingHistoryRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        triggerSaveChatHistory();
      }
    }
  }, []);

  // Subscribe to controller events
  useEffect(() => {
    if (!controller) return;

    const unsubscribe = controller.onEvent((event: AgentEvent) => {
      switch (event.type) {
        case 'token':
          setIsRunning(true);
          if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
            thinkingTimerRef.current = null;
          }
          thinkingBufferRef.current = '';
          setThinkingText('');
          textBufferRef.current += event.delta;
          // 80ms batch buffer — optimal balance between responsiveness and terminal redraw frequency
          if (!flushTimerRef.current) {
            flushTimerRef.current = setTimeout(() => {
              flushTimerRef.current = null;
              flushTextBuffer();
            }, 80);
          }
          break;

        case 'reasoning':
          setIsRunning(true);
          thinkingBufferRef.current = (thinkingBufferRef.current + event.delta).slice(-160);
          if (!thinkingTimerRef.current) {
            thinkingTimerRef.current = setTimeout(() => {
              thinkingTimerRef.current = null;
              setThinkingText(thinkingBufferRef.current);
            }, 100);
          }
          break;

        case 'status':
          setStatusMessage(event.message);
          break;

        case 'tool_start':
          if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
          }
          if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
            thinkingTimerRef.current = null;
          }
          thinkingBufferRef.current = '';
          flushTextBuffer();
          setIsRunning(true);
          setThinkingText('');
          setTools((prev) => [
            ...prev.filter((t) => t.callId !== event.callId),
            {
              callId: event.callId,
              toolName: event.toolName,
              args: event.args,
              status: 'running',
            },
          ]);
          break;

        case 'tool_result':
          setTools((prev) =>
            prev.map((t) =>
              t.callId === event.callId
                ? { ...t, status: event.isError ? 'error' : 'completed', result: event.result }
                : t
            )
          );
          break;

        case 'require_approval':
          if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
          }
          if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
            thinkingTimerRef.current = null;
          }
          thinkingBufferRef.current = '';
          flushTextBuffer();
          setActiveApproval(event.payload);
          setStatusMessage('Waiting for user code modification approval');
          break;

        case 'turn_complete':
          if (event.usage && (event.usage.prompt_tokens || event.usage.completion_tokens)) {
            backendClient
              .patchUsage(event.usage.prompt_tokens, event.usage.completion_tokens)
              .then(() => backendClient.getUsage())
              .then((updated) => {
                if (updated && typeof updated.total_tokens === 'number') {
                  setUsage(updated);
                }
              })
              .catch(() => {});
          }
          break;

        case 'done':
          if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
          }
          if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
            thinkingTimerRef.current = null;
          }
          thinkingBufferRef.current = '';
          flushTextBuffer();
          setIsRunning(false);
          setThinkingText('');
          setActiveApproval(null);
          setStatusMessage(`Finished: ${event.summary}`);
          setCurrentAgentText((prev) => {
            let nextMessages = latestMessagesRef.current;
            const textToSave = prev.trim() || (event.summary && event.summary !== 'Operation cancelled.' ? event.summary : '');
            if (textToSave) {
              const agentMsg: Message = { id: Date.now().toString(), sender: 'agent', text: textToSave };
              nextMessages = [...latestMessagesRef.current, agentMsg];
              setMessages(nextMessages);
              latestMessagesRef.current = nextMessages;
            }
            triggerSaveChatHistory(nextMessages);
            return '';
          });
          break;

        case 'error':
          if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
          }
          if (thinkingTimerRef.current) {
            clearTimeout(thinkingTimerRef.current);
            thinkingTimerRef.current = null;
          }
          thinkingBufferRef.current = '';
          flushTextBuffer();
          setIsRunning(false);
          setThinkingText('');
          setActiveApproval(null);
          setStatusMessage(`Error: ${event.error}`);
          setCurrentAgentText((prev) => {
            const errorText = prev.trim()
              ? `${prev.trim()}\n\n⚠ Error: ${event.error}`
              : `⚠ Error: ${event.error}`;
            const agentMsg: Message = { id: Date.now().toString(), sender: 'agent', text: errorText };
            const nextMessages = [...latestMessagesRef.current, agentMsg];
            setMessages(nextMessages);
            latestMessagesRef.current = nextMessages;
            triggerSaveChatHistory(nextMessages);
            return '';
          });
          break;
      }
    });

    // Handle initial prompt once if provided
    if (initialPrompt && initialPrompt.trim() && !initialPromptSentRef.current) {
      initialPromptSentRef.current = true;
      handleSend(initialPrompt);
    }

    return () => {
      unsubscribe();
    };
  }, [controller, initialPrompt, triggerSaveChatHistory]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend ?? inputQuery).trim();
    if (!q) return;

    // Claude Code-style /theme slash command
    if (q.startsWith('/theme') || q === '/themes') {
      const parts = q.split(/\s+/);
      setInputQuery('');
      if (parts.length === 1 || parts[1] === 'picker' || parts[1] === 'select') {
        push({ type: 'theme' });
        return;
      }
      const requested = parts[1].toLowerCase() as ThemeId;
      if (requested in THEMES) {
        const matched = THEMES[requested];
        setTheme(requested);
        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: q };
        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `🎨 Theme switched to "${matched.name}". Preferences saved to ~/.threatlensgo/config.json.`,
        };
        const updated = [...latestMessagesRef.current, userMsg, agentMsg];
        setMessages(updated);
        latestMessagesRef.current = updated;
        setStatusMessage(`Active theme: ${matched.name}`);
        return;
      } else {
        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: q };
        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `⚠ Unknown theme "${parts[1]}".\nAvailable themes: ${Object.keys(THEMES).join(', ')}.\nType /theme to open the interactive theme picker.`,
        };
        const updated = [...latestMessagesRef.current, userMsg, agentMsg];
        setMessages(updated);
        latestMessagesRef.current = updated;
        return;
      }
    }

    if (isRunning || activeApproval || !controller) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: q };
    const updatedMessages = [...latestMessagesRef.current, userMsg];
    setMessages(updatedMessages);
    latestMessagesRef.current = updatedMessages;

    setInputQuery('');
    setCurrentAgentText('');
    setTools([]);
    setActiveApproval(null);
    setIsRunning(true);

    // Auto-create chat session on first send if no chatId exists yet
    if (!chatIdRef.current) {
      try {
        const title = q.slice(0, 50);
        const newChat = await backendClient.createChat(title);
        if (newChat && typeof newChat.id === 'number') {
          chatIdRef.current = newChat.id;
        }
      } catch {
        // Backend offline or createChat failed: silently continue locally without disrupting TUI layout
      }
    }

    controller.submitQuery(q);
  };

  const handleApproveDiff = (id: string) => {
    if (!controller) return;
    setActiveApproval(null);
    controller.approveDiff(id);
  };

  const handleRejectDiff = (id: string, reason?: string) => {
    if (!controller) return;
    setActiveApproval(null);
    controller.rejectDiff(id, reason);
  };

  const handleCancel = () => {
    if (!controller) return;
    if (activeApproval) {
      setActiveApproval(null);
      controller.rejectDiff(activeApproval.id, 'Approval cancelled');
    } else if (isRunning) {
      controller.cancel();
    } else {
      pop();
    }
  };

  const isInteractive = Boolean(process.stdin?.isTTY);

  useInput(
    (input, key) => {
      if (key.escape && !activeApproval) {
        if (isRunning && controller) {
          controller.cancel();
        } else {
          pop();
        }
      }
    },
    { isActive: isInteractive }
  );

  const usageTokens = usage?.total_tokens ?? 0;
  const limitTokens = limits?.total_tokens ?? 0;
  const hasUsage = usage && typeof usage.total_tokens === 'number';
  const hasLimit = limits && typeof limits.total_tokens === 'number' && limits.total_tokens > 0;
  const usageRatio = hasLimit ? usageTokens / limitTokens : 0;
  const isNearLimit = usageRatio >= 0.8;

  let usageDisplay = '';
  if (hasUsage) {
    if (hasLimit) {
      usageDisplay = ` · Usage: ${usageTokens.toLocaleString()} / ${limitTokens.toLocaleString()} tokens${
        isNearLimit ? ' ⚠ (NEAR LIMIT)' : ''
      }`;
    } else {
      usageDisplay = ` · Usage: ${usageTokens.toLocaleString()} tokens`;
    }
  }

  const subtitle = managerStats
    ? `${managerStats.totalFiles} Files · ${managerStats.totalSymbols} AST Symbols · Model: ${managerStats.modelName}${usageDisplay}`
    : `Deterministic Codebase Intelligence, AST Analysis & Automated Patching${usageDisplay}`;

  const formatSnippet = (text: string, isLatest: boolean): string => {
    if (!text) return '';
    const lines = text.split('\n');
    // Ensure message line height never forces Ink into whole-terminal clearTerminal mode
    const maxLines = isLatest ? Math.max(5, Math.min(14, (rows || 24) - 18)) : 3;
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join('\n') + `\n... (+${lines.length - maxLines} lines)`;
    }
    return text;
  };

  // Keep visible messages bounded to avoid vertical terminal overflow and scroll jitter
  const visibleMessages = isRunning ? messages.slice(-2) : messages.slice(-3);
  const runningTools = tools.filter((t) => t.status === 'running');
  const doneTools = tools.filter((t) => t.status !== 'running');

  return (
    <TerminalLayout
      title="ThreatLens Autonomous Codebase Agent"
      subtitle={subtitle}
      breadcrumb="AGENT"
      accentColor={isNearLimit ? theme.warning : theme.accent}
      statusText={isRunning ? 'PROCESSING' : activeApproval ? 'APPROVAL REQ' : isNearLimit ? 'NEAR LIMIT' : 'IDLE'}
      statusType={activeApproval || isNearLimit ? 'warning' : isRunning ? 'ready' : 'success'}
      keyHints={
        activeApproval
          ? 'a approve · r reject · c cancel'
          : isRunning
          ? 'esc cancel run'
          : 'enter send · esc back'
      }
    >
      <Box flexDirection="column" paddingY={0}>
        {/* Status Bar */}
        <Box flexDirection="row" alignItems="center" marginBottom={1}>
          {isRunning && !currentAgentText ? (
            <Box marginRight={1}>
              <Spinner type="dots" intervalMs={140} color={theme.info} bold />
            </Box>
          ) : isRunning ? (
            <Text color={theme.info} bold>⚡ </Text>
          ) : (
            <Text color={theme.success} bold>✓ </Text>
          )}
          <Text color={theme.textMuted} italic>{statusMessage}</Text>
        </Box>

        {/* Message History — compact, bounded lines */}
        <Box flexDirection="column" marginBottom={0}>
          {visibleMessages.map((msg, idx) => {
            const isLatest = idx === visibleMessages.length - 1;
            return (
              <Box
                key={msg.id}
                flexDirection="column"
                marginY={0}
                paddingX={1}
                borderStyle="round"
                borderColor={msg.sender === 'user' ? theme.userMsg : theme.agentMsg}
              >
                <Text bold color={msg.sender === 'user' ? theme.userMsg : theme.agentMsg}>
                  {msg.sender === 'user' ? '◈ You:' : '⬡ Agent:'}
                </Text>
                <Text color={theme.text}>{formatSnippet(msg.text, isLatest)}</Text>
              </Box>
            );
          })}
        </Box>

        {/* Running Tool Invocations */}
        {runningTools.length > 0 ? (
          <Box flexDirection="column" marginY={1}>
            <Text color={theme.secondary} bold>
              ⚡ Active Tools ({runningTools.length})
            </Text>
            {runningTools.map((t) => (
              <ToolBadge
                key={t.callId}
                toolName={t.toolName}
                args={t.args}
                status={t.status}
                result={t.result}
              />
            ))}
          </Box>
        ) : null}

        {/* Completed tools (compact, shows latest progress) */}
        {doneTools.length > 0 ? (
          <Box flexDirection="column" marginY={0}>
            {doneTools.slice(-3).map((t) => (
              <ToolBadge
                key={t.callId}
                toolName={t.toolName}
                args={t.args}
                status={t.status}
                result={t.result}
              />
            ))}
          </Box>
        ) : null}

        {/* Live Thinking / Reasoning Snippet */}
        {thinkingText && isRunning && !currentAgentText ? (
          <Box flexDirection="column" marginY={1} paddingX={1}>
            <Text color={theme.textMuted} italic dimColor>
              💭 Thinking: {thinkingText.trim()}...
            </Text>
          </Box>
        ) : null}

        {/* Diff Approval Modal */}
        {activeApproval ? (
          <Box marginY={1}>
            <DiffApprovalModal
              payload={activeApproval}
              onApprove={() => handleApproveDiff(activeApproval.id)}
              onReject={() => handleRejectDiff(activeApproval.id, 'User rejected in TUI')}
              onCancel={handleCancel}
            />
          </Box>
        ) : null}

        {/* Agent Streaming Response — inline cursor to eliminate flex layout re-wrapping */}
        {currentAgentText ? (
          <Box
            flexDirection="column"
            marginY={1}
            paddingX={1}
            borderStyle="round"
            borderColor={theme.agentMsg}
          >
            <Text bold color={theme.agentMsg}>⬡ Agent:</Text>
            <Text color={theme.text}>
              {currentAgentText}
              {isRunning ? <Text color={theme.info} bold> ▌</Text> : null}
            </Text>
          </Box>
        ) : null}

        {/* Input Prompt */}
        {!activeApproval && (
          <Box flexDirection="column" marginTop={1}>
            <Box
              borderStyle="round"
              borderColor={isRunning ? theme.secondary : theme.highlight}
              paddingX={1}
              flexDirection="row"
            >
              <Text bold color={isRunning ? theme.secondary : theme.highlight}>{'> '}</Text>
              <TextInput
                value={inputQuery}
                onChange={setInputQuery}
                onSubmit={() => handleSend()}
                focus={!isRunning && isInteractive}
                placeholder={
                  isRunning
                    ? 'Agent is executing tools...'
                    : 'Ask agent or type /theme to switch appearance...'
                }
              />
            </Box>
            <Box marginTop={0} paddingX={1} flexDirection="row" justifyContent="space-between">
              <Text color={theme.textMuted} dimColor>
                {'/theme · audit /api/search · fix sql injection · find symbols'}
              </Text>
              <Text color={theme.textMuted} dimColor>esc cancel / back</Text>
            </Box>
          </Box>
        )}
      </Box>
    </TerminalLayout>
  );
};

export default AgentChatScreen;
