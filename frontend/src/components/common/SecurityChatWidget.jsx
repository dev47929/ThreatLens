import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bot,
  Send,
  X,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Terminal,
  Square,
  Lock,
  ChevronDown,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

// Backend endpoints with proxy and direct port 8000 fallbacks
const PRIMARY_STREAM_URL = "/security-chat/stream";
const FALLBACK_STREAM_URL = "http://localhost:8000/security-chat/stream";
const PRIMARY_KEY_URL = "/security-chat/api-key/token";
const FALLBACK_KEY_URL = "http://localhost:8000/security-chat/api-key/token";

const STARTER_PROMPTS = [
  {
    label: "SQL Injection Prevention",
    query: "How do I identify and mitigate SQL Injection in REST API endpoints?",
  },
  {
    label: "OWASP Top 10 Risks",
    query: "What are the most critical OWASP Top 10 vulnerabilities for modern web apps?",
  },
  {
    label: "JWT Security Hardening",
    query: "How to prevent JWT authentication bypass and signature spoofing attacks?",
  },
  {
    label: "SSRF Attack Vectors",
    query: "Explain Server-Side Request Forgery (SSRF) and how to configure safe egress controls.",
  },
];

export default function SecurityChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState("fetching");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch or verify streaming API key on mount
  useEffect(() => {
    async function initApiKey() {
      try {
        let res = await fetch(PRIMARY_KEY_URL).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(FALLBACK_KEY_URL).catch(() => null);
        }
        if (res && res.ok) {
          const data = await res.json();
          if (data.api_key) {
            setApiKey(data.api_key);
            setApiKeyStatus("verified");
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch API key dynamically, using system default.", err);
      }
      // Fallback system streaming key
      setApiKey("tl_stream_threatlens_secure_live_key_2026");
      setApiKeyStatus("default");
    }

    initApiKey();
  }, []);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  // Stop active token generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Clear chat conversation
  const handleClearChat = () => {
    handleStopGeneration();
    setMessages([]);
    toast.info("Conversation cleared");
  };

  // Copy assistant response
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Send message and stream tokens
  const handleSendMessage = async (textToSend = null) => {
    const prompt = (textToSend || inputQuery).trim();
    if (!prompt || isStreaming) return;

    setInputQuery("");

    // Add user message and blank assistant message placeholder
    const userMsg = { role: "user", content: prompt, timestamp: new Date() };
    const assistantMsgIndex = messages.length + 1;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { role: "assistant", content: "", timestamp: new Date() },
    ]);

    setIsStreaming(true);

    const historyPayload = messages
      .filter((m) => m.content)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    const requestBody = {
      message: prompt,
      history: historyPayload,
      api_key: apiKey,
    };

    abortControllerRef.current = new AbortController();

    try {
      let response = await fetch(PRIMARY_STREAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      }).catch(() => null);

      // If proxy failed, try direct port 8000 fallback
      if (!response || !response.ok) {
        response = await fetch(FALLBACK_STREAM_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Server error (${response.status}) while streaming.`
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                accumulatedText += `\n\n⚠️ **Error:** ${parsed.error}`;
              } else if (parsed.token) {
                accumulatedText += parsed.token;
              }

              // Update assistant message incrementally
              setMessages((prev) => {
                const copy = [...prev];
                if (copy[assistantMsgIndex]) {
                  copy[assistantMsgIndex] = {
                    ...copy[assistantMsgIndex],
                    content: accumulatedText,
                  };
                }
                return copy;
              });
            } catch {
              // Ignore non-json or malformed SSE line
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // User aborted intentionally
      } else {
        const errorMsg =
          err.message || "Failed to reach ThreatLens backend. Is backend running on port 8000?";
        setMessages((prev) => {
          const copy = [...prev];
          if (copy[assistantMsgIndex]) {
            copy[assistantMsgIndex] = {
              ...copy[assistantMsgIndex],
              content:
                copy[assistantMsgIndex].content ||
                `⚠️ **Connection Alert:** ${errorMsg}\n\nPlease verify that the ThreatLens backend server is active at \`http://localhost:8000\`.`,
            };
          }
          return copy;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to render formatted markdown-like blocks
  const renderMessageContent = (content) => {
    const isSecurityNotice =
      content.includes("ThreatLens Security Policy Notice") ||
      content.includes("ThreatLens Security Policy");

    return (
      <div className="space-y-2">
        {isSecurityNotice && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Security Domain Enforcement Notice</span>
          </div>
        )}
        <div className="markdown-content text-sm text-slate-200 leading-relaxed max-w-none">
          <Streamdown>{content}</Streamdown>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Closed State: Floating Icon */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 group"
          >
            {/* Pulsing ring */}
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-emerald-500/30 blur-md opacity-70 group-hover:opacity-100 animate-pulse transition duration-500" />

            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open ThreatLens Security Chatbot"
              className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#0a0f1d] border border-cyan-500/40 text-cyan-400 shadow-2xl shadow-cyan-950/80 hover:border-cyan-400 hover:text-cyan-300 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <div className="relative">
                <Shield className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                <Bot className="w-3.5 h-3.5 text-emerald-400 absolute -bottom-1 -right-1" />
              </div>

              {/* Status Ping */}
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0a0f1d]" />
              </span>
            </button>

            {/* Hover Tooltip */}
            <div className="absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap px-3 py-1.5 rounded-lg bg-[#0f172a] border border-cyan-500/30 text-xs font-medium text-cyan-300 shadow-xl shadow-black/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Security Intelligence AI
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opened State: Interactive Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh] flex flex-col rounded-2xl bg-[#090d16]/95 border border-cyan-500/30 shadow-2xl shadow-black/90 backdrop-blur-xl overflow-hidden font-sans text-slate-200"
          >
            {/* Window Header */}
            <div className="relative px-4 py-3.5 bg-[#0e1424] border-b border-cyan-500/20 flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Shield className="w-5 h-5 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white tracking-wide">
                      ThreatLens Security AI
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  aria-label="Clear chat"
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-lg transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Minimize chat"
                  aria-label="Close chat"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/30 via-[#0f172a]/60 to-blue-950/20 border border-cyan-500/20 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      Cybersecurity Intelligence Agent
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-[280px] mx-auto">
                      Specialized strictly for security auditing, attack telemetry,
                      OWASP defenses, and vulnerability analysis.
                    </p>
                  </div>

                  {/* Starter Prompts */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-1">
                      Quick Security Inquiries:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {STARTER_PROMPTS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(item.query)}
                          className="text-left text-xs p-2.5 rounded-lg bg-[#0e1526]/80 hover:bg-cyan-950/40 border border-white/5 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 transition duration-150 flex items-center justify-between group"
                        >
                          <span className="truncate">{item.label}</span>
                          <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition text-[10px]">
                            Ask →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                      {msg.role === "assistant" ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-cyan-400" />
                          <span className="font-semibold text-cyan-400">
                            ThreatLens AI
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">You</span>
                      )}
                    </div>

                    <div
                      className={`relative group max-w-[88%] p-3.5 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-cyan-600/90 to-blue-700/90 text-white rounded-tr-none shadow-md shadow-cyan-900/30"
                          : "bg-[#0f172a]/90 border border-white/10 text-slate-200 rounded-tl-none shadow-md shadow-black/40"
                      }`}
                    >
                      {msg.content ? (
                        renderMessageContent(msg.content)
                      ) : (
                        <div className="flex items-center gap-1.5 py-1 text-xs text-cyan-400">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-75" />
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150" />
                          <span className="ml-1 text-[11px] text-slate-400">
                            Streaming response...
                          </span>
                        </div>
                      )}

                      {/* Copy button for completed assistant messages */}
                      {msg.role === "assistant" && msg.content && !isStreaming && (
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          title="Copy text"
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-[#1e293b] border border-cyan-500/30 text-slate-300 hover:text-white transition shadow"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-300" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Control Bar */}
            <div className="p-3 bg-[#0c1220] border-t border-cyan-500/20">
              {isStreaming ? (
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Receiving streaming tokens...
                  </span>
                  <button
                    onClick={handleStopGeneration}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              ) : null}

              <div className="relative flex items-center">
                <textarea
                  ref={inputRef}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask any cybersecurity or vulnerability question..."
                  rows={1}
                  disabled={isStreaming}
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-[#070a12] border border-cyan-500/30 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none transition"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputQuery.trim() || isStreaming}
                  className="absolute right-1.5 p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white transition duration-150 shadow-md shadow-cyan-900/40"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>🛡️ Restricted to cybersecurity inquiries</span>
                <span>Enter ↵ to send</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
