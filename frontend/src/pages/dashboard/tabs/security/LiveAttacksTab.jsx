import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Radio,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  WifiOff,
  Terminal,
  Copy,
  Check,
  X,
  Plus,
  Loader2,
  Server,
  Pause,
  ArrowUpRight,
  XCircle,
  FileCode,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { attackApi, formatTimeAgo, CLI_API_BASE_URL } from "@/lib/api";
import {
  normalizeBackendAttack,
  getSeverityBadgeClass,
  getStatusBadge,
} from "../prompts/AttackHistoryTab";

const ATTACK_TYPE_CATEGORIES = [
  { id: "all", label: "All Types", icon: Radio },
  { id: "ddos", label: "DDoS", icon: Activity, color: "rose" },
  { id: "sqli", label: "SQL Injection", icon: Flame, color: "amber" },
  { id: "xss", label: "XSS", icon: Zap, color: "purple" },
  { id: "data_burning", label: "Data Exfiltration", icon: ShieldAlert, color: "cyan" },
  { id: "origin_proxy", label: "Origin & Proxy", icon: Layers, color: "emerald" },
];

const PRESET_TEMPLATES = [
  {
    type: "ddos",
    name: "DDoS Simulation",
    icon: Activity,
    badgeColor: "rose",
    description: "High-concurrency GET burst against heartbeat pulse",
    defaultTarget: {
      base_url: "http://localhost:8001",
      endpoint: "/health",
      method: "GET",
    },
    defaultAttack: {
      duration: 5.0,
      requests: 50,
      concurrency: 10,
      delay: 0.05,
      timeout: 1.0,
      retries: 0,
      on_failure: "continue",
    },
  },
  {
    type: "sqli",
    name: "SQL Injection Probe",
    icon: Flame,
    badgeColor: "amber",
    description: "Multi-vector SQL injection test cases against input parameters",
    defaultTarget: {
      base_url: "http://localhost:8001",
      endpoint: "/health",
      method: "GET",
    },
    defaultAttack: {
      requests_per_case: 1,
      delay: 0.02,
      timeout: 2.0,
      on_failure: "continue",
    },
  },
  {
    type: "xss",
    name: "XSS Vector Fuzzing",
    icon: Zap,
    badgeColor: "purple",
    description: "Reflected & DOM script sink payload delivery scan",
    defaultTarget: {
      base_url: "http://localhost:8001",
      endpoint: "/health",
      method: "GET",
    },
    defaultAttack: {
      requests_per_case: 1,
      delay: 0.02,
      timeout: 2.0,
      on_failure: "continue",
    },
  },
  {
    type: "data_burning",
    name: "Data Exfiltration Probe",
    icon: ShieldAlert,
    badgeColor: "cyan",
    description: "Response header and AST leakage vector evaluation",
    defaultTarget: {
      base_url: "http://localhost:8001",
      endpoint: "/health",
      method: "GET",
    },
    defaultAttack: {
      duration: 3.0,
      requests: 15,
      concurrency: 3,
      delay: 0.05,
      timeout: 2.0,
      retries: 0,
      on_failure: "continue",
    },
  },
  {
    type: "origin_proxy",
    name: "Origin & Proxy Test",
    icon: Layers,
    badgeColor: "emerald",
    description: "Forwarding headers, host tampering, and proxy bypass",
    defaultTarget: {
      base_url: "http://localhost:8001",
      endpoint: "/health",
      method: "GET",
    },
    defaultAttack: {
      requests_per_case: 1,
      delay: 0.02,
      timeout: 2.0,
      on_failure: "continue",
    },
  },
];

function getCategoryBadge(type) {
  const t = String(type || "").toLowerCase();
  if (t === "ddos" || t.includes("ddos")) {
    return {
      label: "DDoS",
      color: "border-rose-500/40 text-rose-400 bg-rose-500/10",
      dot: "bg-rose-500",
      icon: Activity,
    };
  }
  if (t === "sqli" || t.includes("sql")) {
    return {
      label: "SQLi",
      color: "border-amber-500/40 text-amber-400 bg-amber-500/10",
      dot: "bg-amber-500",
      icon: Flame,
    };
  }
  if (t === "xss" || t.includes("script")) {
    return {
      label: "XSS",
      color: "border-purple-500/40 text-purple-400 bg-purple-500/10",
      dot: "bg-purple-500",
      icon: Zap,
    };
  }
  if (t === "data_burning" || t.includes("burn") || t.includes("data") || t.includes("exfil")) {
    return {
      label: "Data Exfiltration",
      color: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
      dot: "bg-cyan-500",
      icon: ShieldAlert,
    };
  }
  if (t === "origin_proxy" || t.includes("proxy")) {
    return {
      label: "Origin & Proxy",
      color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
      dot: "bg-emerald-500",
      icon: Layers,
    };
  }
  return {
    label: type || "Attack",
    color: "border-blue-500/40 text-blue-400 bg-blue-500/10",
    dot: "bg-blue-500",
    icon: Server,
  };
}

