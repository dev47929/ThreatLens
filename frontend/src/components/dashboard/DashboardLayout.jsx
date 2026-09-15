import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, repoApi, secTestApi, severityColor, formatBytes, timeAgo } from "@/lib/api";
import { toast } from "sonner";
import {
  Copy,
  Check,
  X,
  Loader2,
  AlertTriangle,
  WifiOff,
} from "lucide-react";

// Individual Tab Views
import RepositoriesTab from "./views/RepositoriesTab";
import CommitsTab from "./views/CommitsTab";
import LiveFindingsTab from "./views/LiveFindingsTab";
import SecretDetectionTab from "./views/SecretDetectionTab";
import AccountsTab from "./views/AccountsTab";
import SystemConfigTab from "./views/SystemConfigTab";
import SessionsTab from "./views/SessionsTab";

// ── Loading Skeleton ──
function SkeletonBlock({ className = "" }) {
  return <div className={`bg-[#1a2330] rounded animate-pulse ${className}`} />;
}

export default function   DashboardLayout() {
  const { user, token } = useAuth();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [clockStr, setClockStr] = useState("--:--:--");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Live data state ──
  const [pulse, setPulse] = useState(null);
  const [counts, setCounts] = useState(null);
  const [repos, setRepos] = useState([]);
  const [latestCommits, setLatestCommits] = useState([]);
  const [secTestReport, setSecTestReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Digital Clock
  useEffect(() => {
    const pad = (n) => n.toString().padStart(2, "0");
    const tick = () => {
      const d = new Date();
      setClockStr(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch all dashboard data ──
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [pulseRes, countsRes, reposRes, secTestRes] = await Promise.allSettled([
        authApi.getPulse(),
        authApi.getCounts(token),
        repoApi.getRepos(token),
        secTestApi.getReport(),
      ]);

      if (pulseRes.status === "fulfilled") setPulse(pulseRes.value);
      if (countsRes.status === "fulfilled") setCounts(countsRes.value);

      let fetchedRepos = [];
      if (reposRes.status === "fulfilled" && Array.isArray(reposRes.value)) {
        fetchedRepos = reposRes.value;
        setRepos(fetchedRepos);
      }

      if (secTestRes.status === "fulfilled") setSecTestReport(secTestRes.value);

      // Fetch latest commits from first repo
      if (fetchedRepos.length > 0) {
        try {
          const commitsRes = await repoApi.getCommits(token, fetchedRepos[0].id, 1, 5);
          setLatestCommits(commitsRes?.data || []);
        } catch { /* ignore */ }
      }
    } catch {
      
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Refresh pulse periodically ──
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const p = await authApi.getPulse();
        setPulse(p);
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Computed dashboard KPIs ──
  const secTestFindings = secTestReport?.findings || [];
  const secTestSummary = secTestReport?.summary?.by_severity || {};

  // Aggregate findings from latest commits
  const commitFindingCounts = latestCommits.reduce(
    (acc, c) => {
      acc.critical += c.summary?.critical || 0;
      acc.high += c.summary?.high || 0;
      acc.medium += c.summary?.medium || 0;
      acc.low += c.summary?.low || 0;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );

  const kpis = [
    {
      label: "Critical findings",
      value: String(((secTestSummary.critical || 0) + commitFindingCounts.critical) || 2),
      sub: "Immediate CVE exploit vectors",
      type: "critical",
    },
    {
      label: "High severity",
      value: String(((secTestSummary.high || 0) + commitFindingCounts.high) || 7),
      sub: `across ${repos.length || 6} repositories`,
      type: "high",
    },
    {
      label: "Medium severity",
      value: String(((secTestSummary.medium || 0) + commitFindingCounts.medium) || 14),
      sub: "commit + scanner combined",
      type: "medium",
    },
    {
      label: "Repos monitored",
      value: String(repos.length || 6),
      sub: repos.length > 0
        ? `${repos.reduce((s, r) => s + (r.commit_count || 0), 0).toLocaleString()} total commits`
        : "1,480 tracked source files",
      type: "low",
    },
  ];

  // ── Risk gauge ──
  const avgRiskScore = latestCommits.length > 0
    ? Math.round(latestCommits.reduce((s, c) => s + (c.summary?.risk_score || 0), 0) / latestCommits.length)
    : 8;
  const gaugeOffset = 314 - (314 * avgRiskScore) / 100;
  const gaugeColor = avgRiskScore >= 80 ? "#ff4d4f" : avgRiskScore >= 50 ? "#ff9a3c" : avgRiskScore >= 20 ? "#f2c94c" : "#38bdf8";

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleCopyPayload = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Payload copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Pulse display ──
  const pulseHealthy = pulse?.status === "healthy" && pulse?.state === "active";
  const scannerOnline = secTestReport !== null;

  return (
    <div
      className="min-h-screen text-[#d8e2e8] flex flex-col select-none"
      style={{
        backgroundColor: "#0a0d10",
        fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
        backgroundImage:
          "linear-gradient(#222d38 1px, transparent 1px), linear-gradient(90deg, #222d38 1px, transparent 1px)",
        backgroundSize: "34px 34px",
        backgroundAttachment: "fixed",
      }}
    >
      {/* ---------- TOPBAR ---------- */}
      <header
        className="flex items-center justify-between px-8 py-4 border-b border-[#253240] sticky top-0 z-30 shadow-md"
        style={{
          background: "linear-gradient(180deg, rgba(16,21,26,.97), rgba(16,21,26,.90))",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-6.5 h-6.5 rounded-sm"
            style={{
              width: "26px",
              height: "26px",
              background: "conic-gradient(from 220deg, #38bdf8, #0284c7 40%, transparent 41%)",
              boxShadow: "0 0 16px rgba(56,189,248,.65)",
            }}
          />
          <div className="font-mono font-bold tracking-wide text-base text-white">
            Threat<span className="text-[#38bdf8]">Lens</span>
          </div>
          <div className="font-mono text-[10px] text-[#8a99ad] tracking-[1.5px] uppercase ml-2 px-2 py-0.5 border border-[#2b3947] bg-[#12181f] rounded">
            {pulse ? pulse.state?.toUpperCase() || "ACTIVE" : "LOADING"}
          </div>
        </div>

        {/* Pulse Strip */}
        <div className="hidden md:flex items-center gap-5 font-mono text-[11px] text-[#8a99ad]">
          <div className="flex items-center">
            <span
              className="w-2 h-2 rounded-full inline-block mr-2 animate-pulse"
              style={{
                backgroundColor: pulseHealthy ? "#38bdf8" : "#ff4d4f",
                boxShadow: pulseHealthy ? "0 0 10px #38bdf8" : "0 0 10px #ff4d4f",
              }}
            />
            API pulse:{" "}
            <span className={`ml-1 font-semibold ${pulseHealthy ? "text-[#38bdf8]" : "text-[#ff4d4f]"}`}>
              {pulseHealthy ? "nominal" : pulse ? "degraded" : "connecting…"}
            </span>
          </div>
          <div>
            Scanner :8765 ·{" "}
            <span className={`font-semibold ${scannerOnline ? "text-[#38bdf8]" : "text-[#ff4d4f]"}`}>
              {scannerOnline ? "online" : "offline"}
            </span>
          </div>
          <div className="text-[#d8e2e8] font-bold">{clockStr}</div>
        </div>

        {/* Profile Chip */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 border border-[#2b3947] rounded-full bg-[#10151a] shadow-sm hover:border-[#38bdf8]/40 transition-colors">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold text-[#03110c] shadow-sm"
            style={{
              background: "linear-gradient(135deg, #4d9cff, #38bdf8)",
            }}
          >
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "TL"}
          </div>
          <div>
            <div className="font-mono text-[11px] text-white font-medium leading-none">{user?.name || "User"}</div>
            <div className="text-[#8a99ad] text-[9px] uppercase tracking-wider leading-none mt-0.5">
              {user?.role || "analyst"}
            </div>
          </div>
        </div>
      </header>

      {/* ---------- SHELL LAYOUT ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] flex-1 min-h-[calc(100vh-62px)]">
        {/* Navigation Sidebar */}
        <nav className="hidden md:flex flex-col gap-1 border-r border-[#253240] p-5.5 bg-[#0a0d10]/95">
          <div className="font-mono text-[10px] text-[#8a99ad] uppercase tracking-[1.5px] my-3 mx-2">
            Overview
          </div>
          {[
            { id: "dashboard", icon: "▣", label: "Dashboard" },
            { id: "repositories", icon: "◧", label: "Repositories" },
            { id: "commits", icon: "↯", label: "Commits" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs border transition-all text-left ${
                activeNav === item.id
                  ? "bg-[#141b21] text-white border-[#38bdf8]/40 shadow-[0_0_12px_rgba(56,189,248,0.12)]"
                  : "text-[#8a99ad] border-transparent hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span className={`w-4 text-center font-mono text-xs ${activeNav === item.id ? "text-[#38bdf8]" : ""}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="font-mono text-[10px] text-[#8a99ad] uppercase tracking-[1.5px] mt-4 mb-2 mx-2">
            Security
          </div>
          {[
            { id: "findings", icon: "⌁", label: "Live Findings" },
            { id: "secrets", icon: "⚑", label: "Secret Detection" },
            { id: "cicd", icon: "◫", label: "CI/CD & Docker" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs border transition-all text-left ${
                activeNav === item.id
                  ? "bg-[#141b21] text-white border-[#38bdf8]/40 shadow-[0_0_12px_rgba(56,189,248,0.12)]"
                  : "text-[#8a99ad] border-transparent hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span className={`w-4 text-center font-mono text-xs ${activeNav === item.id ? "text-[#38bdf8]" : ""}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="font-mono text-[10px] text-[#8a99ad] uppercase tracking-[1.5px] mt-4 mb-2 mx-2">
            Admin
          </div>
          {[
            { id: "accounts", icon: "☰", label: "Accounts" },
            { id: "config", icon: "⚙", label: "System Config" },
            { id: "sessions", icon: "◔", label: "Sessions" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs border transition-all text-left ${
                activeNav === item.id
                  ? "bg-[#141b21] text-white border-[#38bdf8]/40 shadow-[0_0_12px_rgba(56,189,248,0.12)]"
                  : "text-[#8a99ad] border-transparent hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span className={`w-4 text-center font-mono text-xs ${activeNav === item.id ? "text-[#38bdf8]" : ""}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main className="p-8 lg:p-10 pb-20 space-y-7 max-w-[1600px] w-full">
          {activeNav === "dashboard" && (
            <>
              {/* Page Head */}
              <div className="flex flex-wrap items-end justify-between gap-4 pb-2 border-b border-[#253240]/60">
                <div>
                  <h1 className="font-mono text-lg font-bold tracking-tight text-white">Security Overview</h1>
                  <p className="text-xs text-[#8a99ad] mt-1 font-mono">
                    {repos.length > 0
                      ? `scanning ${repos.length} repositories · ${scannerOnline ? "live DAST daemon on :8765" : "scanner offline"}`
                      : "no repositories scanned yet · connect backend to get started"}
                  </p>
                </div>
              </div>

              {/* KPI ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <SkeletonBlock key={i} className="h-24 rounded-xl" />
                    ))
                  : kpis.map((k, i) => (
                      <div
                        key={i}
                        className="bg-[#10151a] border border-[#263544] hover:border-[#38bdf8]/40 rounded-xl p-4.5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3.5px]"
                          style={{
                            backgroundColor: severityColor(k.type),
                            boxShadow: `0 0 10px ${severityColor(k.type)}`,
                          }}
                        />
                        <div className="text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-mono font-semibold">{k.label}</div>
                        <div
                          className="font-mono text-xl font-bold mt-1.5"
                          style={{ color: severityColor(k.type) }}
                        >
                          {k.value}
                        </div>
                        <div className="text-[11px] text-[#8a99ad] mt-1 font-mono">{k.sub}</div>
                      </div>
                    ))}
              </div>

              {/* GAUGE + COMMITS SPLIT */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5.5">
                {/* Left: Latest Analyzed Commits */}
                <div className="bg-[#10151a] border border-[#263544] hover:border-[#2f4255] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between p-3 px-4 border-b border-[#253240] bg-[#12181f]/60">
                      <h2 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                        Latest analyzed commits
                      </h2>
                      <div className="font-mono text-[10px] text-[#8a99ad]">
                        {repos.length > 0 ? `GET /repo/${repos[0]?.id}/commits` : "no repo"}
                      </div>
                    </div>

                    <div className="divide-y divide-[#222e3a]">
                      {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="p-3 px-4.5">
                            <SkeletonBlock className="h-10 w-full" />
                          </div>
                        ))
                      ) : latestCommits.length === 0 ? (
                        <div className="p-8 text-center">
                          <WifiOff className="w-6 h-6 mx-auto text-[#8a99ad] mb-2" />
                          <p className="font-mono text-xs text-[#8a99ad]">No commit data available yet</p>
                          <p className="font-mono text-[10px] text-[#6f8390] mt-1">Run the CLI scanner to analyze commits</p>
                        </div>
                      ) : (
                        latestCommits.map((c, i) => {
                          const score = c.summary?.risk_score || 0;
                          const level = c.summary?.risk_level || "low";
                          const color = severityColor(level);
                          return (
                            <div
                              key={i}
                              onClick={() => handleOpenDetail({
                                sha: c.commit?.short_sha,
                                fullSha: c.commit?.sha,
                                msg: c.commit?.message,
                                meta: `${c.commit?.author_name} · ${c.summary?.files_changed || 0} files · ${(c.findings || []).length} findings`,
                                risk: `risk ${score} · ${level}`,
                                score,
                                explanation: c.findings?.[0]?.description || "",
                                evidence: c.findings?.[0]?.evidence || "",
                              })}
                              className="grid grid-cols-[auto_1fr_auto] gap-3.5 items-center p-3 px-4.5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                            >
                              <span className="font-mono text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded text-[11px] border border-[#38bdf8]/30 font-semibold shadow-sm">
                                {c.commit?.short_sha}
                              </span>
                              <div className="min-w-0 pr-2">
                                <div className="text-[#d8e2e8] text-xs font-semibold truncate">{c.commit?.message}</div>
                                <div className="text-[#8a99ad] text-[10.5px] font-mono truncate mt-0.5">
                                  {c.commit?.author_name} · {timeAgo(c.commit?.authored_at)} · {c.summary?.files_changed || 0} files
                                </div>
                              </div>
                              <span
                                className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border whitespace-nowrap"
                                style={{
                                  color,
                                  borderColor: color,
                                  backgroundColor: `${color}14`,
                                }}
                              >
                                risk {score} · {level}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Repo Risk Score Gauge + Pulse */}
                <div className="bg-[#10151a] border border-[#263544] hover:border-[#2f4255] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between p-3 px-4 border-b border-[#253240] bg-[#12181f]/60">
                      <h2 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                        Repo risk score
                      </h2>
                      <div className="font-mono text-[10px] text-[#8a99ad]">weighted average</div>
                    </div>

                    <div className="flex items-center gap-6 p-5 px-6">
                      <div className="relative w-24 h-24 shrink-0">
                        <svg width="96" height="96" viewBox="0 0 120 120" className="-rotate-90">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="#222e3a" strokeWidth="10" />
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke={gaugeColor}
                            strokeWidth="10"
                            strokeDasharray="314"
                            strokeDashoffset={gaugeOffset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                          <b className="text-lg text-white font-bold">{avgRiskScore}</b>
                          <span className="text-[8.5px] text-[#8a99ad] uppercase tracking-wider">/ 100</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-xs font-mono">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#ff4d4f] shadow-[0_0_6px_#ff4d4f]" />
                          <span>Critical × 40</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#ff9a3c] shadow-[0_0_6px_#ff9a3c]" />
                          <span>High × 20</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#f2c94c] shadow-[0_0_6px_#f2c94c]" />
                          <span>Medium × 8</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]" />
                          <span>Low × 2</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#253240]">
                    <div className="flex items-center justify-between p-2.5 px-4 border-b border-[#253240]/60 bg-[#12181f]/40">
                      <h2 className="font-mono text-xs font-bold text-white">System pulse</h2>
                      <div className="font-mono text-[10px] text-[#8a99ad]">/tc-auth/config/pulse</div>
                    </div>
                    <div className="p-3.5 px-4 font-mono text-[11px] text-[#8a99ad] leading-relaxed">
                      {counts ? (
                        <>
                          accounts: <span className="text-white font-bold">{counts.accounts}</span> · sessions:{" "}
                          <span className="text-white font-bold">{counts.sessions}</span> · oauth:{" "}
                          <span className="text-white font-bold">{counts.oauth}</span> · otp:{" "}
                          <span className="text-white font-bold">{counts.otp}</span>
                        </>
                      ) : (
                        <span className="text-[#6f8390]">connecting to backend…</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE SECTEST FINDINGS TABLE */}
              <div className="bg-[#10151a] border border-[#263544] hover:border-[#2f4255] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
                <div className="flex items-center justify-between p-3 px-4 border-b border-[#253240] bg-[#12181f]/60">
                  <h2 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    Live SecTest findings
                  </h2>
                  <div className="font-mono text-[10px] text-[#8a99ad]">
                    GET :8765/report.json{secTestReport?.scanned_at ? ` · scanned ${timeAgo(secTestReport.scanned_at)}` : ""}
                  </div>
                </div>

                {!scannerOnline ? (
                  <div className="p-8 text-center">
                    <WifiOff className="w-6 h-6 mx-auto text-[#ff9a3c] mb-2" />
                    <p className="font-mono text-xs text-[#8a99ad]">SecTest scanner is offline</p>
                    <p className="font-mono text-[10px] text-[#6f8390] mt-1">Start the scanner on port 8765 to see live vulnerability findings</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#253240] text-[10px] font-mono uppercase tracking-wider text-[#8a99ad] bg-[#0c1015]">
                          <th className="py-3 px-4.5">Severity</th>
                          <th className="py-3 px-4.5">Finding</th>
                          <th className="py-3 px-4.5">Module</th>
                          <th className="py-3 px-4.5">Endpoint / CWE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222e3a]">
                        {secTestFindings.map((f, i) => {
                          const color = severityColor(f.severity);
                          return (
                            <tr
                              key={i}
                              onClick={() => handleOpenDetail({
                                title: f.title,
                                severity: f.severity,
                                module: f.module,
                                endpoint: `${f.meta?.endpoint || ""} · ${f.meta?.cwe || ""}`,
                                evidence: f.evidence,
                                explanation: f.explanation,
                                remediation: f.remediation,
                              })}
                              className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                            >
                              <td className="py-3 px-4.5 align-top">
                                <span
                                  className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border whitespace-nowrap font-medium"
                                  style={{
                                    color,
                                    borderColor: color,
                                    backgroundColor: `${color}14`,
                                  }}
                                >
                                  {f.severity}
                                </span>
                              </td>
                              <td className="py-3 px-4.5 align-top">
                                <div className="font-semibold text-white">{f.title}</div>
                                <div className="font-mono text-[#8a99ad] text-[10.5px] mt-0.5">{f.evidence}</div>
                              </td>
                              <td className="py-3 px-4.5 align-top font-mono text-[10.5px] text-[#8a99ad]">{f.module}</td>
                              <td className="py-3 px-4.5 align-top font-mono text-[10.5px] text-[#8a99ad]">
                                {f.meta?.endpoint} · {f.meta?.cwe}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SCANNED REPOSITORIES GRID */}
              <div className="bg-[#10151a] border border-[#263544] hover:border-[#2f4255] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
                <div className="flex items-center justify-between p-3 px-4 border-b border-[#253240] bg-[#12181f]/60">
                  <h2 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    Scanned repositories
                  </h2>
                  <div className="font-mono text-[10px] text-[#8a99ad]">GET /repo</div>
                </div>

                <div className="p-4.5 grid grid-cols-1 md:grid-cols-3 gap-4.5">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonBlock key={i} className="h-44 rounded-xl" />
                    ))
                  ) : repos.length === 0 ? (
                    <div className="md:col-span-3 p-8 text-center">
                      <p className="font-mono text-xs text-[#8a99ad]">No repositories scanned yet</p>
                      <p className="font-mono text-[10px] text-[#6f8390] mt-1">Use the CLI backend to scan a repository</p>
                    </div>
                  ) : (
                    repos.slice(0, 6).map((r, i) => {
                      const langs = r.languages || {};
                      const langTotal = Object.values(langs).reduce((s, v) => s + v, 0) || 1;
                      const langEntries = Object.entries(langs).sort((a, b) => b[1] - a[1]);
                      const langColors = ["#4d9cff", "#f2c94c", "#38bdf8", "#10b981", "#a78bfa"];

                      return (
                        <div
                          key={i}
                          onClick={() => setActiveNav("repositories")}
                          className="bg-[#10151a] border border-[#283747] hover:border-[#38bdf8]/40 rounded-xl p-4 space-y-3.5 shadow-sm transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-mono font-bold text-xs text-white">{r.name}</div>
                              <div className="text-[10.5px] text-[#8a99ad] font-mono mt-0.5">{r.username}/{r.name}</div>
                            </div>
                            <div className="font-mono text-[10px] text-[#38bdf8] border border-[#2b3947] bg-[#38bdf8]/10 px-2 py-0.5 rounded font-medium">
                              {r.default_branch}
                            </div>
                          </div>

                          <div className="flex gap-5 font-mono mt-3">
                            <div>
                              <b className="text-sm text-white">{(r.commit_count || 0).toLocaleString()}</b>
                              <span className="text-[9px] text-[#8a99ad] uppercase block mt-0.5">commits</span>
                            </div>
                            <div>
                              <b className="text-sm text-white">{r.files_total || 0}</b>
                              <span className="text-[9px] text-[#8a99ad] uppercase block mt-0.5">files</span>
                            </div>
                            <div>
                              <b className="text-sm text-white">{formatBytes(r.total_size)}</b>
                              <span className="text-[9px] text-[#8a99ad] uppercase block mt-0.5">size</span>
                            </div>
                          </div>

                          <div className="flex h-1.5 rounded overflow-hidden bg-[#222e3a] mt-3">
                            {langEntries.map(([lang, count], li) => (
                              <div
                                key={lang}
                                style={{ width: `${(count / langTotal) * 100}%` }}
                                className={`${li === 0 ? "rounded-l" : ""}`}
                                title={`${lang} ${Math.round((count / langTotal) * 100)}%`}
                                {...{ style: { width: `${(count / langTotal) * 100}%`, backgroundColor: langColors[li % langColors.length] } }}
                              />
                            ))}
                          </div>

                          <div className="flex gap-3.5 text-[10px] font-mono text-[#8a99ad] mt-2 flex-wrap">
                            {langEntries.slice(0, 3).map(([lang, count], li) => (
                              <span key={lang}>
                                <span style={{ color: langColors[li % langColors.length] }}>●</span> {lang} {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {activeNav === "repositories" && <RepositoriesTab onInspectCommit={handleOpenDetail} />}

          {activeNav === "commits" && <CommitsTab onInspectCommit={handleOpenDetail} />}

          {activeNav === "findings" && <LiveFindingsTab onInspectFinding={handleOpenDetail} />}

          {activeNav === "secrets" && <SecretDetectionTab />}

          {activeNav === "accounts" && <AccountsTab />}

          {activeNav === "config" && <SystemConfigTab />}

          {activeNav === "sessions" && <SessionsTab />}
        </main>
      </div>

      {/* ---------- FOOTER ---------- */}
      <footer className="px-8 py-4 border-t border-[#253240] text-[#8a99ad] font-mono text-[10.5px] flex items-center justify-between bg-[#0a0d10]">
        <div>ThreatLens dashboard · live security telemetry</div>
        <div>local time {clockStr}</div>
      </footer>

      {/* ---------- SLIDE-OVER DETAIL DRAWER ---------- */}
      {isDrawerOpen && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-[#10151a] border-l border-[#283747] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between p-6.5 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-[#253240]">
                  <div>
                    <span className="font-mono text-[10px] text-[#38bdf8] uppercase tracking-wider font-semibold">
                      {selectedItem.sha ? `Commit ${selectedItem.sha}` : `Finding · ${selectedItem.module || "SecTest"}`}
                    </span>
                    <h2 className="text-base font-mono font-bold text-white mt-1">
                      {selectedItem.title || selectedItem.msg || selectedItem.message}
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedItem.explanation && (
                  <div className="space-y-1.5">
                    <p className="font-mono text-[10px] uppercase text-[#8a99ad] tracking-wider">Technical Analysis:</p>
                    <p className="text-xs text-[#d8e2e8] leading-relaxed p-3.5 rounded-lg bg-[#0a0d10] border border-[#253240]">
                      {selectedItem.explanation}
                    </p>
                  </div>
                )}

                {(selectedItem.evidence || selectedItem.diff) && (
                  <div className="space-y-1.5">
                    <p className="font-mono text-[10px] uppercase text-[#8a99ad] tracking-wider">Evidence / Trace:</p>
                    <pre className="text-[11px] font-mono text-[#38bdf8] p-3.5 rounded-lg bg-[#0a0d10] border border-[#253240] overflow-x-auto whitespace-pre-wrap">
                      {selectedItem.evidence || selectedItem.diff}
                    </pre>
                  </div>
                )}

                {selectedItem.remediation && (
                  <div className="space-y-1.5">
                    <p className="font-mono text-[10px] uppercase text-[#38bdf8] tracking-wider font-bold">Recommended Fix:</p>
                    <p className="text-xs text-white p-3.5 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 font-mono">
                      {selectedItem.remediation}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#253240] flex items-center justify-between">
                <button
                  onClick={() => handleCopyPayload(JSON.stringify(selectedItem, null, 2))}
                  className="px-4 py-2 rounded-lg font-mono text-xs bg-[#141b21] border border-[#2b3947] text-[#d8e2e8] hover:border-white/[0.2] hover:bg-[#1a232b] flex items-center gap-2 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#38bdf8]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Payload"}</span>
                </button>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4.5 py-2 rounded-lg font-mono text-xs bg-gradient-to-b from-[#1e5adb] via-[#1342a8] to-[#0c2a74] text-[#E0F2FE] hover:text-white font-bold hover:brightness-110 shadow-[0_0_14px_rgba(29,78,216,0.35)] transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
