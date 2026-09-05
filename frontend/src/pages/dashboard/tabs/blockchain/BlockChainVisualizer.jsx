import React, { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";

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
      <div className="py-16 flex flex-col items-center justify-center text-center space-y-2 bg-[#0b1019] rounded-xl border border-[#1e293b]">
        <Layers className="w-8 h-8 text-[#64748b] opacity-50" />
        <div className="text-sm font-medium text-white">No Blocks Found</div>
        <p className="text-xs text-[#64748b] max-w-sm">
          Create a new checkpoint or select another chain from the selector.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl bg-[#0b1019] border border-[#1e293b] overflow-hidden">
      {/* ── VISUALIZER CONTROLS & HEADER ── */}
      <div className="px-4 py-3 border-b border-[#1b2434] bg-[#0b1019] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">
            Blocks
          </span>
          <span className="text-xs text-[#64748b]">
            ({blocks.length})
          </span>
        </div>

        {/* Navigation jump and scroll controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={scrollToGenesis}
            className="px-2 py-1 rounded bg-[#111827] border border-[#1e293b] hover:border-[#334155] text-[#94a3b8] hover:text-white text-xs transition-colors cursor-pointer"
            title="Scroll to Genesis Block"
          >
            First
          </button>
          <button
            onClick={scrollToTip}
            className="px-2 py-1 rounded bg-[#111827] border border-[#1e293b] hover:border-[#334155] text-[#94a3b8] hover:text-white text-xs transition-colors cursor-pointer"
            title="Scroll to Latest Block"
          >
            Latest
          </button>
          <div className="h-3.5 w-px bg-[#1e293b] mx-0.5" />
          <button
            onClick={() => scroll("left")}
            className="p-1 rounded bg-[#111827] border border-[#1e293b] hover:border-[#334155] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1 rounded bg-[#111827] border border-[#1e293b] hover:border-[#334155] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── HORIZONTAL SCROLL RIBBON ── */}
      <div
        ref={scrollContainerRef}
        className="p-5 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-[#1e293b] scrollbar-track-transparent"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex items-center gap-0 min-w-max py-1">
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

            const formatTypeLabel = (type) => {
              switch (type) {
                case "genesis":
                  return "Genesis";
                case "repo":
                  return "Repository";
                case "commit_analysis":
                  return "Commit";
                case "usage":
                  return "Usage";
                default:
                  return isAttack ? "Attack" : "Checkpoint";
              }
            };

            return (
              <React.Fragment key={block.index}>
                {/* ── BLOCK CARD ── */}
                <div
                  onClick={() => onSelectBlock?.(block)}
                  className={`relative w-72 shrink-0 p-4 rounded-xl bg-[#0e1626] border transition-all duration-200 cursor-pointer group select-none ${
                    isTampered
                      ? "border-rose-500/50 bg-rose-950/10"
                      : isScanning
                      ? "border-slate-400 scale-[1.01]"
                      : isSelected
                      ? "border-[#3b82f6] ring-1 ring-[#3b82f6]/40"
                      : "border-[#1e293b] hover:border-[#334155]"
                  }`}
                >
                  {/* Top Bar: Index & Type Badge */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#1b2537]">
                    <span className="text-xs font-semibold text-white">
                      Block #{block.index}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isTampered ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {isTargetTamper ? "Corrupted" : "Broken"}
                        </span>
                      ) : isScanning ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 animate-pulse">
                          Checking...
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#111827] text-slate-400 border border-[#1e293b]">
                          {formatTypeLabel(block.type)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Summary Content (Darker, non-highlighted colors) */}
                  <div className="py-3 min-h-[76px] flex flex-col justify-center text-xs space-y-1">
                    {isGenesis && (
                      <>
                        <div className="text-white font-medium truncate">
                          {block.data?.account?.name || "Genesis Account"}
                        </div>
                        <div className="text-[11px] text-[#64748b] truncate">
                          Handle: @{block.data?.account?.handle || "user"} · Origin
                        </div>
                      </>
                    )}

                    {isRepo && (
                      <>
                        <div className="text-white font-medium truncate">
                          {block.data?.name || "Repository"}
                        </div>
                        <div className="text-[11px] text-[#64748b]">
                          {block.data?.default_branch || "main"} · {block.data?.commit_count || 0} commits
                        </div>
                      </>
                    )}

                    {isCommit && (
                      <>
                        <div className="text-white font-medium truncate">
                          {block.data?.short_sha || block.data?.sha?.slice(0, 7) || "commit"} · Risk: {block.data?.risk_score || 0}/100
                        </div>
                        <div className="text-[11px] text-[#64748b] line-clamp-2 leading-tight">
                          {block.data?.message || "Commit update"}
                        </div>
                      </>
                    )}

                    {isAttack && (
                      <>
                        <div className="text-white font-medium truncate">
                          {block.data?.attack_type || block.type}
                        </div>
                        <div className="text-[11px] text-[#64748b] truncate">
                          Target: {block.data?.target_endpoint || "API Endpoint"}
                        </div>
                      </>
                    )}

                    {isUsage && (
                      <>
                        <div className="text-white font-medium">
                          Tier: {block.data?.tier || "Standard"}
                        </div>
                        <div className="text-[11px] text-[#64748b]">
                          {block.data?.tokens_consumed?.toLocaleString() || "0"} tokens used
                        </div>
                      </>
                    )}

                    {isCustom && (
                      <>
                        <div className="text-white font-medium truncate">
                          {block.data?.checkpoint_title || "Checkpoint"}
                        </div>
                        <div className="text-[11px] text-[#64748b] line-clamp-2">
                          {block.data?.notes || "Audit checkpoint record"}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Bottom: Single clean hash line without timestamp box */}
                  <div className="pt-2.5 border-t border-[#1b2537] flex items-center justify-between text-[11px] font-mono text-[#64748b]">
                    <span>Hash:</span>
                    <span className="text-slate-400" title={block.current}>
                      {block.current.slice(0, 14)}...
                    </span>
                  </div>
                </div>

                {/* ── SIMPLE CONNECTOR LINK ── */}
                {idx < blocks.length - 1 && (
                  <div className="shrink-0 flex items-center justify-center px-1 select-none">
                    <div className="w-5 h-px bg-[#1e293b]" />
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
