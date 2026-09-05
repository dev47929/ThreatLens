import React, { useState, useRef, useEffect } from "react";
import {
  Blocks,
  CheckCircle2,
  Copy,
  Check,
  Search,
  ArrowUpDown,
  Hash,
  Link as LinkIcon,
  Sparkles,
  Clock,
  FileCode,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  X,
  Info,
  Eye,
  EyeOff,
  Code2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { formatBytes32Hash } from "@/lib/ethereum";
import { timeAgo } from "@/lib/api";

// Format a hash cleanly for compact cards without overflow
function formatTruncatedHash(hash) {
  if (!hash || hash === "null") return "0x0000...0000";
  let clean = String(hash).trim();
  if (!clean.startsWith("0x") && !clean.startsWith("0X")) {
    clean = "0x" + clean;
  }
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 8)}...${clean.slice(-6)}`;
}

// Extract up to 2-3 concise summary chips for the compact payload bar
function getPayloadSummaryChips(raw) {
  if (!raw) return [];
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return [{ key: "content", value: String(raw).slice(0, 30) }];
    }
  }
  if (typeof data !== "object" || data === null) {
    return [{ key: "value", value: String(data) }];
  }

  const chips = [];
  const priorityKeys = ["status", "attack_type", "type", "environment", "version", "action", "id", "account_id"];
  for (const k of priorityKeys) {
    if (data[k] !== undefined && data[k] !== null && typeof data[k] !== "object") {
      chips.push({ key: k.replace(/_/g, " "), value: String(data[k]) });
      if (chips.length >= 3) break;
    }
  }

  if (chips.length === 0) {
    for (const [k, v] of Object.entries(data)) {
      if (v !== null && v !== undefined && typeof v !== "object") {
        chips.push({ key: k.replace(/_/g, " "), value: String(v) });
        if (chips.length >= 2) break;
      }
    }
  }

  return chips;
}

/**
 * Modern Horizontal Blockchain Visualizer
 * - Horizontal chain layout with connected cryptographic links
 * - Click any block to reveal deep inspection details & full payload
 * - 1-click copy for full hashes and JSON payloads
 * - Next/Previous navigation and direct Sepolia anchoring
 */
export default function BlockchainVisualizer({
  blocks = [],
  chainId = "audit_1",
  loading = false,
  onAnchorBlock,
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" (genesis first -> head) or "desc" (head first -> genesis)
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
  const [showFullJson, setShowFullJson] = useState(false);

  // Reset showFullJson when selected block changes
  useEffect(() => {
    setShowFullJson(false);
  }, [selectedBlockIndex]);

  const scrollContainerRef = useRef(null);

  // Copy helper with visual feedback
  const handleCopy = (text, key, label = "Copied to clipboard") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(label);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Copy Data payload formatted as JSON
  const handleCopyDataJson = (data, blockIndex) => {
    try {
      const formatted = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(formatted);
      setCopiedKey(`data-${blockIndex}`);
      toast.success(`Block #${blockIndex} JSON copied to clipboard`);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      toast.error("Failed to copy payload");
    }
  };

  // Distinct block type pill colors
  const getBlockTypeStyle = (type) => {
    const t = String(type || "").toLowerCase();
    if (t.includes("genesis")) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    if (t.includes("attack") || t.includes("ddos") || t.includes("sqli"))
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    if (t.includes("repo") || t.includes("git"))
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    if (t.includes("commit")) return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
    if (t.includes("usage")) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  };

  // Filter blocks based on search
  const filteredBlocks = blocks.filter((block) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const typeMatch = String(block.type || "").toLowerCase().includes(q);
    const hashMatch = String(block.current || "").toLowerCase().includes(q);
    const prevMatch = String(block.prev || "").toLowerCase().includes(q);
    const indexMatch = String(block.index).includes(q);
    const dataMatch = JSON.stringify(block.data || {}).toLowerCase().includes(q);
    return typeMatch || hashMatch || prevMatch || indexMatch || dataMatch;
  });

  // Sort blocks
  const sortedBlocks = [...filteredBlocks].sort((a, b) => {
    const idxA = Number(a.index);
    const idxB = Number(b.index);
    return sortOrder === "desc" ? idxB - idxA : idxA - idxB;
  });

  // Automatically select head block on first load if none selected
  useEffect(() => {
    if (sortedBlocks.length > 0 && selectedBlockIndex === null) {
      // Default to Head block
      const highestBlock = [...blocks].sort((a, b) => Number(b.index) - Number(a.index))[0];
      if (highestBlock) {
        setSelectedBlockIndex(highestBlock.index);
      }
    }
  }, [blocks, selectedBlockIndex, sortedBlocks.length]);

  // Current selected block object
  const selectedBlock = blocks.find((b) => Number(b.index) === Number(selectedBlockIndex));

  // Horizontal scroll controls
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  // Navigate to previous or next block in inspector
  const handleStepBlock = (direction) => {
    if (!selectedBlock) return;
    const currentIndex = Number(selectedBlock.index);
    const targetIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    const targetBlock = blocks.find((b) => Number(b.index) === targetIndex);
    if (targetBlock) {
      setSelectedBlockIndex(targetBlock.index);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-[#8a99ad] bg-[#090d13] rounded-xl border border-[#1b2533]">
        <div className="w-7 h-7 mx-auto mb-2.5 rounded-full border-2 border-[#38bdf8] border-t-transparent animate-spin" />
        <span>Synchronizing horizontal cryptographic block chain...</span>
      </div>
    );
  }

  if (sortedBlocks.length === 0) {
    return (
      <div className="p-10 text-center font-mono text-xs text-[#8a99ad] bg-[#090d13] rounded-xl border border-[#1b2533] space-y-2">
        <Blocks className="w-7 h-7 mx-auto text-[#43576d]" />
        <div className="text-white font-bold">No blocks found</div>
        <p className="text-[11px] text-[#63758b]">
          {searchQuery ? "No blocks match search query." : `Chain '${chainId}' has no blocks loaded.`}
        </p>
      </div>
    );
  }

  const maxBlockHeight = Math.max(...blocks.map((b) => Number(b.index)));

  return (
    <div className="space-y-3.5 select-none font-mono">
      {/* Visualizer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 px-3 rounded-xl bg-[#090d13] border border-[#1a2533]">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#8a99ad]">Sequence:</span>
          <span className="text-[#38bdf8] font-bold">{chainId}</span>
          <span className="text-[#64748b]">({sortedBlocks.length} blocks)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a99ad]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter blocks..."
              className="bg-[#111722] border border-[#233346] rounded-lg pl-7 pr-2 py-1 text-xs text-white placeholder-[#5a6c80] focus:outline-none focus:border-[#38bdf8] w-36 sm:w-44"
            />
          </div>

          {/* Sort Order Toggle */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="px-2.5 py-1 rounded-lg bg-[#111722] hover:bg-[#1a2534] border border-[#233346] text-[11px] text-[#8a99ad] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>{sortOrder === "desc" ? "Head First" : "Genesis First"}</span>
          </button>

          {/* Horizontal Scroll Arrows */}
          <div className="hidden sm:flex items-center gap-1 border-l border-[#1f2b3c] pl-2">
            <button
              type="button"
              onClick={handleScrollLeft}
              className="p-1 rounded-lg bg-[#111722] hover:bg-[#1a2534] border border-[#233346] text-[#8a99ad] hover:text-white transition-colors cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleScrollRight}
              className="p-1 rounded-lg bg-[#111722] hover:bg-[#1a2534] border border-[#233346] text-[#8a99ad] hover:text-white transition-colors cursor-pointer"
              title="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── HORIZONTAL BLOCKCHAIN TRACK ── */}
      <div className="relative rounded-2xl bg-[#070a0f] border border-[#172230] p-2 sm:p-3 overflow-hidden">
        <div className="flex items-center justify-between pb-2 px-1 text-[11px] text-[#71849a]">
          <div className="flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="font-semibold text-white">Horizontal Block Sequence</span>
            <span className="text-[10px] text-[#556980]">
              — Click any block to inspect details below
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            SHA-256 Linked
          </span>
        </div>

        {/* Scrollable Horizontal Rail */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 overflow-x-auto p-1.5 pb-3 scrollbar-thin scrollbar-thumb-[#233346] scrollbar-track-[#090d13]"
        >
          {sortedBlocks.map((block, idx) => {
            const isHead = Number(block.index) === maxBlockHeight;
            const isGenesis = Number(block.index) === 0;
            const isSelected = selectedBlock && Number(selectedBlock.index) === Number(block.index);

            const fullCurrentHash = formatBytes32Hash(block.current || "");
            const currentHashSnippet = formatTruncatedHash(block.current || "");

            return (
              <React.Fragment key={block.index || idx}>
                {/* Block Card */}
                <div
                  onClick={() => setSelectedBlockIndex(block.index)}
                  className={`group w-60 sm:w-64 shrink-0 rounded-xl p-3 border transition-all cursor-pointer select-none relative flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? "bg-[#0f1724] border-[#38bdf8] ring-2 ring-[#38bdf8]/30 shadow-lg shadow-[#38bdf8]/15"
                      : isHead
                      ? "bg-[#0b121c] border-[#2962FF]/50 hover:border-[#38bdf8]/70 shadow-sm"
                      : "bg-[#090d13] border-[#1b2636] hover:border-[#2b3d54]"
                  }`}
                >
                  {/* Card Top: Index, Type, Head/Genesis */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-1.5 border-b border-[#172230] pb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            isSelected
                              ? "bg-[#38bdf8] text-[#070a0f]"
                              : "bg-[#141d2a] text-white border border-[#25374d]"
                          }`}>
                          #{block.index}
                        </span>

                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${getBlockTypeStyle(
                            block.type
                          )}`
                        }
                        >
                          {block.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isHead && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#2962FF]/20 text-[#60a5fa] border border-[#2962FF]/40 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>HEAD</span>
                          </span>
                        )}

                        {isGenesis && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            GENESIS
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hash & Time Info */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                        <span className="text-[10px] uppercase text-[#8a99ad] flex items-center gap-1 shrink-0">
                          <Hash className="w-2.5 h-2.5 text-[#38bdf8]" />
                          <span>Hash</span>
                        </span>
                        <span
                          className="text-white font-mono text-[10px] bg-[#05080d] px-1.5 py-0.5 rounded border border-[#16212e] truncate shrink"
                          title={fullCurrentHash}
                        >
                          {currentHashSnippet}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[#6d8095] text-[10px]">
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Time</span>
                        </span>
                        <span className="truncate">
                          {block.created_at ? timeAgo(block.created_at) : "recently"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-2 mt-2.5 border-t border-[#16202d] flex items-center justify-between text-[10.5px]">
                    <span
                      className={`flex items-center gap-1 transition-colors ${
                        isSelected
                          ? "text-[#38bdf8] font-bold"
                          : "text-[#627589] group-hover:text-white"
                      }`}
                    >
                      <span>{isSelected ? "Inspecting" : "Inspect"}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>

                    {onAnchorBlock && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAnchorBlock(block);
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#111923] hover:bg-[#1a2536] border border-[#203043] text-[#38bdf8] hover:text-white text-[10px] transition-all cursor-pointer active:scale-95"
                        title="Anchor block state to Ethereum Sepolia"
                      >
                        Anchor
                      </button>
                    )}
                  </div>
                </div>

                {/* Horizontal Link Arrow between blocks */}
                {idx < sortedBlocks.length - 1 && (
                  <div className="flex flex-col items-center justify-center shrink-0 px-1 text-[#38bdf8]/60">
                    <div className="w-6 h-[2px] bg-gradient-to-r from-[#1e2f42] via-[#38bdf8]/50 to-[#1e2f42]" />
                    <div className="w-5 h-5 rounded-full bg-[#0d1520] border border-[#38bdf8]/40 flex items-center justify-center -my-2.5 shadow-sm">
                      <ArrowRight className="w-3 h-3 text-[#38bdf8]" />
                    </div>
                    <div className="w-6 h-[2px] bg-gradient-to-r from-[#1e2f42] via-[#38bdf8]/50 to-[#1e2f42]" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── SELECTED BLOCK DETAILS INSPECTOR (SHOWN WHEN CLICKED) ── */}
      {selectedBlock && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d14] border border-[#26374a] shadow-xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Inspector Header */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#1b2737]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Block #{selectedBlock.index} Details
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${getBlockTypeStyle(
                      selectedBlock.type
                    )}`}
                  >
                    {selectedBlock.type}
                  </span>
                  {Number(selectedBlock.index) === maxBlockHeight && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#2962FF]/20 text-[#60a5fa] border border-[#2962FF]/40">
                      HEAD BLOCK
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#8a99ad] font-sans">
                  Created {selectedBlock.created_at || "recently"} (
                  {timeAgo(selectedBlock.created_at)})
                </p>
              </div>
            </div>

            {/* Step Navigation & Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#111722] p-1 rounded-lg border border-[#212f3f]">
                <button
                  type="button"
                  disabled={Number(selectedBlock.index) <= 0}
                  onClick={() => handleStepBlock("prev")}
                  className="px-2 py-1 rounded text-[11px] text-[#8a99ad] hover:text-white hover:bg-[#182333] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  &larr; Prev Block
                </button>
                <button
                  type="button"
                  disabled={Number(selectedBlock.index) >= maxBlockHeight}
                  onClick={() => handleStepBlock("next")}
                  className="px-2 py-1 rounded text-[11px] text-[#8a99ad] hover:text-white hover:bg-[#182333] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  Next Block &rarr;
                </button>
              </div>

              {onAnchorBlock && (
                <button
                  type="button"
                  onClick={() => onAnchorBlock(selectedBlock)}
                  className="px-3 py-1.5 rounded-lg bg-[#2962FF] hover:bg-[#1d4ed8] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Blocks className="w-3.5 h-3.5" />
                  <span>Anchor to Sepolia</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedBlockIndex(null)}
                className="p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-[#182333] transition-colors cursor-pointer"
                title="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cryptographic Hashes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Current Hash */}
            <div className="p-3 rounded-xl bg-[#06090e] border border-[#172332] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#8a99ad] uppercase">
                <span className="flex items-center gap-1 font-bold text-white">
                  <Hash className="w-3 h-3 text-[#38bdf8]" />
                  <span>Current Block Hash (SHA-256)</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      selectedBlock.current || "",
                      `current-${selectedBlock.index}`,
                      "Current Block Hash copied"
                    )
                  }
                  className="text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === `current-${selectedBlock.index}` ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Full Hash</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-2 rounded bg-[#0e141f] border border-[#1b2838] font-mono text-[11px] text-[#38bdf8] break-all select-all">
                {selectedBlock.current || "0x0000000000000000000000000000000000000000000000000000000000000000"}
              </div>
            </div>

            {/* Previous Hash */}
            <div className="p-3 rounded-xl bg-[#06090e] border border-[#172332] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#8a99ad] uppercase">
                <span className="flex items-center gap-1 font-bold text-white">
                  <LinkIcon className="w-3 h-3 text-[#a78bfa]" />
                  <span>Previous Block Hash (Parent Link)</span>
                </span>
                {selectedBlock.prev && selectedBlock.prev !== "null" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        selectedBlock.prev || "",
                        `prev-${selectedBlock.index}`,
                        "Parent Hash copied"
                      )
                    }
                    className="text-[#a78bfa] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === `prev-${selectedBlock.index}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Parent Hash</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="p-2 rounded bg-[#0e141f] border border-[#1b2838] font-mono text-[11px] text-[#a78bfa] break-all select-all">
                {selectedBlock.prev && selectedBlock.prev !== "null"
                  ? selectedBlock.prev
                  : "0x0000000000000000000000000000000000000000000000000000000000000000 (Genesis Root)"}
              </div>
            </div>
          </div>

          {/* Payload Data - Very small, clean payload block with View JSON and Copy JSON */}
          <div className="rounded-xl bg-[#06090e] border border-[#172332] p-2.5 px-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Left: Tag + small concise key summary */}
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span className="text-[11px] uppercase font-bold text-white tracking-wide">
                    Payload Data
                  </span>
                </div>

                {(() => {
                  const chips = getPayloadSummaryChips(selectedBlock.data);
                  if (chips.length === 0) {
                    return (
                      <span className="text-[10px] text-[#6d8095] font-mono">
                        {typeof selectedBlock.data === "object" && selectedBlock.data !== null
                          ? `${Object.keys(selectedBlock.data).length} fields`
                          : "raw payload"}
                      </span>
                    );
                  }
                  return (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {chips.map((chip, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[#0d141e] border border-[#1b293a] text-[10.5px] font-mono flex items-center gap-1"
                        >
                          <span className="text-[#6d8095] uppercase text-[9.5px]">{chip.key}:</span>
                          <span className="text-[#38bdf8] font-medium truncate max-w-[140px]">
                            {chip.value}
                          </span>
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Right: View JSON & Copy JSON */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFullJson((prev) => !prev)}
                  className="px-2.5 py-1 rounded-lg bg-[#0e1520] hover:bg-[#162232] border border-[#1f2d3d] text-[#8a99ad] hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="View full raw JSON"
                >
                  {showFullJson ? (
                    <>
                      <EyeOff className="w-3 h-3 text-[#38bdf8]" />
                      <span>Hide JSON</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 text-[#38bdf8]" />
                      <span>View JSON</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyDataJson(selectedBlock.data, selectedBlock.index)}
                  className="px-2.5 py-1 rounded-lg bg-[#0e1520] hover:bg-[#162232] border border-[#1f2d3d] text-[#38bdf8] hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Copy full raw JSON"
                >
                  {copiedKey === `data-${selectedBlock.index}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Full Raw JSON Block */}
            {showFullJson && (
              <div className="mt-2.5 pt-2.5 border-t border-[#141e2a] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#6d8095]">
                  <span className="font-mono text-[10px] text-[#38bdf8] uppercase tracking-wider">
                    Full Raw JSON ({typeof selectedBlock.data === "object" && selectedBlock.data !== null ? `${Object.keys(selectedBlock.data).length} top-level fields` : "raw"})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFullJson(false)}
                    className="text-[#8a99ad] hover:text-white flex items-center gap-1 cursor-pointer text-xs"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Hide JSON</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-[#080d14] border border-[#172230] text-emerald-300 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed selection:bg-emerald-500/30">
                  {typeof selectedBlock.data === "string"
                    ? selectedBlock.data
                    : JSON.stringify(selectedBlock.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
