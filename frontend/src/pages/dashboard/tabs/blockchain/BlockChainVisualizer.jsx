import React, { useRef } from "react";
import {
  FolderGit2,
  GitCommit,
  Flame,
  BarChart3,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Anchor,
  ArrowRight,
  CheckCircle2,
  Lock,
  Hash,
  Clock,
  Layers,
  FileCode,
  RefreshCw,
} from "lucide-react";
import { timeAgo, formatBytes, severityColor } from "@/lib/api";

export default function BlockChainVisualizer({
  blocks = [],
  activeBlockIndex = null,
  onSelectBlock,
  verificationScanningIndex = null,
  tamperedBlockIndex = null,
}) {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -400 : 400;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const scrollToGenesis = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  const scrollToTip = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  };

  if (!blocks || blocks.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-[#080d1a]/50 rounded-2xl border border-[#1b2537]">
        <Layers className="w-10 h-10 text-[#8a99ad] opacity-40 animate-pulse" />
        <div className="text-sm font-mono text-white">No Blocks Available</div>
        <p className="text-xs font-mono text-[#8a99ad] max-w-sm">
          Initialize this chain by creating a new integrity checkpoint or select another chain.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl bg-[#080d1a]/95 border border-[#1b2537] shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* ── VISUALIZER CONTROLS & HEADER ── */}
      <div className="px-5 py-3.5 border-b border-[#182335] bg-[#0c1322]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
          </div>
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Sequential Cryptographic Chain
          </span>
          <span className="text-[11px] font-mono text-[#8a99ad]">
            ({blocks.length} interconnected blocks)
          </span>
        </div>

        {/* Navigation jump and scroll controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={scrollToGenesis}
            className="px-2.5 py-1 rounded-md bg-[#131c2c] border border-[#202d44] hover:border-[#38bdf8]/40 text-[#8a99ad] hover:text-white font-mono text-[10px] transition-all cursor-pointer"
            title="Scroll to Genesis Block #0"
          >
            Genesis #0
          </button>
          <button
            onClick={scrollToTip}
            className="px-2.5 py-1 rounded-md bg-[#131c2c] border border-[#202d44] hover:border-[#38bdf8]/40 text-[#8a99ad] hover:text-white font-mono text-[10px] transition-all cursor-pointer"
            title="Scroll to latest block"
          >
            Tip #{blocks.length - 1}
          </button>
          <div className="h-4 w-px bg-[#202d44] mx-1" />
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg bg-[#131c2c] border border-[#202d44] hover:border-white/20 text-[#8a99ad] hover:text-white transition-all cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg bg-[#131c2c] border border-[#202d44] hover:border-white/20 text-[#8a99ad] hover:text-white transition-all cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── HORIZONTAL SCROLL RIBBON ── */}
      <div
        ref={scrollContainerRef}
        className="p-6 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-[#1e2a3f] scrollbar-track-transparent"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex items-center gap-0 min-w-max py-2">
          {blocks.map((block, idx) => {
            const isGenesis = block.type === "genesis";
            const isRepo = block.type === "repo";
            const isCommit = block.type === "commit_analysis";
            const isAttack = ["ddos", "data_burning", "injection"].includes(block.type);
            const isUsage = block.type === "usage";
            const isCustom = block.type.startsWith("custom");

            const isScanning = verificationScanningIndex === block.index;
            const isTampered =
              tamperedBlockIndex !== null && block.index >= tamperedBlockIndex;
            const isTargetTamper = tamperedBlockIndex === block.index;
            const isSelected = activeBlockIndex === block.index;

            // Type configuration
            const typeConfig = {
              genesis: {
                label: "Genesis Block",
                icon: Anchor,
                bg: "from-amber-500/10 to-amber-950/20",
                badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                border: "hover:border-amber-400/60",
                accent: "#f59e0b",
              },
              repo: {
                label: "Repository State",
                icon: FolderGit2,
                bg: "from-blue-500/10 to-blue-950/20",
                badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                border: "hover:border-blue-400/60",
                accent: "#38bdf8",
              },
              commit_analysis: {
                label: "Commit Analysis",
                icon: GitCommit,
                bg: "from-purple-500/10 to-purple-950/20",
                badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                border: "hover:border-purple-400/60",
                accent: "#c084fc",
              },
              attack: {
                label: "Attack / DAST Trace",
                icon: Flame,
                bg: "from-rose-500/10 to-rose-950/20",
                badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
                border: "hover:border-rose-400/60",
                accent: "#f43f5e",
              },
              usage: {
                label: "Token Consumption",
                icon: BarChart3,
                bg: "from-emerald-500/10 to-emerald-950/20",
                badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                border: "hover:border-emerald-400/60",
                accent: "#22c55e",
              },
              custom: {
                label: "Security Audit Gate",
                icon: Sparkles,
                bg: "from-cyan-500/10 to-cyan-950/20",
                badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                border: "hover:border-cyan-400/60",
                accent: "#06b6d4",
              },
            };

            const cfg = isGenesis
              ? typeConfig.genesis
              : isRepo
              ? typeConfig.repo
              : isCommit
              ? typeConfig.commit_analysis
              : isAttack
              ? typeConfig.attack
              : isUsage
              ? typeConfig.usage
              : typeConfig.custom;

            const Icon = cfg.icon;

            return (
              <React.Fragment key={block.index}>
                {/* ── BLOCK CARD ── */}
                <div
                  onClick={() => onSelectBlock?.(block)}
                  className={`relative w-80 shrink-0 p-5 rounded-2xl bg-gradient-to-b ${cfg.bg} bg-[#0b101b] border transition-all duration-300 cursor-pointer group select-none ${
                    isTampered
                      ? "border-[#f43f5e] shadow-[0_0_35px_rgba(244,63,94,0.35)]"
                      : isScanning
                      ? "border-[#38bdf8] shadow-[0_0_40px_rgba(56,189,248,0.4)] scale-[1.02]"
                      : isSelected
                      ? "border-[#2962FF] ring-2 ring-[#2962FF]/50 shadow-[0_0_30px_rgba(41,98,255,0.3)]"
                      : `border-[#1e2a3e] ${cfg.border} hover:shadow-[0_10px_30px_rgba(0,0,0,0.7)] hover:-translate-y-1`
                  }`}
                >
                  {/* Active Laser Scan Sweep Line */}
                  {isScanning && (
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent animate-pulse rounded-t-2xl shadow-[0_0_15px_#38bdf8]" />
                  )}

                  {/* Top Bar: Index & Type Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#182335]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                        style={{
                          background: `${cfg.accent}20`,
                          border: `1px solid ${cfg.accent}50`,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: cfg.accent }} />
                      </div>
                      <span className="font-mono text-sm font-extrabold text-white tracking-wide">
                        Block #{block.index}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isTampered ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{isTargetTamper ? "Corrupted" : "Broken Link"}</span>
                        </span>
                      ) : isScanning ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin text-[#38bdf8]" />
                          <span>Auditing...</span>
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${cfg.badge}`}
                        >
                          {block.type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Domain-Specific Summary Content */}
                  <div className="py-3.5 min-h-[92px] flex flex-col justify-center font-mono">
                    {isGenesis && (
                      <div className="space-y-1 text-xs">
                        <div className="text-white font-bold truncate">
                          {block.data?.account?.name || "Genesis Node Account"}
                        </div>
                        <div className="text-[11px] text-[#8a99ad] truncate">
                          Handle: @{block.data?.account?.handle || "atharv"} · UID: #{block.data?.account?.id || 1}
                        </div>
                        <div className="text-[10px] text-[#38bdf8] flex items-center gap-1 mt-1">
                          <Lock className="w-3 h-3 text-[#22c55e]" />
                          <span>Session Anchored · Zero Predecessor</span>
                        </div>
                      </div>
                    )}

                    {isRepo && (
                      <div className="space-y-1 text-xs">
                        <div className="text-white font-bold truncate">
                          {block.data?.name || "ThreatLens"}
                        </div>
                        <div className="text-[11px] text-[#8a99ad]">
                          Branch: <span className="text-[#38bdf8]">{block.data?.default_branch || "main"}</span> · {block.data?.commit_count || 0} commits
                        </div>
                        <div className="text-[10px] text-[#8a99ad]">
                          {block.data?.files_total || 0} files · {formatBytes(block.data?.total_size || 0)}
                        </div>
                      </div>
                    )}

                    {isCommit && (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-white font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-[#1e2a3e] text-[#38bdf8] text-[10px]">
                            {block.data?.short_sha || block.data?.sha?.slice(0, 7) || "96e2a87"}
                          </span>
                          <span className="text-[10px] text-[#22c55e] font-semibold">
                            Risk: {block.data?.risk_score || 18}/100
                          </span>
                        </div>
                        <div className="text-[11px] text-[#d8e2e8] line-clamp-2 leading-tight mt-0.5">
                          {block.data?.message || "fix(auth): sanitize user input in login endpoint"}
                        </div>
                      </div>
                    )}

                    {isAttack && (
                      <div className="space-y-1 text-xs">
                        <div className="text-white font-bold uppercase tracking-wider text-[11px] flex items-center gap-1 text-[#f43f5e]">
                          <Flame className="w-3 h-3" />
                          <span>{block.data?.attack_type || block.type.toUpperCase()}</span>
                        </div>
                        <div className="text-[10px] text-[#8a99ad] truncate">
                          Target: {block.data?.target_endpoint || "https://threatlens.io/api"}
                        </div>
                        <div className="text-[10px] text-[#22c55e] flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mitigated · Rate-Limit Gated</span>
                        </div>
                      </div>
                    )}

                    {isUsage && (
                      <div className="space-y-1 text-xs">
                        <div className="text-white font-bold">
                          Tier: <span className="text-[#38bdf8]">{block.data?.tier || "Enterprise Pro"}</span>
                        </div>
                        <div className="text-[11px] text-[#8a99ad]">
                          Tokens: {block.data?.tokens_consumed?.toLocaleString() || "1.4M"} consumed
                        </div>
                        <div className="text-[10px] text-[#22c55e]">
                          {block.data?.tokens_remaining?.toLocaleString() || "3.5M"} remaining quota
                        </div>
                      </div>
                    )}

                    {isCustom && (
                      <div className="space-y-1 text-xs">
                        <div className="text-white font-bold truncate">
                          {block.data?.checkpoint_title || "Pre-Release Security Gate"}
                        </div>
                        <div className="text-[11px] text-[#8a99ad] line-clamp-2">
                          {block.data?.notes || "All critical findings remediated, SHA-256 chain locked."}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Cryptographic Hash Footprint */}
                  <div className="pt-3 border-t border-[#182335] space-y-1.5 font-mono text-[10.5px]">
                    <div className="flex items-center justify-between text-[#8a99ad]">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#6EA8DA]" />
                        <span>Current:</span>
                      </span>
                      <span className="text-[#38bdf8] font-bold">
                        {block.current.slice(0, 12)}...
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#8a99ad]">
                      <span>Prev:</span>
                      <span className={block.prev ? "text-[#8a99ad]" : "text-amber-400 font-bold"}>
                        {block.prev ? `${block.prev.slice(0, 10)}...` : "00000000 (Origin)"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#71717a] pt-1 text-[9.5px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(block.created_at)}</span>
                      </span>
                      <span className="text-[#6EA8DA] group-hover:underline flex items-center gap-0.5">
                        <span>Inspect</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── CRYPTOGRAPHIC CONNECTOR LINK ── */}
                {idx < blocks.length - 1 && (
                  <div className="shrink-0 flex flex-col items-center justify-center px-2 py-4 relative group/conn select-none">
                    {/* Glowing Line */}
                    <div className="w-10 h-0.5 bg-gradient-to-r from-[#2962FF] to-[#38bdf8] relative flex items-center justify-center shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                      {/* Pulse Node */}
                      <div className="w-4 h-4 rounded-full bg-[#0b101b] border-2 border-[#38bdf8] flex items-center justify-center shadow-[0_0_8px_rgba(56,189,248,0.8)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                      </div>
                    </div>

                    {/* Cryptographic Link Tooltip Badge */}
                    <div className="mt-2 text-[8.5px] font-mono text-[#8a99ad] uppercase tracking-tighter text-center bg-[#101726] border border-[#202d44] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                      SHA-256 Link
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
