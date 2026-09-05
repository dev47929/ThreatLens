import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, repoApi, secTestApi, severityColor, formatBytes, timeAgo } from "@/lib/api";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { ThreatLensLogo } from "@/components/common/ThreatLensLogo";
import {
  Copy,
  Check,
  X,
  Loader2,
  AlertTriangle,
  WifiOff,
  User,
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  BarChart3,
  Sparkles,
  FolderGit2,
  GitCommit,
  ShieldAlert,
  Flame,
  Terminal,
  Users,
  Settings,
  Clock,
  LayoutDashboard,
  BookOpen,
  Blocks,
  Crosshair,
} from "lucide-react";

// Domain-Based Tab Views
import RepositoriesTab from "./tabs/repositories/RepositoriesTab";
import CommitsTab from "./tabs/commits/CommitsTab";
import LiveAttacksTab from "./tabs/security/LiveAttacksTab";
import BlockchainTab from "./tabs/blockchain/BlockchainTab";
import AccountsTab from "./tabs/admin/AccountsTab";
import SystemConfigTab from "./tabs/admin/SystemConfigTab";
import SessionsTab from "./tabs/admin/SessionsTab";
import PromptHistoryTab from "./tabs/prompts/PromptHistoryTab";
import AttackHistoryTab from "./tabs/prompts/AttackHistoryTab";
import TokenUsageTab from "./tabs/billing/TokenUsageTab";
import CliAgentTab from "./tabs/docs/CliAgentTab";

// Drawers & Modals
import ProfileModal from "@/components/drawers/ProfileModal";

// Sidebar Navigation Categories
const NAV_CATEGORIES = [
  {
    id: "introduction",
    title: "Introduction",
    items: [
      { id: "docs", label: "Documentation", icon: BookOpen },
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "repositories", label: "Repositories", icon: FolderGit2 },
      { id: "commits", label: "Commits", icon: GitCommit },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      { id: "live-attacks", label: "Live attacks", icon: Flame },
      { id: "attack-history", label: "Attack history", icon: Crosshair },
      { id: "blockchain", label: "Blockchain", icon: Blocks },
    ],
  },
  {
    id: "terminal",
    title: "Terminal",
    items: [
      { id: "prompts", label: "Prompt history", icon: Sparkles },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    adminOnly: true,
    items: [
      { id: "accounts", label: "Accounts", icon: Users },
      { id: "config", label: "System config", icon: Settings },
      { id: "sessions", label: "Sessions", icon: Clock },
    ],
  },
];

// ── Loading Skeleton ──
function SkeletonBlock({ className = "" }) {
  return <div className={`bg-[#1a2330] rounded animate-pulse ${className}`} />;
}

