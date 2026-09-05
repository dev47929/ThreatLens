import React, { useState } from "react";
import {
  Copy,
  Check,
  Target,
} from "lucide-react";
import { toast } from "sonner";

export default function AttackDetailHeader({ attack }) {
  const [copied, setCopied] = useState(false);

  if (!attack) return null;

  const { identity, target } = attack;

  const handleCopyId = () => {
    navigator.clipboard.writeText(identity.attackId || identity.id);
    setCopied(true);
    toast.success("Attack ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-black backdrop-blur-md border border-[#1e2d42] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle glowing corner accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            {/* Attack Title */}
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
              {identity.name}
            </h1>

            {/* Subtitle & Target URL */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#8a99ad]">
              <div className="flex items-center gap-1.5 font-mono">
                <Target className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="px-1.5 py-0.5 rounded bg-[#162232] text-white font-bold text-[11px]">
                  {target.method}
                </span>
                <span className="text-[#38bdf8] font-medium">{target.endpoint}</span>
              </div>

              <span>·</span>
              <span className="font-mono text-[11.5px] text-[#64748b]">{identity.vector}</span>
              <span>·</span>
              <span>By: {identity.authorEmail}</span>
              {identity.createdAt && (
                <>
                  <span>·</span>
                  <span className="font-mono text-[11.5px] text-[#8a99ad]">{identity.createdAt}</span>
                </>
              )}
            </div>
          </div>

          {/* Right Action: UUID Copy & Duration */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-[#090e16] border border-[#202e40] rounded-xl px-3 py-1.5 text-xs font-mono">
              <span className="text-[#8a99ad] text-[11px]">Attack ID:</span>
              <span className="text-white font-semibold select-all" title={identity.attackId}>
                {identity.attackId.length > 18
                  ? `${identity.attackId.slice(0, 8)}...${identity.attackId.slice(-6)}`
                  : identity.attackId}
              </span>
              <button
                onClick={handleCopyId}
                className="p-1 text-[#8a99ad] hover:text-white hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
                title="Copy full UUID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="text-[11.5px] font-mono text-[#8a99ad] flex items-center gap-1.5">
              <span>Execution Latency:</span>
              <span className="text-[#38bdf8] font-bold">{identity.duration}</span>
            </div>
          </div>
        </div>
      </div>
  );
}
