import React, { useState } from "react";
import {
  Server,
  Settings2,
  Shield,
  Copy,
  Check,
  Download,
  AlertOctagon,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

export default function AttackConfigPanels({ attack }) {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState("specs"); // "specs" | "defense"

  if (!attack) return null;

  const { target, config, final, identity, raw } = attack;

  const handleCopyPayload = () => {
    if (!target.payload) return;
    navigator.clipboard.writeText(typeof target.payload === "string" ? target.payload : JSON.stringify(target.payload, null, 2));
    setCopiedPayload(true);
    toast.success("Payload copied to clipboard!");
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(raw || attack, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    toast.success("Full attack JSON copied!");
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(raw || attack, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threatlens-attack-${identity.attackId || identity.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Attack JSON report downloaded!");
  };

  // Compute status codes array
  const statusCodes = final.statusCodes ? Object.entries(final.statusCodes) : [["200", final.successful]];
  const errors = final.errors ? Object.entries(final.errors) : [];

  return (
    <div className="space-y-4">
      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black border border-[#1e2d42]">
          <button
            onClick={() => setActiveTab("specs")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "specs"
                ? "bg-[#1e2d42] text-white shadow-sm"
                : "text-[#8a99ad] hover:text-white"
            }`}
          >
            <Server className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Target & Attack Config</span>
          </button>

          <button
            onClick={() => setActiveTab("defense")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "defense"
                ? "bg-[#1e2d42] text-white shadow-sm"
                : "text-[#8a99ad] hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Defense Trace & Status Codes</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-[#162130] border border-[#23354b] text-xs font-mono text-[#8a99ad] hover:text-white transition-colors cursor-pointer"
            title="Copy entire attack JSON"
          >
            {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-[#162130] border border-[#23354b] text-xs font-mono text-[#8a99ad] hover:text-white transition-colors cursor-pointer"
            title="Download JSON audit report"
          >
            <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Target & Attack Config */}
      {activeTab === "specs" && (
        <div className="space-y-4 w-full">
          {/* Target Specification */}
          <div className="w-full bg-black backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#38bdf8]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Target Endpoint Specifications
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#162232] text-[#38bdf8] font-mono text-[11px] font-bold">
                {target.method}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-[#1b2738]">
                <span className="text-[#8a99ad]">Base URL:</span>
                <span className="text-white font-medium truncate ml-2">{target.baseUrl}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-[#1b2738]">
                <span className="text-[#8a99ad]">Target Endpoint:</span>
                <span className="text-[#38bdf8] font-bold truncate ml-2">{target.endpoint}</span>
              </div>

              {target.auth ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-[#1b2738]">
                  <span className="text-[#8a99ad]">Auth Header:</span>
                  <span className="text-emerald-400 font-medium truncate ml-2">{target.auth}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-[#1b2738]">
                  <span className="text-[#8a99ad]">Auth Status:</span>
                  <span className="text-slate-400 font-medium">None / Public</span>
                </div>
              )}
            </div>

            {/* Injected Adversarial Payload */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#8a99ad] uppercase tracking-wider text-[10.5px]">
                  Injected Adversarial Payload
                </span>
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#38bdf8] hover:underline cursor-pointer"
                >
                  {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPayload ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-black border border-rose-900/30 text-rose-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {target.payload || "No explicit body payload recorded."}
              </pre>
            </div>
          </div>

          {/* Attack Parameters & Configuration (Expanded below Target Endpoint to Max Width) */}
          <div className="w-full bg-black backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#38bdf8]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Attack Generation Parameters
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#8a99ad]">
                Policy: <strong className="text-white">{config.onFailure}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Radial Card 1: Total Requests (Full Ring Radial Chart) */}
              <div className="bg-black border border-[#1e2d42] rounded-xl p-4 flex flex-col justify-between items-center text-center">
                <div className="w-full text-left">
                  <div className="text-xs font-bold text-white tracking-tight">Total Requests</div>
                  <div className="text-[11px] text-[#8a99ad] mt-0.5">Planned volume</div>
                </div>

                <div className="relative w-32 h-32 my-3 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#162232"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#3b82f6"
                      strokeWidth="10"
                      strokeDasharray="238.7"
                      strokeDashoffset={Math.max(25, 238.7 - (Math.min(config.plannedRequests, 50) / 50) * 190)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {config.plannedRequests.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#8a99ad]">Requests</span>
                  </div>
                </div>

                <div className="w-full text-center space-y-0.5 pt-1">
                  <div className="text-xs font-semibold text-white">
                    {config.concurrency} parallel streams
                  </div>
                  <div className="text-[11px] text-[#8a99ad]">Simultaneous workers</div>
                </div>
              </div>

              {/* Radial Card 2: Attack Duration (Radial Sweep Shape) */}
              <div className="bg-black border border-[#1e2d42] rounded-xl p-4 flex flex-col justify-between items-center text-center">
                <div className="w-full text-left">
                  <div className="text-xs font-bold text-white tracking-tight">Attack Duration</div>
                  <div className="text-[11px] text-[#8a99ad] mt-0.5">Execution time</div>
                </div>

                <div className="relative w-32 h-32 my-3 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#162232"
                      strokeWidth="11"
                      strokeDasharray="238.7"
                      strokeDashoffset="60"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#2563eb"
                      strokeWidth="11"
                      strokeDasharray="238.7"
                      strokeDashoffset="160"
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {config.duration}s
                    </span>
                    <span className="text-[11px] text-[#8a99ad]">Duration</span>
                  </div>
                </div>

                <div className="w-full text-center space-y-0.5 pt-1">
                  <div className="text-xs font-semibold text-white">
                    {config.delay}s delay
                  </div>
                  <div className="text-[11px] text-[#8a99ad]">Between requests</div>
                </div>
              </div>

              {/* Radial Card 3: Request Timeout (Semi-circle Stacked Arc) */}
              <div className="bg-black border border-[#1e2d42] rounded-xl p-4 flex flex-col justify-between items-center text-center">
                <div className="w-full text-left">
                  <div className="text-xs font-bold text-white tracking-tight">Request Timeout</div>
                  <div className="text-[11px] text-[#8a99ad] mt-0.5">Wait limit</div>
                </div>

                <div className="relative w-36 h-32 my-3 flex flex-col items-center justify-center">
                  <svg className="w-36 h-20 mb-2" viewBox="0 0 140 75">
                    <path
                      d="M 15 70 A 55 55 0 0 1 125 70"
                      stroke="#162232"
                      strokeWidth="12"
                      fill="transparent"
                    />
                    <path
                      d="M 15 70 A 55 55 0 0 1 125 70"
                      stroke="#60a5fa"
                      strokeWidth="12"
                      strokeDasharray="172.8"
                      strokeDashoffset={Math.max(25, 172.8 - (Math.min(config.timeout, 10) / 10) * 140)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute bottom-2 flex flex-col items-center justify-center select-none">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {config.timeout}s
                    </span>
                    <span className="text-[11px] text-[#8a99ad]">Max wait</span>
                  </div>
                </div>

                <div className="w-full text-center space-y-0.5 pt-1">
                  <div className="text-xs font-semibold text-white">
                    {config.retries} retries allowed
                  </div>
                  <div className="text-[11px] text-[#8a99ad]">Retry limit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Defense Trace & Status Codes */}
      {activeTab === "defense" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status Codes Distribution */}
          <div className="bg-black backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#38bdf8]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  HTTP Response Code Distribution
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#8a99ad]">
                Total: {final.successful + final.failed} responses
              </span>
            </div>

            <div className="space-y-2.5">
              {statusCodes.map(([code, count]) => {
                const total = final.successful + final.failed || 1;
                const pct = ((count / total) * 100).toFixed(1);
                const is2xx = code.startsWith("2");
                const is4xx = code.startsWith("4");
                const is5xx = code.startsWith("5");

                const badgeColor = is2xx
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : is4xx
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-rose-500/15 border-rose-500/30 text-rose-400";

                const barColor = is2xx ? "#10b981" : is4xx ? "#f59e0b" : "#f43f5e";

                return (
                  <div key={code} className="space-y-1 p-2.5 rounded-xl bg-black border border-[#1b2738]">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-bold border text-[11px] ${badgeColor}`}>
                          HTTP {code}
                        </span>
                        <span className="text-[#8a99ad]">
                          {is2xx ? "Success" : code === "403" ? "Forbidden (Blocked)" : code === "429" ? "Rate Limited" : "Error"}
                        </span>
                      </div>
                      <div className="text-white font-bold">
                        {count.toLocaleString()} ({pct}%)
                      </div>
                    </div>

                    {/* Proportion bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#1b2636] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Defense Interception & SIEM Audit Log */}
          <div className="bg-black backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Defense Interception & SIEM Audit
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10.5px] font-mono font-bold">
                Guardrail Active
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-black border border-[#1b2738] space-y-2">
              <div className="text-[11px] font-mono text-[#8a99ad] uppercase font-semibold">
                Guardrail Interception Summary
              </div>
              <div className="text-xs font-mono text-emerald-400 leading-relaxed">
                {final.responseSummary}
              </div>
            </div>

            {final.errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Rule Exception / Error Detail:</span>
                </div>
                <div className="text-xs font-mono text-rose-300">
                  {final.errorMessage}
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-[#8a99ad] uppercase">Categorized Interceptions</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {errors.map(([errKey, count]) => (
                    <div key={errKey} className="p-2.5 rounded-xl bg-black border border-[#1b2738] flex items-center justify-between text-xs font-mono">
                      <span className="text-rose-300 truncate">{errKey}</span>
                      <span className="font-bold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
