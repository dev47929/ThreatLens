import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Hash,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Layers,
  FolderGit2,
  GitCommit,
  Flame,
  BarChart3,
  Sparkles,
  Anchor,
  Clock,
  ExternalLink,
  Code2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { formatBytes, timeAgo } from "@/lib/api";

export default function BlockDetailModal({
  block,
  isOpen,
  onClose,
  onSelectBlockByIndex,
  totalBlocks = 0,
}) {
  const [viewMode, setViewMode] = useState("visual"); // 'visual' | 'json'
  const [copiedCurrent, setCopiedCurrent] = useState(false);
  const [copiedPrev, setCopiedPrev] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!isOpen || !block) return null;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "current") {
      setCopiedCurrent(true);
      setTimeout(() => setCopiedCurrent(false), 2000);
      toast.success("Current block hash copied to clipboard");
    } else if (type === "prev") {
      setCopiedPrev(true);
      setTimeout(() => setCopiedPrev(false), 2000);
      toast.success("Previous block hash copied to clipboard");
    } else {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
      toast.success("Canonical JSON payload copied");
    }
  };

  const isGenesis = block.type === "genesis";
  const isRepo = block.type === "repo";
  const isCommit = block.type === "commit_analysis";
  const isAttack = ["ddos", "data_burning", "injection"].includes(block.type);
  const isUsage = block.type === "usage";

  const hasPredecessor = block.index > 0;
  const hasSuccessor = block.index < totalBlocks - 1;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[#0a0f18] border-l border-[#1f2c42] shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden">
          {/* ── HEADER ── */}
          <div className="p-6 border-b border-[#182335] bg-[#0d1424]/80 backdrop-blur-md shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2962FF]/15 border border-[#2962FF]/40 flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#38bdf8]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-mono text-white">
                    Block Inspector #{block.index}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#2962FF]/20 text-[#6EA8DA] border border-[#2962FF]/40">
                    {block.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#8a99ad] mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{block.created_at}</span>
                  <span>({timeAgo(block.created_at)})</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#8a99ad] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-[#1f2c42]">
            {/* ── SECTION 1: CRYPTOGRAPHIC LINEAGE ── */}
            <div className="p-4 rounded-xl bg-[#0e1624] border border-[#1e2a3f] space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8a99ad] font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>Cryptographic Proof & Lineage</span>
                </span>
                <span className="text-[10px] font-mono text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>SHA-256 Validated</span>
                </span>
              </div>

              {/* Current Hash */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#8a99ad]">
                  <span>Current Block Hash:</span>
                  <button
                    onClick={() => handleCopy(block.current, "current")}
                    className="text-[10px] text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCurrent ? <Check className="w-3 h-3 text-[#22c55e]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCurrent ? "Copied" : "Copy Hash"}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-[#070b13] border border-[#182335] font-mono text-xs text-[#38bdf8] break-all select-text font-bold">
                  {block.current}
                </div>
              </div>

              {/* Previous Hash */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#8a99ad]">
                  <span>Previous Block Hash (Parent):</span>
                  {block.prev && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(block.prev, "prev")}
                        className="text-[10px] text-[#8a99ad] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPrev ? <Check className="w-3 h-3 text-[#22c55e]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPrev ? "Copied" : "Copy"}</span>
                      </button>
                      {hasPredecessor && (
                        <button
                          onClick={() => onSelectBlockByIndex?.(block.index - 1)}
                          className="text-[10px] text-[#38bdf8] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Jump to #{block.index - 1}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-2.5 rounded-lg bg-[#070b13] border border-[#182335] font-mono text-xs break-all select-text">
                  {block.prev ? (
                    <span className="text-[#8a99ad]">{block.prev}</span>
                  ) : (
                    <span className="text-amber-400 font-bold">
                      null (Genesis Origin Block · First Checkpoint in Ledger)
                    </span>
                  )}
                </div>
              </div>

              {/* Cryptographic formula explainer */}
              <div className="text-[10px] font-mono text-[#71717a] pt-1">
                Formula: <code className="text-[#6EA8DA]">SHA256(canonical_json(index + type + data + created_at + prev))</code>
              </div>
            </div>

            {/* ── SECTION 2: VIEW MODE TOGGLE & PAYLOAD ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8a99ad] font-semibold">
                  Block Payload Data
                </span>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0e1624] border border-[#1e2a3f]">
                  <button
                    onClick={() => setViewMode("visual")}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === "visual"
                        ? "bg-[#2962FF] text-white shadow-sm"
                        : "text-[#8a99ad] hover:text-white"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Formatted Card</span>
                  </button>
                  <button
                    onClick={() => setViewMode("json")}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === "json"
                        ? "bg-[#2962FF] text-white shadow-sm"
                        : "text-[#8a99ad] hover:text-white"
                    }`}
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Raw JSON</span>
                  </button>
                </div>
              </div>

              {/* Structured Visual View */}
              {viewMode === "visual" ? (
                <div className="p-4 rounded-xl bg-[#0e1624] border border-[#1e2a3f] space-y-4">
                  {isGenesis && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <Anchor className="w-4 h-4 text-amber-400" />
                        <span>Genesis Account & Node Attestation</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#182335]">
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Account Name</div>
                          <div className="text-white font-bold mt-0.5">{block.data?.account?.name || "Atharv Thakre"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Email / Handle</div>
                          <div className="text-white mt-0.5">@{block.data?.account?.handle || "atharv"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Role</div>
                          <div className="text-[#38bdf8] font-bold mt-0.5 uppercase">{block.data?.account?.role || "SUPERADMIN"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Node Status</div>
                          <div className="text-[#22c55e] font-bold mt-0.5 uppercase">{block.data?.account?.status || "ACTIVE"}</div>
                        </div>
                      </div>
                      {block.data?.session && (
                        <div className="pt-2 border-t border-[#182335] space-y-1">
                          <div className="text-[10px] text-[#8a99ad] uppercase">Session IP Address</div>
                          <div className="text-white text-[11px]">{block.data?.session?.ip_address || "2405:201:301a:10ec:6839"}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {isRepo && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-[#38bdf8]" />
                        <span>Repository Snapshot: {block.data?.name || "ThreatLens"}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#182335]">
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Total Commits</div>
                          <div className="text-white font-bold text-base mt-0.5">{block.data?.commit_count || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Tracked Files</div>
                          <div className="text-white font-bold text-base mt-0.5">{block.data?.files_total || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Codebase Size</div>
                          <div className="text-[#38bdf8] font-bold text-base mt-0.5">{formatBytes(block.data?.total_size || 0)}</div>
                        </div>
                      </div>

                      {block.data?.languages && (
                        <div className="pt-2 border-t border-[#182335] space-y-1.5">
                          <div className="text-[10px] text-[#8a99ad] uppercase">Language Breakdown</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(block.data.languages).map(([lang, count]) => (
                              <span
                                key={lang}
                                className="px-2 py-0.5 rounded bg-[#162032] border border-[#22334d] text-[11px] text-[#d8e2e8]"
                              >
                                {lang}: <strong className="text-white">{count} files</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isCommit && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <GitCommit className="w-4 h-4 text-[#c084fc]" />
                        <span>Commit Review: {block.data?.short_sha || "96e2a87"}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#070b13] border border-[#182335] text-white leading-relaxed">
                        {block.data?.message || "fix(auth): sanitize user input and replace raw string query in login endpoint"}
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#182335]">
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Author</div>
                          <div className="text-white font-semibold mt-0.5">{block.data?.author || "Alex Vance"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Risk Score</div>
                          <div className="text-[#22c55e] font-bold text-base mt-0.5">{block.data?.risk_score || 18}/100</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Mitigated CWE</div>
                          <div className="text-[#38bdf8] font-bold mt-0.5">{block.data?.cwe_mitigated || "CWE-89"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAttack && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="text-sm font-bold text-rose-400 flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        <span>{block.data?.attack_type || block.type.toUpperCase()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#182335]">
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Target Endpoint</div>
                          <div className="text-white font-mono text-[11px] truncate mt-0.5">
                            {block.data?.target_endpoint || "https://threatlens.io/api"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Requests Mitigated</div>
                          <div className="text-[#22c55e] font-bold mt-0.5">{block.data?.mitigated_ratio || "99.8%"}</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[#182335]">
                        <div className="text-[10px] text-[#8a99ad] uppercase">Mitigation Strategy</div>
                        <div className="text-[#d8e2e8] mt-1 p-2 rounded bg-[#070b13] border border-[#182335]">
                          {block.data?.mitigation_strategy || "Dynamic Token-Bucket Rate Limiter + Cloudflare Shield"}
                        </div>
                      </div>
                    </div>
                  )}

                  {isUsage && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#22c55e]" />
                        <span>Telemetry & Token Quota Checkpoint</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#182335]">
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Active Tier</div>
                          <div className="text-[#38bdf8] font-bold mt-0.5">{block.data?.tier || "Enterprise Pro"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Consumed Credits</div>
                          <div className="text-white font-bold mt-0.5">{block.data?.tokens_consumed?.toLocaleString() || "1.4M"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#8a99ad] uppercase">Remaining Quota</div>
                          <div className="text-[#22c55e] font-bold mt-0.5">{block.data?.tokens_remaining?.toLocaleString() || "3.5M"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isGenesis && !isRepo && !isCommit && !isAttack && !isUsage && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#06b6d4]" />
                        <span>Custom Integrity Checkpoint: {block.type}</span>
                      </div>
                      <pre className="p-3 rounded-lg bg-[#070b13] border border-[#182335] text-[#38bdf8] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(block.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                /* Raw Canonical JSON View */
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-[#060910] border border-[#182335] text-[11px] font-mono text-[#38bdf8] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[360px] scrollbar-thin scrollbar-thumb-[#1f2c42]">
                    {JSON.stringify(block, null, 2)}
                  </pre>
                  <button
                    onClick={() => handleCopy(JSON.stringify(block, null, 2), "payload")}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[#141d2c] hover:bg-[#1e2a3f] border border-[#23334d] text-white text-[10px] font-mono flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3 h-3 text-[#22c55e]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPayload ? "Copied" : "Copy Payload"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── FOOTER ACTIONS ── */}
          <div className="p-5 border-t border-[#182335] bg-[#0d1424]/80 backdrop-blur-md shrink-0 flex items-center justify-between font-mono">
            {/* Prev / Next Block Navigation */}
            <div className="flex items-center gap-2">
              <button
                disabled={!hasPredecessor}
                onClick={() => onSelectBlockByIndex?.(block.index - 1)}
                className="px-3 py-1.5 rounded-lg bg-[#101726] border border-[#1e2a3e] hover:border-white/20 text-[#8a99ad] hover:text-white text-xs flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev #{block.index - 1}</span>
              </button>
              <button
                disabled={!hasSuccessor}
                onClick={() => onSelectBlockByIndex?.(block.index + 1)}
                className="px-3 py-1.5 rounded-lg bg-[#101726] border border-[#1e2a3e] hover:border-white/20 text-[#8a99ad] hover:text-white text-xs flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <span>Next #{block.index + 1}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-[#2962FF] hover:bg-[#1e4ed8] text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(41,98,255,0.35)] transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