export default function DashboardLayout() {
  const { user, token, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [activeTopTab, setActiveTopTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [clockStr, setClockStr] = useState("--:--:--");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRepoId, setSelectedRepoId] = useState(null);
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTokensOpen, setIsTokensOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [copied, setCopied] = useState(false);
  const tokensRef = useRef(null);

  const handleSelectRepo = (repoId) => {
    setSelectedRepoId(repoId);
    setActiveNav("commits");
  };

  const toggleCategory = (catId) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const activeCategoryObj = NAV_CATEGORIES.find((cat) =>
    cat.items.some((item) => item.id === activeNav)
  );
  const activeItemObj = activeCategoryObj?.items.find(
    (item) => item.id === activeNav
  );

  const breadcrumbCategory =
    activeTopTab === "tokens"
      ? "Billing"
      : activeCategoryObj?.title || "Introduction";

  const breadcrumbItem =
    activeTopTab === "tokens"
      ? "Token usage"
      : activeNav === "blockchain"
      ? "Blockchain & Integrity"
      : activeItemObj?.label || "Dashboard";

  // Close tokens dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tokensRef.current && !tokensRef.current.contains(e.target)) {
        setIsTokensOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Responsive Media Query Listener for Screen Resize
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 1023px)");
    const handleMediaChange = (e) => {
      if (e.matches) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    mql.addEventListener("change", handleMediaChange);
    return () => mql.removeEventListener("change", handleMediaChange);
  }, []);

  const handleNavClick = (id) => {
    setSelectedAttack(null);
    if (id === "chatbot" || id === "threatlensgo") {
      setActiveNav("prompts");
    } else if (id === "cli") {
      setActiveNav("docs");
    } else {
      setActiveNav(id);
    }
    setActiveTopTab("dashboard");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const userRole = (user?.role || "analyst").toLowerCase();
  const isAdmin = userRole !== "user";

  // Redirect away from admin tabs if role is user
  useEffect(() => {
    if (!isAdmin && ["accounts", "config", "sessions"].includes(activeNav)) {
      setActiveNav("dashboard");
    }
  }, [isAdmin, activeNav]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully signed out");
      setLocation("/login");
    } catch (err) {
      toast.error("Logout failed: " + (err.message || "Unknown error"));
    }
  };

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

      if (secTestRes.status === "fulfilled") {
        setSecTestReport(secTestRes.value);
      }

      // If we have repositories, fetch latest commits for the first repository
      if (fetchedRepos.length > 0) {
        try {
          const commitsRes = await repoApi.getCommits(token, fetchedRepos[0].id, 1, 5);
          if (commitsRes?.data) {
            setLatestCommits(commitsRes.data);
          }
        } catch {
          // commits fetch optional
        }
      }
    } catch {
      toast.error("Telemetry sync interrupted");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Drawer details inspector handler
  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleCopyPayload = (str) => {
    navigator.clipboard.writeText(str);
    setCopied(true);
    toast.success("Payload copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Severity metrics calculation from SecTest DAST Daemon & Git Commit Findings
  const secFindings = secTestReport?.findings || [];
  const totalFindings =
    secFindings.length +
    latestCommits.reduce((acc, c) => acc + (c.summary?.findings || 0), 0);

  const criticalCount =
    (secTestReport?.summary?.by_severity?.critical || 0) +
    latestCommits.reduce((acc, c) => acc + (c.summary?.critical || 0), 0);

  const highCount =
    (secTestReport?.summary?.by_severity?.high || 0) +
    latestCommits.reduce((acc, c) => acc + (c.summary?.high || 0), 0);

  const mediumCount =
    (secTestReport?.summary?.by_severity?.medium || 0) +
    latestCommits.reduce((acc, c) => acc + (c.summary?.medium || 0), 0);

  const lowCount =
    (secTestReport?.summary?.by_severity?.low || 0) +
    latestCommits.reduce((acc, c) => acc + (c.summary?.low || 0), 0);

  // Compute Overall Posture Risk Score (0 - 100)
  const calculatedRiskScore = Math.min(
    100,
    criticalCount * 25 + highCount * 12 + mediumCount * 5 + lowCount * 1
  );

  const postureStatus =
    calculatedRiskScore > 75
      ? { label: "CRITICAL COMPROMISE", color: "#f43f5e" }
      : calculatedRiskScore > 40
      ? { label: "ELEVATED RISK", color: "#fb923c" }
      : calculatedRiskScore > 10
      ? { label: "MODERATE DRIFT", color: "#facc15" }
      : { label: "SECURE POSTURE", color: "#38bdf8" };

  const pulseHealthy = pulse?.status === "ok" || pulse?.status === "healthy";

  // KPIs definition for Overview
  const kpis = [
    {
      label: "Critical Threats",
      value: loading ? "…" : criticalCount,
      sub: "Immediate CVE exploit vectors",
      type: "critical",
    },
    {
      label: "High Severity",
      value: loading ? "…" : highCount,
      sub: "Privilege & auth vulnerabilities",
      type: "high",
    },
    {
      label: "Active Findings",
      value: loading ? "…" : totalFindings,
      sub: "Total static & DAST alerts",
      type: "medium",
    },
    {
      label: "Analyzed Repos",
      value: loading ? "…" : repos.length,
      sub: repos.length > 0 ? `${repos.reduce((acc, r) => acc + (r.files_total || 0), 0)} tracked files` : "0 codebases",
      type: "low",
    },
  ];

  const scannerOnline = secTestReport !== null;

  return (
    <div
      className="h-screen w-screen text-[#d8e2e8] flex overflow-hidden select-none"
      style={{
        backgroundColor: "#000000",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        backgroundImage:
          "linear-gradient(#141416 1px, transparent 1px), linear-gradient(90deg, #141416 1px, transparent 1px)",
        backgroundSize: "36px 36px",
        backgroundAttachment: "fixed",
      }}
    >
      {/* ---------- SIDEBAR (Full-Height 100vh on the Left) ---------- */}
      {isSidebarOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
            aria-hidden="true"
          />

          <aside
            className="w-[260px] shrink-0 h-screen flex flex-col bg-[#000000] z-30 shadow-2xl lg:shadow-none no-scrollbar"
            style={{ borderRight: "1px solid rgba(255, 255, 255, 0.2)" }}
          >
            {/* Top Logo Header in Sidebar */}
            <div className="h-14 shrink-0 px-4 flex items-center bg-[#000000]">
              <Link href="/" className="hover:opacity-90 transition-opacity flex items-center shrink-0">
                <ThreatLensLogo className="h-6 w-auto" />
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-2.5 space-y-1 font-sans select-none no-scrollbar">
              {NAV_CATEGORIES.filter((cat) => !cat.adminOnly || isAdmin).map((cat, catIdx, arr) => {
                const isCollapsed = collapsedCategories[cat.id];

                return (
                  <div key={cat.id} className="space-y-0.5">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center justify-between px-3 py-1 transition-all cursor-pointer group text-[#8a99ad] hover:text-white"
                    >
                      <span className="text-[12.5px] font-semibold text-[#8a99ad] group-hover:text-white transition-colors">{cat.title}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#8a99ad] group-hover:text-white transition-transform duration-200 ${
                          isCollapsed ? "-rotate-90" : ""
                        }`}
                      />
                    </button>

                    {/* Category Items */}
                    {!isCollapsed && (
                      <div className="space-y-0.5 pt-0.5">
                        {cat.items.map((item) => {
                          const isActive = activeNav === item.id && activeTopTab !== "tokens";
                          const IconComponent = item.icon;

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNavClick(item.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left cursor-pointer group ${
                                isActive
                                  ? "bg-[#18181b] text-[#BC7CDE]"
                                  : "bg-transparent text-[#d4d4d8] hover:text-white hover:bg-white/[0.04]"
                              }`}
                            >
                              <IconComponent
                                className={`w-4 h-4 shrink-0 transition-colors ${
                                  isActive
                                    ? "text-[#BC7CDE]"
                                    : "text-[#9ca3af] group-hover:text-white"
                                }`}
                                strokeWidth={1.85}
                              />
                              <span
                                className={`truncate flex-1 text-[13px] font-semibold leading-tight ${
                                  isActive ? "text-[#BC7CDE]" : "text-[#d4d4d8] group-hover:text-white"
                                }`}
                              >
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Dotted Line between Categories */}
                    {catIdx < arr.length - 1 && (
                      <div className="w-full py-1 px-1" aria-hidden="true">
                        <div
                          className="w-full h-[3px] opacity-70"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle, #71717a 1px, transparent 1.2px)",
                            backgroundSize: "6px 100%",
                            backgroundRepeat: "repeat-x",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* ---------- RIGHT COLUMN: NAVBAR + SCROLLABLE MAIN CONTENT ---------- */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col h-screen overflow-hidden">
        {/* ---------- TOP NAVBAR (Breadcrumbs & Right Actions) ---------- */}
        <header className="relative z-20 w-full h-14 bg-[#080d1a]/95 backdrop-blur-md border-b border-white/10 px-4 lg:px-6 flex items-center justify-between shrink-0 shadow-sm">
          {/* Left Side: Breadcrumb path (Exact match to reference image) */}
          <div className="flex items-center gap-2 text-[13px] font-sans select-none">
            <button
              onClick={() => {
                setActiveTopTab("dashboard");
                setSelectedAttack(null);
                if (activeCategoryObj?.items[0]?.id) {
                  setActiveNav(activeCategoryObj.items[0].id);
                }
              }}
              className="text-[#9ca3af] font-medium hover:text-white transition-colors cursor-pointer tracking-normal"
            >
              {breadcrumbCategory}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#71717a] shrink-0" strokeWidth={1.75} />

            {activeNav === "attack-history" && selectedAttack ? (
              <>
                <button
                  onClick={() => setSelectedAttack(null)}
                  className="text-[#9ca3af] font-medium hover:text-white transition-colors cursor-pointer tracking-normal"
                >
                  Attack history
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[#71717a] shrink-0" strokeWidth={1.75} />
                <span className="bg-[#1c1c20] text-[#f4f4f5] px-2.5 py-0.5 rounded-md text-[13px] font-medium tracking-normal whitespace-nowrap border border-white/[0.04]">
                  Attack details
                </span>
              </>
            ) : (
              <span className="bg-[#1c1c20] text-[#f4f4f5] px-2.5 py-0.5 rounded-md text-[13px] font-medium tracking-normal whitespace-nowrap border border-white/[0.04]">
                {breadcrumbItem}
              </span>
            )}
          </div>

          {/* Right Side: Notifications, Avatar, Tokens Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => toast.info("No unread alerts")}
              className="p-1.5 text-[#8a99ad] hover:text-white hover:bg-[#18181b] rounded-lg transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* User Profile Avatar */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center rounded-full ring-1 ring-white/10 hover:ring-[#6EA8DA]/60 transition-all cursor-pointer overflow-hidden p-0.5"
              title="Account Settings"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #2C6CB0, #6EA8DA)",
                  }}
                >
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "TL"}
                </div>
              )}
            </button>

            {/* Billing Dropdown */}
            <div className="relative" ref={tokensRef}>
              <button
                onClick={() => setIsTokensOpen(!isTokensOpen)}
                className="px-3.5 py-1.5 rounded-lg bg-[#2962FF] hover:bg-[#1e4ed8] text-white text-[13px] font-semibold shadow-[0_0_15px_rgba(41,98,255,0.35)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 font-sans border-0 outline-none"
                title="Billing & Subscriptions"
              >
                <span>Billing</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${isTokensOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isTokensOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#0b0f19] border border-[#222f46] shadow-[0_10px_40px_rgba(0,0,0,0.95)] p-1.5 backdrop-blur-xl z-[9999] select-none">
                  <div className="px-3 py-1.5 border-b border-[#1c2638] mb-1">
                    <div className="text-[10px] uppercase font-bold text-[#6EA8DA] tracking-wider">
                      API & Credits
                    </div>
                  </div>

                  {/* Option 1: Token usage */}
                  <button
                    onClick={() => {
                      setActiveTopTab("tokens");
                      setIsTokensOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-[#162032] text-[#d8e2e8] hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-md bg-[#1D3557]/60 border border-[#2C6CB0]/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-3.5 h-3.5 text-[#6EA8DA]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white">Token usage</div>
                      <div className="text-[10px] text-[#8a99ad]">Quotas & usage metrics</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ---------- MAIN CONTENT AREA (Scrolls independently) ---------- */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-y-auto">
          {activeTopTab === "tokens" ? (
            <TokenUsageTab user={user} />
          ) : activeNav === "docs" || activeNav === "documentation" ? (
            <main className="p-8 lg:p-10 pb-20 space-y-7 max-w-[1600px] w-full">
              <CliAgentTab onNavigate={handleNavClick} />
            </main>
          ) : activeNav === "prompts" || activeNav === "threatlensgo" ? (
            <PromptHistoryTab user={user} />
          ) : activeNav === "attack-history" ? (
            <AttackHistoryTab
              user={user}
              token={token}
              selectedAttack={selectedAttack}
              onSelectAttack={setSelectedAttack}
            />
          ) : (
          /* Main Content */
          <main className="p-8 lg:p-10 pb-20 space-y-7 max-w-[1600px] w-full">
          {activeNav === "dashboard" && (
            <>
              {/* Page Head */}
              <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">Security Overview</h1>
                  <p className="text-xs text-[#8a99ad] mt-1">
                    {repos.length > 0
                      ? `scanning ${repos.length} repositories · ${scannerOnline ? "live DAST daemon on :8765" : "scanner offline"}`
                      : "no repositories scanned yet · connect backend to get started"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => toast.success("Exported full security summary (CSV / JSON)")}
                    className="px-4 py-2 rounded-lg border border-[#2b3947] bg-[#10151a] text-[#d8e2e8] hover:border-white/[0.2] hover:bg-[#141b21] shadow-sm transition-all cursor-pointer font-medium"
                  >
                    Export report
                  </button>
                  <button
                    onClick={() => setActiveNav("live-attacks")}
                    className="px-4 py-2 rounded-lg bg-[#2962FF] hover:bg-[#1e4ed8] text-white font-semibold shadow-[0_0_15px_rgba(41,98,255,0.35)] transition-all cursor-pointer"
                  >
                    Run new scan
                  </button>
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
                          }}
                        />
                        <div className="text-[10.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">{k.label}</div>
                        <div
                          className="text-xl font-bold mt-1.5"
                          style={{ color: severityColor(k.type) }}
                        >
                          {k.value}
                        </div>
                        <div className="text-[11px] text-[#8a99ad] mt-1">{k.sub}</div>
                      </div>
                    ))}
              </div>

              {/* GAUGE + COMMITS SPLIT */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5.5">
                {/* Left: Latest Analyzed Commits */}
                <div className="bg-[#10151a] border border-[#263544] hover:border-[#2f4255] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between p-3 px-4 border-b border-[#253240] bg-[#12181f]/60">
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                        Latest analyzed commits
                      </h2>
                      <div className="text-[10px] text-[#8a99ad]">
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
                                message: c.commit?.message,
                                author: c.commit?.author_name,
                                date: c.commit?.authored_at,
                                score: score,
                                level: level,
                                findings: c.findings || [],
                                explanation: `Static AST security analysis identified ${c.findings?.length || 0} policy triggers in commit ${c.commit?.short_sha || ""}.`,
                              })}
                              className="p-3 px-4.5 flex items-center justify-between hover:bg-[#16202c] transition-colors cursor-pointer group"
                            >
                              <div className="min-w-0 flex-1 pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] text-[#38bdf8] font-bold">
                                    {c.commit?.short_sha || "commit"}
                                  </span>
                                  <span className="text-xs text-white font-medium truncate group-hover:text-[#38bdf8] transition-colors">
                                    {c.commit?.message || "No commit message"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[#8a99ad] mt-0.5">
                                  <span>{c.commit?.author_name}</span>
                                  <span>·</span>
                                  <span>{c.commit?.authored_at ? timeAgo(c.commit.authored_at) : "recently"}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <div className="text-right">
                                  <div className="text-[11px] font-bold" style={{ color }}>
                                    Score: {score}
                                  </div>
                                  <div className="text-[9.5px] uppercase tracking-wider text-[#8a99ad] font-semibold">
                                    {level}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="p-3 px-4 border-t border-[#253240] bg-[#12181f]/40 text-right">
                    <button
                      onClick={() => setActiveNav("commits")}
                      className="text-xs text-[#38bdf8] hover:underline font-mono"
                    >
                      View all analyzed commits →
                    </button>
                  </div>
                </div>

                {/* Right: Security Posture Risk Meter */}
                <div className="bg-[#10151a] border border-[#263544] hover:border-[#2f4255] rounded-xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#253240]">
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                        Security Posture Risk Meter
                      </h2>
                      <div className="text-[10px] font-mono text-[#8a99ad]">REAL-TIME DAST</div>
                    </div>

                    <div className="py-6 flex flex-col items-center justify-center">
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="#1e2832"
                            strokeWidth="9"
                            fill="transparent"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke={postureStatus.color}
                            strokeWidth="9"
                            strokeDasharray={264}
                            strokeDashoffset={264 - (264 * calculatedRiskScore) / 100}
                            strokeLinecap="round"
                            fill="transparent"
                            style={{ transition: "stroke-dashoffset 1s ease" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-3xl font-bold font-mono text-white">
                            {calculatedRiskScore}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-[#8a99ad] font-semibold">
                            / 100 RISK
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-center">
                        <div
                          className="text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full inline-block"
                          style={{
                            backgroundColor: `${postureStatus.color}15`,
                            color: postureStatus.color,
                            border: `1px solid ${postureStatus.color}40`,
                          }}
                        >
                          {postureStatus.label}
                        </div>
                        <p className="text-[10.5px] text-[#8a99ad] mt-2 max-w-xs">
                          Calculated continuously from live AST AST patterns, Git diff alerts, and DAST endpoints.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#253240] flex items-center justify-between text-xs">
                    <span className="text-[#8a99ad]">DAST daemon</span>
                    <span className={`font-mono font-bold ${scannerOnline ? "text-[#38bdf8]" : "text-rose-400"}`}>
                      {scannerOnline ? ":8765 ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE SECTEST FINDINGS TABLE PREVIEW */}
              <div className="bg-[#10151a] border border-[#263544] hover:border-[#2f4255] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all">
                <div className="flex items-center justify-between p-3 px-4 border-b border-[#253240] bg-[#12181f]/60">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recent security findings
                  </h2>
                  <div className="text-[10px] text-[#8a99ad]">
                    {secFindings.length} detected CVE/CWE items
                  </div>
                </div>

                {secFindings.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="font-mono text-xs text-[#8a99ad]">No active findings detected</p>
                    <p className="font-mono text-[10px] text-[#6f8390] mt-1">Run a new scan using the top button</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-[#0c1014] text-[#8a99ad] text-[10.5px] uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-4.5">Severity</th>
                          <th className="py-2.5 px-4.5">Finding</th>
                          <th className="py-2.5 px-4.5">Module</th>
                          <th className="py-2.5 px-4.5">Endpoint / Context</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#212c37]">
                        {secFindings.slice(0, 5).map((f, i) => {
                          const col = severityColor(f.severity);
                          return (
                            <tr
                              key={i}
                              onClick={() => handleOpenDetail(f)}
                              className="hover:bg-[#141b22] transition-colors cursor-pointer group"
                            >
                              <td className="py-3 px-4.5 align-top">
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                  style={{
                                    backgroundColor: `${col}20`,
                                    color: col,
                                    border: `1px solid ${col}40`,
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
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Scanned repositories
                  </h2>
                  <div className="text-[10px] text-[#8a99ad]">GET /repo</div>
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
                          onClick={() => handleSelectRepo(r.id)}
                          className="bg-[#10151a] border border-[#283747] hover:border-[#38bdf8]/40 rounded-xl p-4 space-y-3.5 shadow-sm transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm font-bold text-white hover:text-[#38bdf8] transition-colors">
                                {r.name}
                              </div>
                              <div className="text-[10.5px] font-mono text-[#8a99ad] truncate max-w-[200px] mt-0.5">
                                {r.url || "local repository"}
                              </div>
                            </div>
                            <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1d2733] text-[#38bdf8] border border-[#283747]">
                              {r.default_branch || "main"}
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#202c38] text-center font-mono">
                            <div>
                              <div className="text-[9.5px] text-[#8a99ad] uppercase">Commits</div>
                              <div className="text-xs font-bold text-white mt-0.5">{r.commit_count || 0}</div>
                            </div>
                            <div>
                              <div className="text-[9.5px] text-[#8a99ad] uppercase">Files</div>
                              <div className="text-xs font-bold text-white mt-0.5">{r.files_total || 0}</div>
                            </div>
                            <div>
                              <div className="text-[9.5px] text-[#8a99ad] uppercase">Size</div>
                              <div className="text-xs font-bold text-white mt-0.5">{formatBytes(r.total_size || 0)}</div>
                            </div>
                          </div>

                          {/* Language Breakdown Bar */}
                          <div>
                            <div className="h-1.5 w-full bg-[#18232e] rounded-full overflow-hidden flex">
                              {langEntries.map(([lang, bytes], li) => {
                                const pct = (bytes / langTotal) * 100;
                                return (
                                  <div
                                    key={lang}
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: langColors[li % langColors.length],
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-[#8a99ad] flex-wrap">
                              {langEntries.slice(0, 3).map(([lang, bytes], li) => (
                                <span key={lang} className="flex items-center gap-1">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: langColors[li % langColors.length] }}
                                  />
                                  {lang} ({Math.round((bytes / langTotal) * 100)}%)
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {activeNav === "repositories" && (
            <RepositoriesTab
              onSelectRepo={handleSelectRepo}
              onInspectCommit={handleOpenDetail}
            />
          )}

          {activeNav === "commits" && (
            <CommitsTab
              selectedRepoId={selectedRepoId}
              onSelectRepoId={setSelectedRepoId}
              onInspectCommit={handleOpenDetail}
            />
          )}

          {activeNav === "live-attacks" && <LiveAttacksTab />}

          {activeNav === "blockchain" && <BlockchainTab />}

          {activeNav === "accounts" && <AccountsTab />}

          {activeNav === "config" && <SystemConfigTab />}

          {activeNav === "sessions" && <SessionsTab />}
          </main>
        )}
        </div>
      </div>

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
                  className="px-4.5 py-2 rounded-lg font-mono text-xs bg-[#2962FF] hover:bg-[#1e4ed8] text-white font-bold shadow-[0_0_15px_rgba(41,98,255,0.35)] transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- PROFILE & CREDENTIALS MODAL ---------- */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
