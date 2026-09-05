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
  BarChart3,
  Hash,
  Pause,
  Eye,
  Sparkles,
  Filter,
  Database,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { attackApi, formatTimeAgo, CLI_API_BASE_URL } from "@/lib/api";

const ATTACK_TYPE_CATEGORIES = [
  { id: "all", label: "All Types", icon: Radio },
  { id: "ddos", label: "DDoS", icon: Activity, color: "rose" },
  { id: "sqli", label: "SQL Injection", icon: Flame, color: "amber" },
  { id: "xss", label: "XSS", icon: Zap, color: "purple" },
  { id: "data_burning", label: "Data Burning", icon: ShieldAlert, color: "cyan" },
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
      base_url: "http://localhost:1234",
      endpoint: "/pulse",
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
      base_url: "http://localhost:1234",
      endpoint: "/pulse",
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
      base_url: "http://localhost:1234",
      endpoint: "/pulse",
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
      base_url: "http://localhost:1234",
      endpoint: "/pulse",
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
      base_url: "http://localhost:1234",
      endpoint: "/pulse",
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
  if (t === "ddos") {
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
  if (t === "xss") {
    return {
      label: "XSS",
      color: "border-purple-500/40 text-purple-400 bg-purple-500/10",
      dot: "bg-purple-500",
      icon: Zap,
    };
  }
  if (t === "data_burning" || t.includes("burn") || t.includes("data")) {
    return {
      label: "Data Burning",
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

export default function LiveAttacksTab() {
  const { token } = useAuth();
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // SSE Streaming state: stream=true & polling=false
  const [streamActive, setStreamActive] = useState(true);
  const [streamStatus, setStreamStatus] = useState("connecting"); // "connected" | "connecting" | "disconnected" | "paused"
  const [eventsReceivedCount, setEventsReceivedCount] = useState(0);
  const [lastEventTime, setLastEventTime] = useState(null);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState(new Set());

  // Launch modal custom state
  const [selectedPreset, setSelectedPreset] = useState(PRESET_TEMPLATES[0]);
  const [launchBaseUrl, setLaunchBaseUrl] = useState("http://localhost:1234");
  const [launchEndpoint, setLaunchEndpoint] = useState("/pulse");
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

  // 1. Fetch current attack list (USES stream = false)
  const fetchAttackList = useCallback(
    async (showToast = false) => {
      try {
        const isLive = await attackApi.checkHealth();
        setBackendOnline(isLive);

        // Fetch attack list with stream=false as specified
        const data = await attackApi.getAttacks({
          stream: false,
          attack_type: selectedType === "all" ? null : selectedType,
        });

        if (Array.isArray(data)) {
          setAttacks(data);
          if (showToast) {
            toast.success(`Refreshed ${data.length} attacks (stream=false)`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch attack list:", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedType]
  );

  // Initial load
  useEffect(() => {
    fetchAttackList(false);
  }, [fetchAttackList]);

  // 2. SSE Streaming subscription (USES stream = true & polling = false)
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
        // Event data contains { attack_id, attack_type, posted_at }
        const { attack_id, attack_type, posted_at } = eventData;

        setEventsReceivedCount((prev) => prev + 1);
        setLastEventTime(new Date());

        // Highlight newly arrived attack
        setNewlyArrivedIds((prev) => new Set([...prev, attack_id]));
        setTimeout(() => {
          setNewlyArrivedIds((prev) => {
            const next = new Set(prev);
            next.delete(attack_id);
            return next;
          });
        }, 8000);

        toast.info(
          `⚡ Real-time SSE Event: New ${attack_type.toUpperCase()} attack [${attack_id.slice(0, 8)}...]`,
          { duration: 4000 }
        );

        // Immediately refresh attack list using stream=false to get full config
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

    // Fetch snapshot status
    const loadStatus = async () => {
      const status = await attackApi.getAttackStatus(
        selectedAttack.attack_type,
        selectedAttack.attack_id
      );
      if (isMounted && status) {
        setDetailTelemetry(status);
      }
    };
    loadStatus();

    // Subscribe to SSE telemetry for this specific attack
    try {
      const es = attackApi.subscribeAttackTelemetry(
        selectedAttack.attack_type,
        selectedAttack.attack_id,
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
        // sqli, xss, origin_proxy
        payload.attack = {
          requests_per_case: 1,
          delay: 0.02,
          timeout: 2.0,
          on_failure: "continue",
        };
      }

      const res = await attackApi.launchAttack(selectedPreset.type, payload);
      toast.success(
        `Attack launched! [ID: ${res.attack_id.slice(0, 8)}...]. SSE stream will receive event.`
      );
      setIsLaunchModalOpen(false);
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
      toast.info(`Attack [${attackId.slice(0, 8)}...] stopped.`);
      fetchAttackList(false);
      if (selectedAttack?.attack_id === attackId) {
        const updated = await attackApi.getAttackStatus(attackType, attackId);
        if (updated) setDetailTelemetry(updated);
      }
    } catch (err) {
      toast.error("Failed to stop attack");
    } finally {
      setIsStoppingAttack(false);
    }
  };

  const handleCopyId = (id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Attack ID ${id} copied to clipboard`);
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
            <span>Real-time attack telemetry and in-memory event stream.</span>
            <span className="text-white/20">|</span>
            <span className="font-mono text-[11px] text-zinc-400">
              Target Engine: <code className="text-cyan-400">{CLI_API_BASE_URL}</code>
            </span>
          </p>
        </div>

        {/* Action Controls & Stream Indicator */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* SSE Stream Status Indicator */}
          <div
            className={`px-3 py-1.5 rounded-lg border font-mono text-[11.5px] flex items-center gap-2 transition-all ${
              streamStatus === "connected"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : streamStatus === "connecting"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-[#10151a] border-[#2b3947] text-[#8a99ad]"
            }`}
            title="SSE stream connected with stream=true and polling=false"
          >
            {streamStatus === "connected" ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : streamStatus === "connecting" ? (
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-zinc-500" />
            )}
            <span className="font-semibold">
              {streamStatus === "connected"
                ? "SSE Live Stream (stream=true, polling=false)"
                : streamStatus === "connecting"
                ? "Connecting SSE..."
                : "SSE Paused"}
            </span>
            {eventsReceivedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white">
                {eventsReceivedCount} evt
              </span>
            )}
          </div>

          {/* Stream Pause / Resume Toggle */}
          <button
            onClick={() => setStreamActive(!streamActive)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              streamActive
                ? "bg-[#10151a] border-[#2b3947] text-[#8a99ad] hover:text-white hover:border-[#3a4d62]"
                : "bg-[#2962FF]/15 border-[#2962FF]/40 text-[#38bdf8]"
            }`}
            title={streamActive ? "Pause live SSE stream" : "Resume live SSE stream"}
          >
            {streamActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{streamActive ? "Pause Stream" : "Resume Stream"}</span>
          </button>

          {/* Refresh List (stream=false) */}
          <button
            onClick={() => fetchAttackList(true)}
            className="px-3 py-1.5 rounded-lg bg-[#10151a] border border-[#2b3947] hover:border-white/20 text-[#8a99ad] hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Fetch attack list snapshot with stream=false"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh List (stream=false)</span>
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
              . Start backend with{" "}
              <code className="font-mono text-amber-300">python -m connect</code> to monitor live
              attacks.
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
                    {attacks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-mono text-[#8a99ad] hidden md:block">
          Showing {attacks.length} attacks · Filter:{" "}
          <span className="text-white uppercase font-bold">{selectedType}</span>
        </div>
      </div>

      {/* ---------- MAIN ATTACK CARDS GRID ---------- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-[#10151a] border border-[#263544] rounded-2xl animate-pulse p-5 space-y-4"
            >
              <div className="h-5 bg-white/5 rounded w-1/2" />
              <div className="h-10 bg-white/5 rounded" />
              <div className="h-20 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : attacks.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-4 text-center rounded-2xl bg-[#0c1014]/60 border border-[#202c38] flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#182230] border border-[#263544] flex items-center justify-center text-[#6EA8DA] mb-1 shadow-inner">
            <Radio className="w-7 h-7 text-[#38bdf8]" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight font-sans">
            No attacks in in-memory store
          </h2>
          <p className="text-xs text-[#8a99ad] max-w-md font-sans leading-relaxed">
            There are currently no active or stored attacks matching filter{" "}
            <code className="text-white font-mono">{selectedType}</code> in the running backend
            process.
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
              <span>Check again (stream=false)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Live Running Attack Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {attacks.map((attack) => {
            const badge = getCategoryBadge(attack.attack_type);
            const BadgeIcon = badge.icon;
            const isNew = newlyArrivedIds.has(attack.attack_id);

            const config = attack.config || {};
            const target = config.target || {};
            const attackConfig = config.attack || {};
            const targetUrl = target.base_url
              ? `${target.base_url}${target.endpoint || ""}`
              : "http://localhost:1234/pulse";

            return (
              <div
                key={attack.attack_id}
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
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#182330] border border-[#263544] flex items-center justify-center shrink-0">
                        <BadgeIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          {isNew && (
                            <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-[9px] font-mono font-bold text-cyan-300 animate-pulse">
                              NEW SSE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-mono text-zinc-400">
                            ID: {attack.attack_id.slice(0, 14)}...
                          </span>
                          <button
                            onClick={(e) => handleCopyId(attack.attack_id, e)}
                            className="text-[#8a99ad] hover:text-white p-0.5 transition-colors"
                            title="Copy Attack ID"
                          >
                            {copiedId === attack.attack_id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#182330] border border-[#283849] text-zinc-400 text-[10px] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>STORED</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#8a99ad] mt-1">
                        {formatTimeAgo(attack.posted_at)}
                      </div>
                    </div>
                  </div>

                  {/* Target Endpoint */}
                  <div className="p-2.5 rounded-lg bg-[#0a0d10] border border-[#202c38] font-mono text-[11px] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-[#1f2937] text-white font-bold text-[9.5px]">
                        {target.method || "GET"}
                      </span>
                      <span className="text-[#d8e2e8] truncate" title={targetUrl}>
                        {targetUrl}
                      </span>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-[#8a99ad] shrink-0 group-hover:text-white transition-colors" />
                  </div>

                  {/* Configuration Parameters Pill Matrix */}
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-center pt-1">
                    {attack.attack_type === "ddos" ? (
                      <>
                        <div className="p-1.5 rounded bg-[#0d1217] border border-[#202c38]">
                          <div className="text-[9px] text-[#8a99ad] uppercase">REQS</div>
                          <div className="text-xs font-semibold text-white mt-0.5">
                            {attackConfig.requests || "N/A"}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-[#0d1217] border border-[#202c38]">
                          <div className="text-[9px] text-[#8a99ad] uppercase">WORKERS</div>
                          <div className="text-xs font-semibold text-white mt-0.5">
                            {attackConfig.concurrency || 10}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-[#0d1217] border border-[#202c38]">
                          <div className="text-[9px] text-[#8a99ad] uppercase">DURATION</div>
                          <div className="text-xs font-semibold text-[#d8e2e8] mt-0.5">
                            {attackConfig.duration ? `${attackConfig.duration}s` : "N/A"}
                          </div>
                        </div>
                      </>
                    ) : attack.attack_type === "data_burning" ? (
                      <>
                        <div className="p-1.5 rounded bg-[#0d1217] border border-[#202c38]">
                          <div className="text-[9px] text-[#8a99ad] uppercase">REQS</div>
                          <div className="text-xs font-semibold text-white mt-0.5">
                            {attackConfig.requests || 10}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-[#0d1217] border border-[#202c38]">
                          <div className="text-[9px] text-[#8a99ad] uppercase">CONCURRENCY</div>
                          <div className="text-xs font-semibold text-white mt-0.5">
                            {attackConfig.concurrency || 2}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-[#0d1217] border border-[#202c38]">
                          <div className="text-[9px] text-[#8a99ad] uppercase">DELAY</div>
                          <div className="text-xs font-semibold text-[#d8e2e8] mt-0.5">
                            {attackConfig.delay ? `${attackConfig.delay}s` : "0.05s"}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-1.5 rounded bg-[#0d1217] border border-[#202c38]">
                          <div className="text-[9px] text-[#8a99ad] uppercase">CASES</div>
                          <div className="text-xs font-semibold text-white mt-0.5">Enabled</div>
                        </div>
                        <div className="p-1.5 rounded bg-[#0d1217] border border-[#202c38]">
                          <div className="text-[9px] text-[#8a99ad] uppercase">DELAY</div>
                          <div className="text-xs font-semibold text-white mt-0.5">
                            {attackConfig.delay ? `${attackConfig.delay}s` : "0.02s"}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-[#0d1217] border border-[#202c38]">
                          <div className="text-[9px] text-[#8a99ad] uppercase">TIMEOUT</div>
                          <div className="text-xs font-semibold text-[#d8e2e8] mt-0.5">
                            {attackConfig.timeout ? `${attackConfig.timeout}s` : "2.0s"}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#202c38]">
                  <span className="text-xs font-medium text-[#8a99ad] group-hover:text-white transition-colors flex items-center gap-1 font-sans">
                    Inspect Telemetry →
                  </span>

                  <button
                    onClick={(e) => handleStopAttack(attack.attack_type, attack.attack_id, e)}
                    className="px-2.5 py-1 rounded-md bg-[#182330] hover:bg-rose-500/20 hover:border-rose-500/40 text-[#8a99ad] hover:text-rose-300 border border-[#283849] text-[11px] font-mono font-medium transition-all cursor-pointer flex items-center gap-1"
                    title="Terminate running attack"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop</span>
                  </button>
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
                        {selectedAttack.attack_type.toUpperCase()} ATTACK TELEMETRY
                      </span>
                      {isDetailStreaming ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>STREAMING</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#182330] border border-[#283849] text-[#8a99ad] text-[10px] font-mono">
                          {detailTelemetry?.status?.toUpperCase() || "STORED"}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1 font-sans">
                      {selectedAttack.attack_type.toUpperCase()} Penetration Execution
                    </h2>
                    <p className="font-mono text-xs text-[#8a99ad] mt-0.5 flex items-center gap-1">
                      <span>ID: {selectedAttack.attack_id}</span>
                      <button
                        onClick={(e) => handleCopyId(selectedAttack.attack_id, e)}
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
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-[#8a99ad] tracking-wider font-semibold">
                    Target Configuration
                  </span>
                  <div className="p-3.5 rounded-xl bg-[#080b0e] border border-[#222e3b] font-mono text-xs space-y-1.5">
                    <div className="text-white flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#1f2937] text-[10px] font-bold">
                        {selectedAttack.config?.target?.method || "GET"}
                      </span>
                      <span className="text-cyan-300">
                        {selectedAttack.config?.target?.base_url}
                        {selectedAttack.config?.target?.endpoint}
                      </span>
                    </div>
                    {selectedAttack.config?.target?.query_params && (
                      <div className="text-[11px] text-zinc-400">
                        <span className="text-[#8a99ad]">Query: </span>
                        {JSON.stringify(selectedAttack.config.target.query_params)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Status & Performance Benchmarks */}
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

                {/* Progress Detail */}
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

                {/* Status Code Breakdown */}
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

                {/* Findings (for SQLi, XSS, etc.) */}
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

                {/* Raw Config Object */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-[#8a99ad] tracking-wider font-semibold">
                    In-Memory Stored Configuration
                  </span>
                  <div className="p-3 rounded-xl bg-[#080b0e] border border-[#222e3b] font-mono text-[11px] text-emerald-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedAttack.config, null, 2)}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-[#253240] flex items-center justify-between gap-3">
                <button
                  onClick={() =>
                    handleStopAttack(selectedAttack.attack_type, selectedAttack.attack_id)
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
                    Launch Penetration Test Attack
                  </h3>
                  <p className="text-[11px] text-[#8a99ad] font-mono">
                    Submits to local CLI engine and triggers real-time SSE event
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
                    placeholder="http://localhost:1234"
                    className="col-span-2 px-3 py-2 rounded-lg bg-[#080b0e] border border-[#222e3b] text-white focus:border-[#2962FF] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={launchEndpoint}
                    onChange={(e) => setLaunchEndpoint(e.target.value)}
                    placeholder="/pulse"
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
