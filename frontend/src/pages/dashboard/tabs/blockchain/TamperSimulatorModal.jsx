import React, { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Zap,
  AlertTriangle,
  FileCode,
  ArrowRight,
  Layers,
  Flame,
  Bug,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { chainApi } from "@/lib/api";

// Canonical JSON serializer matching Python's sort_keys=True, separators=(',', ':')
function canonicalJson(obj) {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJson).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k])).join(",") +
    "}"
  );
}

// Native Web Crypto SHA-256
async function computeSha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function TamperSimulatorModal({
  isOpen,
  onClose,
  blocks = [],
  onApplyTamperToRibbon,
  onResetRibbon,
}) {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(1);
  const [tamperedPayloadText, setTamperedPayloadText] = useState("");
  const [originalHash, setOriginalHash] = useState("");
  const [tamperedHash, setTamperedHash] = useState("");
  const [isValidatingWithBackend, setIsValidatingWithBackend] = useState(false);
  const [backendError, setBackendError] = useState(null);

  const activeBlock = blocks.find((b) => b.index === selectedBlockIndex) || blocks[0];

  // Initialize payload text on block selection
  useEffect(() => {
    if (activeBlock) {
      setTamperedPayloadText(JSON.stringify(activeBlock.data, null, 2));
      setOriginalHash(activeBlock.current);
      setTamperedHash(activeBlock.current);
      setBackendError(null);
    }
  }, [selectedBlockIndex, activeBlock]);

  // Recalculate hash whenever payload is edited
  useEffect(() => {
    if (!activeBlock) return;

    const recalculate = async () => {
      try {
        const parsedData = JSON.parse(tamperedPayloadText);
        const blockForHashing = {
          index: activeBlock.index,
          type: activeBlock.type,
          data: parsedData,
          created_at: activeBlock.created_at,
          prev: activeBlock.prev,
        };
        const canonical = canonicalJson(blockForHashing);
        const newHash = await computeSha256(canonical);
        setTamperedHash(newHash);
      } catch {
        // Invalid JSON while typing
        setTamperedHash("INVALID_SYNTAX");
      }
    };

    recalculate();
  }, [tamperedPayloadText, activeBlock]);

  if (!isOpen || !blocks || blocks.length === 0) return null;

  const isHashChanged = originalHash !== tamperedHash && tamperedHash !== "INVALID_SYNTAX";

  // Preset Tamper Attacks
  const applyPresetTamper = (preset) => {
    if (!activeBlock) return;
    try {
      const currentData = JSON.parse(JSON.stringify(activeBlock.data));
      if (preset === "risk") {
        currentData.risk_score = 0;
        currentData.risk_level = "safe";
        currentData.message = "[TAMPERED] Suppressed critical vulnerability finding";
      } else if (preset === "account") {
        if (currentData.account) currentData.account.role = "superadmin_hacked";
        else currentData.role = "root_superadmin";
      } else if (preset === "attack") {
        currentData.status = "unmitigated_breach";
        currentData.requests_sent = 9999999;
      }
      setTamperedPayloadText(JSON.stringify(currentData, null, 2));
      toast.warning(`Applied preset attack: ${preset}`);
    } catch {
      toast.error("Failed to apply preset tamper");
    }
  };

  // Test backend rejection via POST /chain/validate
  const handleTestBackendValidation = async () => {
    setIsValidatingWithBackend(true);
    setBackendError(null);

    try {
      const parsedData = JSON.parse(tamperedPayloadText);
      // Create a modified copy of the chain
      const tamperedChain = blocks.map((b) => {
        if (b.index === selectedBlockIndex) {
          return {
            ...b,
            data: parsedData,
            // Keep original current hash to test hash mismatch, or use new hash to test downstream prev mismatch
          };
        }
        return b;
      });

      await chainApi.validateChain(tamperedChain);
      // If backend didn't throw error
      toast.error("Warning: Backend accepted chain (unexpected)");
    } catch (err) {
      setBackendError(err.message || "Block hash verification failed");
      toast.error(`Backend Rejected: ${err.message || "Hash verification failed"}`);
    } finally {
      setIsValidatingWithBackend(false);
    }
  };

  // Apply to live dashboard visualizer
  const handleSimulateOnRibbon = () => {
    onApplyTamperToRibbon?.(selectedBlockIndex);
    toast.error(`Simulating cryptographic cascade breach starting at Block #${selectedBlockIndex}!`);
    onClose();
  };

  const handleReset = () => {
    if (activeBlock) {
      setTamperedPayloadText(JSON.stringify(activeBlock.data, null, 2));
      setTamperedHash(originalHash);
      setBackendError(null);
      onResetRibbon?.();
      toast.success("Restored verified immutable state");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
      />

      <div className="relative w-full max-w-2xl bg-[#0a0f18] border border-[#1f2c42] rounded-2xl shadow-[0_0_80px_rgba(244,63,94,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#182335] bg-[#0d1424]/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <ShieldAlert className="w-5 h-5 text-[#f43f5e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-white">
                  Cryptographic Tamper Simulator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  DEMO TOOL
                </span>
              </div>
              <p className="text-xs font-mono text-[#8a99ad] mt-0.5">
                Prove blockchain immutability: alter a single byte and witness the SHA-256 cascade breakage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 font-mono text-xs scrollbar-thin scrollbar-thumb-[#1f2c42]">
          {/* Block Selector Strip */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#8a99ad] uppercase tracking-wider">
              Select Target Block to Tamper:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {blocks.map((b) => (
                <button
                  key={b.index}
                  type="button"
                  onClick={() => setSelectedBlockIndex(b.index)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedBlockIndex === b.index
                      ? "bg-rose-500/20 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "bg-[#0d1422] border-[#1e2a3f] text-[#8a99ad] hover:text-white"
                  }`}
                >
                  Block #{b.index} ({b.type})
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Attack Shortcuts */}
          <div className="p-3 rounded-xl bg-[#060910] border border-[#182335] space-y-2">
            <div className="text-[10px] uppercase text-[#8a99ad] font-bold">
              Quick Tamper Scenarios:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPresetTamper("risk")}
                className="px-2.5 py-1 rounded-md bg-[#162032] border border-[#23334d] hover:border-rose-400/50 text-[#d8e2e8] text-[11px] flex items-center gap-1.5 cursor-pointer"
              >
                <Bug className="w-3 h-3 text-[#f43f5e]" />
                <span>Zero-Out Risk Score</span>
              </button>
              <button
                type="button"
                onClick={() => applyPresetTamper("account")}
                className="px-2.5 py-1 rounded-md bg-[#162032] border border-[#23334d] hover:border-rose-400/50 text-[#d8e2e8] text-[11px] flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Elevate Privileges</span>
              </button>
              <button
                type="button"
                onClick={() => applyPresetTamper("attack")}
                className="px-2.5 py-1 rounded-md bg-[#162032] border border-[#23334d] hover:border-rose-400/50 text-[#d8e2e8] text-[11px] flex items-center gap-1.5 cursor-pointer"
              >
                <Flame className="w-3 h-3 text-purple-400" />
                <span>Falsify Attack Log</span>
              </button>
            </div>
          </div>

          {/* Payload Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#d8e2e8] uppercase tracking-wider">
                Block #{selectedBlockIndex} JSON Payload (Editable):
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore Original</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={tamperedPayloadText}
              onChange={(e) => setTamperedPayloadText(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#060910] border border-[#1e2a3f] focus:border-rose-500 font-mono text-xs text-[#38bdf8] outline-none select-text resize-y leading-relaxed"
            />
          </div>

          {/* Cryptographic Hash Comparison Card */}
          <div className="p-4 rounded-xl bg-[#0e1624] border border-[#1e2a3f] space-y-3">
            <div className="text-[11px] uppercase tracking-wider text-[#8a99ad] font-bold">
              Cryptographic SHA-256 Divergence:
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#8a99ad]">
                <span>Canonical Original Hash:</span>
                <span className="text-[#22c55e]">VALID</span>
              </div>
              <div className="p-2 rounded bg-[#070b13] border border-[#182335] text-[11px] text-[#22c55e] break-all select-text font-bold">
                {originalHash}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#8a99ad]">
                <span>Recalculated Tampered Hash:</span>
                {isHashChanged ? (
                  <span className="text-[#f43f5e] font-bold">MISMATCH DETECTED</span>
                ) : (
                  <span className="text-[#22c55e]">MATCHES ORIGINAL</span>
                )}
              </div>
              <div
                className={`p-2 rounded border text-[11px] break-all select-text font-bold ${
                  isHashChanged
                    ? "bg-rose-950/20 border-rose-500/50 text-[#f43f5e]"
                    : "bg-[#070b13] border-[#182335] text-[#22c55e]"
                }`}
              >
                {tamperedHash}
              </div>
            </div>

            {/* Cascade Explanation */}
            {isHashChanged && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cascade Breakage Explained:</span>
                </div>
                <p className="leading-relaxed">
                  Modifying this payload changed its hash. Because Block #{selectedBlockIndex + 1} points to the original hash in its <code className="text-white">prev</code> field, the mathematical link is permanently broken. The entire chain from Block #{selectedBlockIndex} through the tip is invalidated!
                </p>
              </div>
            )}
          </div>

          {/* Backend Verification Diagnostic */}
          {backendError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Backend Rejection Proof:</strong> {backendError}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#182335] bg-[#0d1424]/80 backdrop-blur-md shrink-0 flex flex-wrap items-center justify-between gap-3 font-mono">
          <button
            type="button"
            onClick={handleTestBackendValidation}
            disabled={isValidatingWithBackend}
            className="px-4 py-2 rounded-xl bg-[#162032] border border-[#23334d] hover:border-white/20 text-[#d8e2e8] hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isValidatingWithBackend ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Test Backend Rejection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-[#101726] border border-[#1e2a3e] text-[#8a99ad] hover:text-white text-xs cursor-pointer"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handleSimulateOnRibbon}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Simulate on Live Ribbon</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
