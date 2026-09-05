import React, { useState } from "react";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { chainApi } from "@/lib/api";

export default function DeleteChainModal({ isOpen, onClose, chainId, onChainDeleted }) {
  const { token } = useAuth();
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const isConfirmed = confirmInput.trim() === chainId;

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!isConfirmed) {
      toast.error(`Please type "${chainId}" exactly to confirm deletion`);
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading(`Deleting chain '${chainId}'...`);

    try {
      await chainApi.destroyChain(token, chainId);
      toast.success(`Chain '${chainId}' deleted successfully`, { id: toastId });
      if (onChainDeleted) {
        onChainDeleted(chainId);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to delete chain", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#0e131b] border border-rose-900/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#222f3e]">
          <div className="flex items-center gap-2.5 text-rose-400">
            <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/60 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Destroy Internal Chain
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8a99ad] hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#8a99ad] font-sans">
          This operation calls <code className="text-rose-400">DELETE /chain/{chainId}</code> and permanently destroys the internal block sequence and state snapshots for this chain.
        </p>

        <form onSubmit={handleDelete} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#8a99ad]">
              Type <span className="text-white font-bold">{chainId}</span> to confirm:
            </label>
            <input
              type="text"
              required
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={chainId}
              className="w-full bg-[#080b10] border border-rose-900/40 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-[#141b24] hover:bg-[#1a232f] text-[#8a99ad] hover:text-white font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isDeleting}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all shadow-lg shadow-rose-900/30"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Delete Chain</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
