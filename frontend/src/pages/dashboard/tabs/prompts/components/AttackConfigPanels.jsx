import React, { useState } from "react";
import {
  Server,
  Settings2,
  Shield,
  FileCode2,
  Copy,
  Check,
  Download,
  AlertOctagon,
  Terminal,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

export default function AttackConfigPanels({ attack }) {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isRawJsonExpanded, setIsRawJsonExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("specs"); // "specs" | "defense" | "raw"

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
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-[#1b2838]">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c121a] border border-[#1e2d42]">
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

          <button
            onClick={() => setActiveTab("raw")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "raw"
                ? "bg-[#1e2d42] text-white shadow-sm"
                : "text-[#8a99ad] hover:text-white"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>Raw JSON Telemetry</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101724] hover:bg-[#162130] border border-[#23354b] text-xs font-mono text-[#8a99ad] hover:text-white transition-colors cursor-pointer"
            title="Copy entire attack JSON"
          >
            {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101724] hover:bg-[#162130] border border-[#23354b] text-xs font-mono text-[#8a99ad] hover:text-white transition-colors cursor-pointer"
            title="Download JSON audit report"
          >
            <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Target & Attack Config */}
      {activeTab === "specs" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Target Specification */}
          <div className="bg-[#101724]/90 backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b2838]">
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

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#090e16] border border-[#1b2738]">
                <span className="text-[#8a99ad]">Base URL:</span>
                <span className="text-white font-medium">{target.baseUrl}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#090e16] border border-[#1b2738]">
                <span className="text-[#8a99ad]">Target Endpoint:</span>
                <span className="text-[#38bdf8] font-bold">{target.endpoint}</span>
              </div>

              {target.auth && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#090e16] border border-[#1b2738]">
                  <span className="text-[#8a99ad]">Auth Header:</span>
                  <span className="text-emerald-400 font-medium">{target.auth}</span>
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

              <pre className="p-3.5 rounded-xl bg-[#080d14] border border-rose-900/30 text-rose-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {target.payload || "No explicit body payload recorded."}
              </pre>
            </div>
          </div>

          {/* Attack Parameters & Configuration */}
          <div className="bg-[#101724]/90 backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b2838]">
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

            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#090e16] border border-[#1b2738]">
                <div className="text-[10px] text-[#8a99ad] uppercase">Planned Volume</div>
                <div className="text-sm font-bold text-white mt-0.5">{config.plannedRequests.toLocaleString()} requests</div>
              </div>

              <div className="p-3 rounded-xl bg-[#090e16] border border-[#1b2738]">
                <div className="text-[10px] text-[#8a99ad] uppercase">Concurrency Workers</div>
                <div className="text-sm font-bold text-[#38bdf8] mt-0.5">{config.concurrency} parallel streams</div>
              </div>

              <div className="p-3 rounded-xl bg-[#090e16] border border-[#1b2738]">
                <div className="text-[10px] text-[#8a99ad] uppercase">Inter-Request Delay</div>
                <div className="text-sm font-bold text-white mt-0.5">{config.delay}s</div>
              </div>

              <div className="p-3 rounded-xl bg-[#090e16] border border-[#1b2738]">
                <div className="text-[10px] text-[#8a99ad] uppercase">Request Timeout</div>
                <div className="text-sm font-bold text-white mt-0.5">{config.timeout}s</div>
              </div>

              <div className="p-3 rounded-xl bg-[#090e16] border border-[#1b2738]">
                <div className="text-[10px] text-[#8a99ad] uppercase">Max Retries</div>
                <div className="text-sm font-bold text-white mt-0.5">{config.retries} attempts</div>
              </div>

              <div className="p-3 rounded-xl bg-[#090e16] border border-[#1b2738]">
                <div className="text-[10px] text-[#8a99ad] uppercase">Configured Duration</div>
                <div className="text-sm font-bold text-white mt-0.5">{config.duration}s</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Defense Trace & Status Codes */}
      {activeTab === "defense" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status Codes Distribution */}
          <div className="bg-[#101724]/90 backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b2838]">
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
                  <div key={code} className="space-y-1 p-2.5 rounded-xl bg-[#090e16] border border-[#1b2738]">
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
          <div className="bg-[#101724]/90 backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b2838]">
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

            <div className="p-3.5 rounded-xl bg-[#090e16] border border-[#1b2738] space-y-2">
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
                    <div key={errKey} className="p-2.5 rounded-xl bg-[#090e16] border border-[#1b2738] flex items-center justify-between text-xs font-mono">
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

      {/* TAB 3: Raw JSON Inspector */}
      {activeTab === "raw" && (
        <div className="bg-[#101724]/90 backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b2838]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#a78bfa]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Full Raw JSON Telemetry Payload (GET /attack)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#8a99ad]">
              Schema: ThreatLens Telemetry v1.0
            </span>
          </div>

          <pre className="p-4 rounded-xl bg-[#080d14] border border-[#1b2636] text-xs font-mono text-[#38bdf8] leading-relaxed max-h-96 overflow-y-auto overflow-x-auto whitespace-pre">
            {JSON.stringify(raw || attack, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
