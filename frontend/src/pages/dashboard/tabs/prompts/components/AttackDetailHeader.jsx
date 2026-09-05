import React, { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Clock,
  ExternalLink,
  Target,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

export default function AttackDetailHeader({ attack, onBack }) {
  const [copied, setCopied] = useState(false);

  if (!attack) return null;

  const { identity, target, execution } = attack;

  const handleCopyId = () => {
    navigator.clipboard.writeText(identity.attackId || identity.id);
    setCopied(true);
    toast.success("Attack ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "completed") {
      return {
        label: "Completed",
        icon: ShieldCheck,
        badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        dotClass: "bg-emerald-400",
      };
    }
    if (s === "blocked") {
      return {
        label: "Blocked / Intercepted",
        icon: ShieldCheck,
        badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
      };
    }
    if (s === "detected") {
      return {
        label: "Detected / Sanitized",
        icon: AlertTriangle,
        badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        dotClass: "bg-amber-400",
      };
    }
    if (s === "mitigated") {
      return {
        label: "Mitigated (Rate Limited)",
        icon: Zap,
        badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        dotClass: "bg-cyan-400",
      };
    }
    if (s === "running") {
      return {
        label: "Live Attack Running",
        icon: Flame,
        badgeClass: "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse",
        dotClass: "bg-rose-500 animate-ping",
      };
    }
    return {
      label: s || "Recorded",
      icon: ShieldAlert,
      badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
      dotClass: "bg-slate-400",
    };
  };

  const statusMeta = getStatusBadge(execution.status);
  const StatusIcon = statusMeta.icon;

  return (
    <div className="space-y-4">
      {/* Top back row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#101722] hover:bg-[#162130] border border-[#223348] text-xs font-semibold text-[#8a99ad] hover:text-white transition-all cursor-pointer shadow-sm group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Attack history</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[#8a99ad] font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>{identity.createdAt}</span>
        </div>
      </div>

      {/* Main Identity Banner Card */}
      <div className="bg-[#101724]/90 backdrop-blur-md border border-[#1e2d42] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle glowing corner accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Attack Type Badge */}
              <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono tracking-wide uppercase">
                {identity.type}
              </span>

              {/* Severity Badge */}
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider font-mono">
                {identity.severity}
              </span>

              {/* Status Outcome Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${statusMeta.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusMeta.label}</span>
              </span>
            </div>

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
    </div>
  );
}
