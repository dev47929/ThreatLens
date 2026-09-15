import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  Zap,
  Check,
  Loader2,
  ArrowDownCircle,
  ShieldAlert,
} from "lucide-react";

export default function DowngradeConfirmModal({
  isOpen,
  onClose,
  currentPlan,
  targetPlan,
  onConfirmDowngrade,
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirmDowngrade();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#10151f] border border-[#2c384a] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header with warning icon */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#1f2b3c] bg-[#141b27]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Switch to Free Plan</h3>
              <p className="text-xs text-[#8a99ad]">Downgrade account tier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-[#cbd5e1] leading-relaxed">
            You are switching from <strong className="text-white uppercase">{currentPlan?.name || "Pro"}</strong> to the{" "}
            <strong className="text-white uppercase">{targetPlan?.name || "Free"}</strong> tier.
            Your changes will take effect immediately.
          </p>

          <div className="p-3.5 rounded-xl bg-[#0b0e14] border border-[#1d2737] space-y-2.5">
            <div className="text-[11px] font-semibold text-[#8a99ad] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>What changes on your account:</span>
            </div>
            <ul className="space-y-1.5 text-[#94a3b8]">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>Monthly token quota adjusts to <strong>500,000 tokens</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>Active repositories capped at <strong>5 repos</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>Community support tier only</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span className="text-[#e2e8f0]">No charges or credit card needed</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-3 border-t border-[#1f2b3c] bg-[#141b27] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-[#1c2635] hover:bg-[#253245] text-xs font-semibold text-[#cbd5e1] hover:text-white transition-all cursor-pointer"
          >
            Keep My Plan
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Switching...</span>
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-3.5 h-3.5" />
                <span>Confirm Downgrade</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
