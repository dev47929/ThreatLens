import React, { useState } from "react";
import {
  X,
  Wallet,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { CONTRACT_ADDRESS, SEPOLIA_CONFIG } from "@/lib/ethereum";

export default function WalletDetailsModal({
  isOpen,
  onClose,
  walletAddress,
  chainId,
  isSepolia,
  onReconnect,
  onDisconnect,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen || !walletAddress) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#0e131b] border border-[#263544] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#212d3d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2962FF]/20 border border-[#2962FF]/40 flex items-center justify-center text-[#38bdf8]">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Connected Wallet
              </h3>
              <p className="text-[11px] text-[#8a99ad] font-sans">
                MetaMask Web3 Provider · Sepolia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8a99ad] hover:text-white hover:bg-[#1b2533] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Account Address Box */}
        <div className="p-3 rounded-xl bg-[#090d13] border border-[#1b2533] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#8a99ad] uppercase font-bold">
            <span>Account Address</span>
            <button
              onClick={() => handleCopy(walletAddress, "address")}
              className="text-[#38bdf8] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedKey === "address" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>
          <div className="p-2 rounded-lg bg-[#111722] border border-[#212f3f] text-white text-[11px] break-all font-mono select-all">
            {walletAddress}
          </div>
        </div>

        {/* Network & Contract Specs */}
        <div className="space-y-2 p-3 rounded-xl bg-[#090d13] border border-[#1b2533]">
          {/* Network Status */}
          <div className="flex items-center justify-between py-1 border-b border-[#17202c]">
            <span className="text-[#8a99ad]">Network</span>
            <div className="flex items-center gap-1.5">
              {isSepolia ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Sepolia Testnet (11155111)
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Chain #{chainId || "Unknown"}
                </span>
              )}
            </div>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between py-1 border-b border-[#17202c]">
            <span className="text-[#8a99ad]">Currency</span>
            <span className="text-white font-medium">{SEPOLIA_CONFIG.currencySymbol}</span>
          </div>

          {/* Anchor Contract */}
          <div className="flex items-center justify-between py-1 border-b border-[#17202c]">
            <span className="text-[#8a99ad]">Anchor Contract</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#38bdf8] font-bold">
                {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
              </span>
              <button
                onClick={() => handleCopy(CONTRACT_ADDRESS, "contract")}
                className="text-[#8a99ad] hover:text-white cursor-pointer"
                title="Copy contract address"
              >
                {copiedKey === "contract" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Block Explorer Link */}
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[#8a99ad]">Explorer</span>
            <a
              href={`${SEPOLIA_CONFIG.blockExplorerUrl}/address/${walletAddress}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#38bdf8] hover:underline flex items-center gap-1"
            >
              <span>View Account on Etherscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Action Buttons: Copy, Reconnect, Disconnect */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#212d3d]">
          {/* 1. Copy Address */}
          <button
            type="button"
            onClick={() => handleCopy(walletAddress, "address")}
            className="py-2 px-2.5 rounded-lg bg-[#141b24] hover:bg-[#1a2432] border border-[#26374a] text-[#38bdf8] hover:text-white font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Copy wallet address to clipboard"
          >
            {copiedKey === "address" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* 2. Reconnect */}
          <button
            type="button"
            onClick={async () => {
              if (onReconnect) {
                await onReconnect();
              }
              onClose();
            }}
            className="py-2 px-2.5 rounded-lg bg-[#172332] hover:bg-[#203247] border border-[#2b415a] text-white font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Reconnect or refresh MetaMask provider"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Reconnect</span>
          </button>

          {/* 3. Disconnect */}
          <button
            type="button"
            onClick={() => {
              if (onDisconnect) {
                onDisconnect();
              }
              onClose();
            }}
            className="py-2 px-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 text-rose-400 hover:text-rose-300 font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Disconnect MetaMask wallet"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>
    </div>
  );
}