export default function LiveAttacksTab({ user: propUser, token: propToken } = {}) {
  const auth = useAuth();
  const token = propToken || auth?.token;
  const user = propUser || auth?.user;
  const currentUserEmail = user?.email || "admin@threatlens.io";

  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // SSE Streaming state: stream=true & polling=false
  const [streamActive, setStreamActive] = useState(true);
  const [streamStatus, setStreamStatus] = useState("connecting");
  const [eventsReceivedCount, setEventsReceivedCount] = useState(0);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState(new Set());

  // Launch modal custom state
  const [selectedPreset, setSelectedPreset] = useState(PRESET_TEMPLATES[0]);
  const [launchBaseUrl, setLaunchBaseUrl] = useState("http://localhost:8001");
  const [launchEndpoint, setLaunchEndpoint] = useState("/health");
  const [launchMethod, setLaunchMethod] = useState("GET");
  const [launchRequests, setLaunchRequests] = useState(50);
  const [launchConcurrency, setLaunchConcurrency] = useState(10);
  const [launchDuration, setLaunchDuration] = useState(5.0);
  const [isLaunching, setIsLaunching] = useState(false);

  // Detail drawer telemetry state
  const [detailTelemetry, setDetailTelemetry] = useState(null);
  const [isDetailStreaming, setIsDetailStreaming] = useState(false);
  const [isStoppingAttack, setIsStoppingAttack] = useState(false);

  const eventSourceRef = useRef(null);
  const detailEventSourceRef = useRef(null);

  // 1. Fetch current attack list (USES SAME GET REQUEST AS IN ATTACK HISTORY)
  const fetchAttackList = useCallback(
    async (showToast = false) => {
      if (showToast) setIsRefreshing(true);
      else setLoading(true);

      try {
        const isLive = await attackApi.checkHealth();
        setBackendOnline(isLive);

        const authToken =
          token ||
          user?.token ||
          (typeof window !== "undefined"
            ? localStorage.getItem("threatlens_token")
            : null);

        // Fetch using stream: false and authToken (same as AttackHistoryTab)
        const backendData = await attackApi.getAttacks({ stream: false }, authToken);

        if (Array.isArray(backendData)) {
          const normalized = backendData.map((item) =>
            normalizeBackendAttack(item, currentUserEmail)
          );
          setAttacks(normalized);
          if (showToast) {
            toast.success(`Refreshed ${normalized.length} live attacks.`);
          }
        } else {
          setAttacks([]);
        }
      } catch (err) {
        console.error("Failed to fetch live attack list:", err);
        setAttacks([]);
        if (showToast) {
          toast.error("Failed to load live attacks from API.");
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, user, currentUserEmail]
  );

  // Initial load
  useEffect(() => {
    fetchAttackList(false);
  }, [fetchAttackList]);

  // 2. SSE Streaming subscription (stream = true & polling = false)
  useEffect(() => {
    if (!streamActive) {
      setStreamStatus("paused");
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    setStreamStatus("connecting");

    const es = attackApi.subscribeLiveAttacks({
      attack_type: selectedType === "all" ? null : selectedType,
      onOpen: () => {
        setStreamStatus("connected");
      },
      onAttackCreated: (eventData) => {
        const { attack_id, attack_type } = eventData || {};

        setEventsReceivedCount((prev) => prev + 1);

        if (attack_id) {
          setNewlyArrivedIds((prev) => new Set([...prev, attack_id]));
          setTimeout(() => {
            setNewlyArrivedIds((prev) => {
              const next = new Set(prev);
              next.delete(attack_id);
              return next;
            });
          }, 8000);
        }

        toast.info(
          `⚡ Live Attack Event: ${String(attack_type || "ATTACK").toUpperCase()} [${String(attack_id || "").slice(0, 8)}...]`,
          { duration: 4000 }
        );

        // Refresh attack list using same GET request to get fresh live data
        fetchAttackList(false);
      },
      onError: () => {
        setStreamStatus("disconnected");
      },
    });

    eventSourceRef.current = es;

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [streamActive, selectedType, fetchAttackList]);

  // Detail Drawer Telemetry streaming
  useEffect(() => {
    if (!selectedAttack || !isDrawerOpen) {
      if (detailEventSourceRef.current) {
        detailEventSourceRef.current.close();
        detailEventSourceRef.current = null;
      }
      setDetailTelemetry(null);
      setIsDetailStreaming(false);
      return;
    }

    let isMounted = true;
    const attackType = selectedAttack.attack_type || selectedAttack.type || "ddos";
    const attackId = selectedAttack.attack_id || selectedAttack.id;

    // Fetch snapshot status
    const loadStatus = async () => {
      if (!attackType || !attackId) return;
      const status = await attackApi.getAttackStatus(attackType, attackId);
      if (isMounted && status) {
        setDetailTelemetry(status);
      }
    };
    loadStatus();

    // Subscribe to SSE telemetry for this specific attack
    try {
      if (attackType && attackId) {
        const es = attackApi.subscribeAttackTelemetry(
          attackType,
          attackId,
          (data) => {
            if (isMounted && data) {
              setDetailTelemetry(data);
              setIsDetailStreaming(true);
            }
          },
          () => {
            if (isMounted) setIsDetailStreaming(false);
          }
        );
        detailEventSourceRef.current = es;
      }
    } catch {
      // ignore
    }

    return () => {
      isMounted = false;
      if (detailEventSourceRef.current) {
        detailEventSourceRef.current.close();
        detailEventSourceRef.current = null;
      }
    };
  }, [selectedAttack, isDrawerOpen]);

  // Filtered attacks based on active category
  const filteredAttacks = useMemo(() => {
    return attacks.filter((a) => {
      if (selectedType === "all") return true;
      const type = (a.attack_type || a.type || "").toLowerCase();
      const cat = (a.category || "").toLowerCase();
      if (selectedType === "ddos") return type.includes("ddos") || cat.includes("ddos");
      if (selectedType === "sqli") return type.includes("sql") || cat.includes("sql");
      if (selectedType === "xss") return type.includes("xss") || cat.includes("script");
      if (selectedType === "data_burning")
        return (
          type.includes("burn") ||
          type.includes("data") ||
          type.includes("exfil") ||
          cat.includes("exfil")
        );
      if (selectedType === "origin_proxy") return type.includes("proxy") || cat.includes("proxy");
      return type.includes(selectedType);
    });
  }, [attacks, selectedType]);

  // Launch Attack Test
  const handleLaunchAttack = async () => {
    setIsLaunching(true);
    try {
      const payload = {
        target: {
          base_url: launchBaseUrl,
          endpoint: launchEndpoint,
          method: launchMethod,
        },
        request: {},
      };

      if (selectedPreset.type === "ddos") {
        payload.attack = {
          duration: Number(launchDuration) || 5.0,
          requests: Number(launchRequests) || 50,
          concurrency: Number(launchConcurrency) || 10,
          delay: 0.05,
          timeout: 1.0,
          retries: 0,
          on_failure: "continue",
        };
      } else if (selectedPreset.type === "data_burning") {
        payload.request.headers = { "X-ThreatLens-Vectors": "API response leakage" };
        payload.attack = {
          duration: Number(launchDuration) || 3.0,
          requests: Number(launchRequests) || 15,
          concurrency: Number(launchConcurrency) || 3,
          delay: 0.05,
          timeout: 2.0,
          retries: 0,
          on_failure: "continue",
        };
      } else {
        payload.attack = {
          requests_per_case: 1,
          delay: 0.02,
          timeout: 2.0,
          on_failure: "continue",
        };
      }

      const res = await attackApi.launchAttack(selectedPreset.type, payload);
      toast.success(
        `Attack launched! [ID: ${String(res?.attack_id || "").slice(0, 8)}...]. Streaming telemetry.`
      );
      setIsLaunchModalOpen(false);
      fetchAttackList(false);
    } catch (err) {
      toast.error(`Launch failed: ${err.message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  // Stop Attack
  const handleStopAttack = async (attackType, attackId, e) => {
    if (e) e.stopPropagation();
    setIsStoppingAttack(true);
    try {
      await attackApi.stopAttack(attackType, attackId);
      toast.info(`Attack [${String(attackId).slice(0, 8)}...] stopped.`);
      fetchAttackList(false);
      if (selectedAttack?.attack_id === attackId || selectedAttack?.id === attackId) {
        const updated = await attackApi.getAttackStatus(attackType, attackId);
        if (updated) setDetailTelemetry(updated);
      }
    } catch {
      toast.error("Failed to stop attack");
    } finally {
      setIsStoppingAttack(false);
    }
  };

  const handleCopyId = (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Attack ID copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDetail = (attack) => {
    setSelectedAttack(attack);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 select-none max-w-[1600px] w-full">
      {/* ---------- HEADER & SSE STREAM STATUS BAR ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-[#2962FF]/15 border border-[#2962FF]/30 text-[#38bdf8]">
                <Radio className="w-5 h-5 text-[#38bdf8]" />
              </span>
              <span>Live Attacks</span>
            </h1>
          </div>
          <p className="text-xs text-[#8a99ad] mt-1.5 font-sans flex items-center gap-2">
            <span>Real-time attack telemetry and live execution streams.</span>
            <span className="text-white/20">|</span>
            <span className="font-mono text-[11px] text-zinc-400">
              CLI Engine: <code className="text-cyan-400">{CLI_API_BASE_URL}</code>
            </span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Refresh List (Calls exact same GET request as Attack History) */}
          <button
            onClick={() => fetchAttackList(true)}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-[#10151a] border border-[#2b3947] hover:border-white/20 text-[#8a99ad] hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Fetch attack list from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>

          {/* Launch Test Attack Button */}
          <button
            onClick={() => setIsLaunchModalOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-[#2962FF] hover:bg-[#1e4ed8] text-white font-semibold shadow-[0_0_15px_rgba(41,98,255,0.35)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Attack Test</span>
          </button>
        </div>
      </div>

      {/* ---------- BACKEND OFFLINE WARNING BANNER ---------- */}
      {!backendOnline && (
        <div className="p-3.5 px-4 rounded-xl bg-[#4A312C]/80 border border-[#7B3F00]/40 flex items-center justify-between text-xs text-[#e8d5c4] font-sans">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-[#C8A27A] shrink-0" />
            <span>
              CLI Backend is currently unreachable at{" "}
              <code className="font-mono text-white bg-black/40 px-1.5 py-0.5 rounded">
                {CLI_API_BASE_URL}
              </code>
              . Live attacks are synchronized from the primary backend API.
            </span>
          </div>
          <button
            onClick={() => fetchAttackList(true)}
            className="px-2.5 py-1 rounded bg-black/40 hover:bg-black/60 text-white font-mono text-[11px] cursor-pointer"
          >
            Retry Ping
          </button>
        </div>
      )}

      {/* ---------- ATTACK TYPE FILTER CHIPS ---------- */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          {ATTACK_TYPE_CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedType === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedType(cat.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#1b2636] border-[#2962FF] text-white shadow-[0_0_10px_rgba(41,98,255,0.2)]"
                    : "bg-[#0d1217] border-[#202c38] text-[#8a99ad] hover:text-white hover:border-[#2b3947]"
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-[#38bdf8]" : "text-[#8a99ad]"}`} />
                <span>{cat.label}</span>
                {isSelected && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#2962FF]/40 text-[10px] text-white">
                    {filteredAttacks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-mono text-[#8a99ad] hidden md:block">
          Showing {filteredAttacks.length} attacks · Filter:{" "}
          <span className="text-white uppercase font-bold">{selectedType}</span>
        </div>
      </div>

      {/* ---------- MAIN ATTACK CARDS GRID (DISPLAYS ONLY REAL DATA) ---------- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-56 bg-[#10151a] border border-[#263544] rounded-2xl animate-pulse p-5 space-y-4"
            >
              <div className="h-5 bg-white/5 rounded w-1/2" />
              <div className="h-10 bg-white/5 rounded" />
              <div className="h-16 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : filteredAttacks.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-4 text-center rounded-2xl bg-[#0c1014]/60 border border-[#202c38] flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#182230] border border-[#263544] flex items-center justify-center text-[#6EA8DA] mb-1 shadow-inner">
            <Radio className="w-7 h-7 text-[#38bdf8]" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight font-sans">
            No attacks found
          </h2>
          <p className="text-xs text-[#8a99ad] max-w-md font-sans leading-relaxed">
            There are currently no attack records matching filter{" "}
            <code className="text-white font-mono">{selectedType}</code> in the database.
          </p>
          <div className="pt-3 flex items-center gap-3">
            <button
              onClick={() => setIsLaunchModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#2962FF] hover:bg-[#1e4ed8] text-white text-xs font-semibold shadow-[0_0_15px_rgba(41,98,255,0.35)] transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Launch a test attack</span>
            </button>
            <button
              onClick={() => fetchAttackList(true)}
              className="px-3.5 py-2 rounded-lg bg-[#141d27] border border-[#283849] hover:border-white/20 text-xs text-[#8a99ad] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 font-mono"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh data</span>
            </button>
          </div>
        </div>
      ) : (
        /* Real Attack Cards - Displays actual data returned from GET request */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAttacks.map((attack) => {
            const attackId = attack.attack_id || attack.id || `atk-${Math.random()}`;
            const badge = getCategoryBadge(attack.attack_type || attack.category);
            const BadgeIcon = badge.icon;
            const isNew = newlyArrivedIds.has(attackId);
            const statusInfo = getStatusBadge(attack.status);
            const StatusIcon = statusInfo.icon;
            const severityClass = getSeverityBadgeClass(attack.severity);

            return (
              <div
                key={attackId}
                onClick={() => handleOpenDetail(attack)}
                className={`group relative bg-[#10151a] border rounded-xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm hover:scale-[1.01] ${
                  isNew
                    ? "border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50"
                    : "border-[#263544] hover:border-[#3a4d62]"
                }`}
              >
                {/* Top Section */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#182330] border border-[#263544] flex items-center justify-center shrink-0">
                        <BadgeIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          {attack.severity && (
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[9.5px] font-mono font-semibold uppercase ${severityClass}`}
                            >
                              {attack.severity}
                            </span>
                          )}
                          {isNew && (
                            <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-[9px] font-mono font-bold text-cyan-300 animate-pulse">
                              NEW SSE
                            </span>
                          )}
                        </div>
                        <h3
                          className="text-sm font-bold text-white truncate mt-1 group-hover:text-[#38bdf8] transition-colors"
                          title={attack.name}
                        >
                          {attack.name}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium ${statusInfo.class}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{attack.status}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#8a99ad] mt-1">
                        {attack.executedAt || formatTimeAgo(attack.posted_at)}
                      </div>
                    </div>
                  </div>

                  {/* Target Endpoint (Real target from GET request) */}
                  {attack.target && (
                    <div className="p-2.5 rounded-lg bg-[#0a0d10] border border-[#202c38] font-mono text-[11px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        {attack.request?.target?.method && (
                          <span className="px-1.5 py-0.5 rounded bg-[#1f2937] text-white font-bold text-[9.5px]">
                            {attack.request.target.method}
                          </span>
                        )}
                        <span className="text-[#d8e2e8] truncate" title={attack.target}>
                          {attack.target}
                        </span>
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-[#8a99ad] shrink-0 group-hover:text-white transition-colors" />
                    </div>
                  )}

                  {/* Vector (Real vector from GET request) */}
                  {attack.vector && (
                    <div className="text-[11px] text-[#8a99ad] flex items-center gap-1.5 truncate">
                      <span className="text-zinc-500 uppercase text-[9.5px] font-mono font-semibold">
                        Vector:
                      </span>
                      <span className="text-zinc-300 truncate font-mono text-[10.5px]">
                        {attack.vector}
                      </span>
                    </div>
                  )}

                  {/* Real Attack Prompt / Payload */}
                  {(attack.payload || attack.attackPrompt) && (
                    <div className="p-2 rounded-lg bg-[#090d12] border border-[#1b2636] font-mono text-[10.5px] text-zinc-300 truncate">
                      <span className="text-rose-400 font-bold mr-1.5">Payload:</span>
                      <span className="text-zinc-400">
                        {String(attack.payload || attack.attackPrompt).slice(0, 75)}
                        {String(attack.payload || attack.attackPrompt).length > 75 ? "..." : ""}
                      </span>
                    </div>
                  )}

                  {/* Real Response Summary & Duration */}
                  <div className="flex items-center justify-between text-[10.5px] font-mono text-[#8a99ad] pt-1">
                    <span className="truncate max-w-[200px]" title={attack.responseSummary}>
                      {attack.responseSummary || "Assessment logged"}
                    </span>
                    {attack.duration && (
                      <span className="px-1.5 py-0.5 rounded bg-[#131b24] border border-[#223145] text-cyan-300 font-semibold shrink-0">
                        {attack.duration}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#202c38]">
                  <span className="text-xs font-medium text-[#8a99ad] group-hover:text-white transition-colors flex items-center gap-1 font-sans">
                    Inspect Telemetry →
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleCopyId(attackId, e)}
                      className="p-1 rounded bg-[#182330] hover:bg-[#223145] text-[#8a99ad] hover:text-white border border-[#283849] transition-colors"
                      title="Copy Attack ID"
                    >
                      {copiedId === attackId ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={(e) =>
                        handleStopAttack(
                          attack.attack_type || attack.type || "ddos",
                          attackId,
                          e
                        )
                      }
                      className="px-2 py-1 rounded-md bg-[#182330] hover:bg-rose-500/20 hover:border-rose-500/40 text-[#8a99ad] hover:text-rose-300 border border-[#283849] text-[11px] font-mono font-medium transition-all cursor-pointer flex items-center gap-1"
                      title="Terminate attack"
                    >
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- SLIDE-OVER TELEMETRY DETAIL DRAWER ---------- */}
      {isDrawerOpen && selectedAttack && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-[#0f141a] border-l border-[#263544] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col justify-between p-6 overflow-y-auto space-y-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#253240]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#8a99ad] font-semibold">
                        {(selectedAttack.attack_type || selectedAttack.category || "ATTACK").toUpperCase()} TELEMETRY
                      </span>
                      {isDetailStreaming ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>STREAMING</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#182330] border border-[#283849] text-[#8a99ad] text-[10px] font-mono">
                          {selectedAttack.status?.toUpperCase() || "COMPLETED"}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1 font-sans">
                      {selectedAttack.name || selectedAttack.category}
                    </h2>
                    <p className="font-mono text-xs text-[#8a99ad] mt-0.5 flex items-center gap-1">
                      <span>ID: {selectedAttack.attack_id || selectedAttack.id}</span>
                      <button
                        onClick={(e) =>
                          handleCopyId(selectedAttack.attack_id || selectedAttack.id, e)
                        }
                        className="text-[#8a99ad] hover:text-white p-0.5"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-[#8a99ad] hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Target Information */}
                {selectedAttack.target && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-[#8a99ad] tracking-wider font-semibold">
                      Target Endpoint
                    </span>
                    <div className="p-3.5 rounded-xl bg-[#080b0e] border border-[#222e3b] font-mono text-xs space-y-1.5">
                      <div className="text-white flex items-center gap-2">
                        {selectedAttack.request?.target?.method && (
                          <span className="px-1.5 py-0.5 rounded bg-[#1f2937] text-[10px] font-bold">
                            {selectedAttack.request.target.method}
                          </span>
                        )}
                        <span className="text-cyan-300">{selectedAttack.target}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Real Attack Vector & Details */}
                {selectedAttack.vector && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-[#8a99ad] tracking-wider font-semibold">
                      Attack Vector
                    </span>
                    <div className="p-3 rounded-xl bg-[#080b0e] border border-[#222e3b] font-mono text-xs text-zinc-300">
                      {selectedAttack.vector}
                    </div>
                  </div>
                )}

                {/* Real Payload / Prompt */}
                {(selectedAttack.payload || selectedAttack.attackPrompt) && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-[#8a99ad] tracking-wider font-semibold">
                      Payload / Exploit Prompt
                    </span>
                    <div className="p-3 rounded-xl bg-[#080b0e] border border-[#222e3b] font-mono text-xs text-rose-300 whitespace-pre-wrap break-all">
                      {selectedAttack.payload || selectedAttack.attackPrompt}
                    </div>
                  </div>
                )}

                {/* Real Response Summary */}
                {selectedAttack.responseSummary && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-[#8a99ad] tracking-wider font-semibold">
                      Execution Summary
                    </span>
                    <div className="p-3 rounded-xl bg-[#080b0e] border border-[#222e3b] font-mono text-xs text-zinc-300">
                      {selectedAttack.responseSummary}
                    </div>
                  </div>
                )}

                {/* Performance & Latency Distribution (Only shown if real metrics exist) */}
                {detailTelemetry?.performance && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-[#8a99ad] tracking-wider font-semibold">
                      Performance & Latency Distribution
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                      <div className="p-3 rounded-xl bg-[#080b0e] border border-[#222e3b]">
                        <div className="text-[10px] text-[#8a99ad]">RPS</div>
                        <div className="text-sm font-semibold text-white mt-0.5">
                          {Math.round((detailTelemetry.performance.requests_per_second || 0) * 10) /
                            10}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#080b0e] border border-[#222e3b]">
                        <div className="text-[10px] text-[#8a99ad]">AVG LATENCY</div>
                        <div className="text-sm font-semibold text-white mt-0.5">
                          {Math.round((detailTelemetry.performance.average_latency_ms || 0) * 10) /
                            10}
                          ms
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#080b0e] border border-[#222e3b]">
                        <div className="text-[10px] text-[#8a99ad]">P95 LATENCY</div>
                        <div className="text-sm font-semibold text-white mt-0.5">
                          {Math.round((detailTelemetry.performance.p95_latency_ms || 0) * 10) / 10}
                          ms
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#080b0e] border border-[#222e3b]">
                        <div className="text-[10px] text-[#8a99ad]">ELAPSED</div>
                        <div className="text-sm font-semibold text-[#d8e2e8] mt-0.5">
                          {Math.round((detailTelemetry.elapsed_seconds || 0) * 10) / 10}s
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Detail (Only if present in data) */}
                {detailTelemetry?.progress && (
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-[#8a99ad]">
                      <span>Progress</span>
                      <span className="text-white">
                        {detailTelemetry.progress.attempted_requests || 0} /{" "}
                        {detailTelemetry.progress.planned_requests || 0} reqs
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#18232e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3b82f6] rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((detailTelemetry.progress.attempted_requests || 0) /
                                Math.max(1, detailTelemetry.progress.planned_requests || 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Status Code Breakdown (Only if real status codes exist) */}
                {detailTelemetry?.status_codes && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-[#8a99ad] tracking-wider font-semibold">
                      HTTP Status Code Distribution
                    </span>
                    <div className="p-3.5 rounded-xl bg-[#080b0e] border border-[#222e3b] font-mono text-xs flex flex-wrap items-center gap-4">
                      {Object.entries(detailTelemetry.status_codes).map(([code, count]) => (
                        <div key={code} className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              code.startsWith("2")
                                ? "bg-emerald-400"
                                : code.startsWith("4")
                                ? "bg-amber-400"
                                : "bg-rose-400"
                            }`}
                          />
                          <span className="text-[#8a99ad]">{code}:</span>
                          <span className="text-white font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Findings (Only if real findings exist) */}
                {Array.isArray(detailTelemetry?.findings) && detailTelemetry.findings.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-[#8a99ad] tracking-wider font-semibold">
                      Security Findings ({detailTelemetry.findings.length})
                    </span>
                    <div className="p-3 rounded-xl bg-[#080b0e] border border-[#222e3b] font-mono text-[11px] text-[#8a99ad] space-y-1.5 max-h-48 overflow-y-auto">
                      {detailTelemetry.findings.map((finding, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-black/40 border border-amber-500/20 text-zinc-300 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="text-amber-400 font-bold mr-1.5">
                              [{finding.case || "VULN"}]
                            </span>
                            <span>{finding.parameter?.name || "param"}: </span>
                            <span className="text-white">{finding.probe}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9.5px]">
                            {finding.result?.confidence || "flagged"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stored Attack Record JSON */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-[#8a99ad] tracking-wider font-semibold">
                    Raw Attack Record
                  </span>
                  <div className="p-3 rounded-xl bg-[#080b0e] border border-[#222e3b] font-mono text-[11px] text-emerald-400 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedAttack, null, 2)}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-[#253240] flex items-center justify-between gap-3">
                <button
                  onClick={() =>
                    handleStopAttack(
                      selectedAttack.attack_type || selectedAttack.type || "ddos",
                      selectedAttack.attack_id || selectedAttack.id
                    )
                  }
                  disabled={isStoppingAttack}
                  className="px-4 py-2 rounded-lg font-mono text-xs bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center gap-2 transition-all cursor-pointer font-medium"
                >
                  {isStoppingAttack ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Square className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>Terminate Attack</span>
                </button>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-5 py-2 rounded-lg font-mono text-xs bg-[#2962FF] hover:bg-[#1e4ed8] text-white font-bold shadow-sm transition-all cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- LAUNCH ATTACK TEST MODAL ---------- */}
      {isLaunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div
            onClick={() => setIsLaunchModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-xl rounded-2xl bg-[#0f141a] border border-[#263544] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#253240]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2962FF]/15 border border-[#2962FF]/40 flex items-center justify-center">
                  <Play className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    Launch Attack Test
                  </h3>
                  <p className="text-[11px] text-[#8a99ad] font-mono">
                    Sends vector attack probe and streams real-time SSE telemetry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLaunchModalOpen(false)}
                className="text-[#8a99ad] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selector Chips */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase font-mono text-[#8a99ad] font-semibold">
                Select Attack Vector
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_TEMPLATES.map((preset) => {
                  const IconComp = preset.icon;
                  const isSelected = selectedPreset.type === preset.type;
                  return (
                    <button
                      key={preset.type}
                      onClick={() => {
                        setSelectedPreset(preset);
                        if (preset.defaultAttack.requests) {
                          setLaunchRequests(preset.defaultAttack.requests);
                        }
                        if (preset.defaultAttack.concurrency) {
                          setLaunchConcurrency(preset.defaultAttack.concurrency);
                        }
                        if (preset.defaultAttack.duration) {
                          setLaunchDuration(preset.defaultAttack.duration);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#1b2636] border-[#2962FF] text-white shadow-[0_0_12px_rgba(41,98,255,0.25)]"
                          : "bg-[#0d1217] border-[#202c38] text-[#8a99ad] hover:text-white"
                      }`}
                    >
                      <IconComp
                        className={`w-4 h-4 mb-1 ${isSelected ? "text-[#38bdf8]" : "text-[#8a99ad]"}`}
                      />
                      <div className="text-xs font-bold">{preset.name}</div>
                      <div className="text-[9.5px] text-[#8a99ad] mt-0.5 truncate font-mono">
                        {preset.type}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Settings */}
            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10.5px] uppercase text-[#8a99ad] font-semibold block mb-1">
                  Target Endpoint URL
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={launchBaseUrl}
                    onChange={(e) => setLaunchBaseUrl(e.target.value)}
                    placeholder="http://localhost:8001"
                    className="col-span-2 px-3 py-2 rounded-lg bg-[#080b0e] border border-[#222e3b] text-white focus:border-[#2962FF] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={launchEndpoint}
                    onChange={(e) => setLaunchEndpoint(e.target.value)}
                    placeholder="/health"
                    className="col-span-1 px-3 py-2 rounded-lg bg-[#080b0e] border border-[#222e3b] text-white focus:border-[#2962FF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic parameters for DDoS / Data burning */}
              {(selectedPreset.type === "ddos" || selectedPreset.type === "data_burning") && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-[#8a99ad] block mb-1 uppercase">
                      Requests
                    </label>
                    <input
                      type="number"
                      value={launchRequests}
                      onChange={(e) => setLaunchRequests(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#080b0e] border border-[#222e3b] text-white focus:border-[#2962FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8a99ad] block mb-1 uppercase">
                      Concurrency
                    </label>
                    <input
                      type="number"
                      value={launchConcurrency}
                      onChange={(e) => setLaunchConcurrency(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#080b0e] border border-[#222e3b] text-white focus:border-[#2962FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8a99ad] block mb-1 uppercase">
                      Duration (s)
                    </label>
                    <input
                      type="number"
                      value={launchDuration}
                      onChange={(e) => setLaunchDuration(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#080b0e] border border-[#222e3b] text-white focus:border-[#2962FF] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#253240] flex items-center justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setIsLaunchModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#141d27] hover:bg-[#1b2636] text-[#8a99ad] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchAttack}
                disabled={isLaunching}
                className="px-5 py-2 rounded-lg bg-[#2962FF] hover:bg-[#1e4ed8] text-white font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(41,98,255,0.35)] cursor-pointer disabled:opacity-50"
              >
                {isLaunching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>Execute & Stream</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
