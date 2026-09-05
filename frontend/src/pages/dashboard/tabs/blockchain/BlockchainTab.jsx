import React from "react";
import { Blocks, ShieldCheck } from "lucide-react";

export default function BlockchainTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#202c38]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2962FF]/10 border border-[#2962FF]/30 flex items-center justify-center">
              <Blocks className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">
              Blockchain & Integrity Checkpoints
            </h1>
          </div>
          <p className="text-xs text-[#8a99ad] mt-1 font-mono">
            Cryptographic SHA-256 state ledger · immutable repository & security audit evidence
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1622] border border-[#202c38] text-xs font-mono text-[#38bdf8]">
          <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
          <span>Ledger Ready</span>
        </div>
      </div>
    </div>
  );
}
