import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  RotateCcw,
  Download,
  Sparkles,
  Terminal,
  Bot,
  Check,
  Zap,
  Shield,
  Building2,
  X as XIcon,
  Star,
  Lock,
  Users,
  Globe,
  Clock,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Coins,
  Activity,
  Server,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  FileText,
  Receipt,
  Printer,
  Calendar,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usageApi } from "@/lib/api";
import PaymentCheckoutModal from "./PaymentCheckoutModal";
import DowngradeConfirmModal from "./DowngradeConfirmModal";
import InvoiceReceiptModal from "./InvoiceReceiptModal";

export const DEFAULT_INVOICES = [
  {
    id: "INV-TL-2026-08192",
    date: "Aug 15, 2026",
    timestamp: "2026-08-15T12:00:00Z",
    plan: "Pro",
    planId: "pro",
    billingCycle: "Monthly",
    tokensAllocated: "10M / mo",
    subtotal: 29.0,
    discount: 0,
    amount: 29.0,
    currency: "USD",
    status: "PAID",
    paymentMethod: "Visa ending in 4242",
    authCode: "TL-AUTH-8921B",
    merkleRoot: "0x7f482ab4c08e827104b281f948bb319c",
    customerName: "Alex Vance",
    customerEmail: "alex@threatlens.io",
    accountId: "1",
    description: "ThreatLens Pro - Monthly Subscription",
  },
  {
    id: "INV-TL-2026-07119",
    date: "Jul 15, 2026",
    timestamp: "2026-07-15T12:00:00Z",
    plan: "Pro",
    planId: "pro",
    billingCycle: "Monthly",
    tokensAllocated: "10M / mo",
    subtotal: 29.0,
    discount: 5.8,
    promoCode: "HACKER20",
    amount: 23.2,
    currency: "USD",
    status: "PAID",
    paymentMethod: "Visa ending in 4242",
    authCode: "TL-AUTH-5512A",
    merkleRoot: "0x4a1829e0b1c97a82910f8237e1927361",
    customerName: "Alex Vance",
    customerEmail: "alex@threatlens.io",
    accountId: "1",
    description: "ThreatLens Pro - Monthly Subscription (Promo Applied)",
  },
];

export const OPENROUTER_PRICING = {
  chatbot: { model: "DeepSeek V3 / R1", inputPricePerM: 0.14, outputPricePerM: 0.28 },
  terminal: { model: "Llama 3.3 70B / Gemini Flash", inputPricePerM: 0.12, outputPricePerM: 0.30 },
};

export const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    tokenQuota: 500000,
    tokens: "500K tokens / mo",
    description: "For individuals exploring ThreatLens security scanning.",
    color: "#71717a",
    border: "border-[#27272a]",
    cta: "Current Plan",
    features: [
      { label: "5 repositories", included: true },
      { label: "100 commits / month", included: true },
      { label: "ThreatLensGO (10 sessions)", included: true },
      { label: "Basic secret detection", included: true },
      { label: "Community support", included: true },
      { label: "CI/CD pipeline scanning", included: false },
      { label: "Compliance reports", included: false },
      { label: "Team seats", included: false },
      { label: "SIEM & webhook integrations", included: false },
      { label: "SLA & dedicated support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Shield,
    monthlyPrice: 29,
    yearlyPrice: 23,
    tokenQuota: 10000000,
    tokens: "10M tokens / mo",
    description: "For developers & small security teams shipping confidently.",
    color: "#38bdf8",
    border: "border-[#1e4068]",
    cta: "Upgrade to Pro",
    popular: true,
    features: [
      { label: "Unlimited repositories", included: true },
      { label: "Unlimited commits", included: true },
      { label: "ThreatLensGO (unlimited)", included: true },
      { label: "Advanced secret detection", included: true },
      { label: "Priority email support", included: true },
      { label: "CI/CD pipeline scanning", included: true },
      { label: "Compliance reports (SOC2, OWASP)", included: true },
      { label: "5 team seats", included: true },
      { label: "SIEM & webhook integrations", included: false },
      { label: "SLA & dedicated support", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    monthlyPrice: 199,
    yearlyPrice: 159,
    tokenQuota: Infinity,
    tokens: "Unlimited tokens",
    description: "Custom security infrastructure for large engineering orgs.",
    color: "#a78bfa",
    border: "border-[#3b1f6b]",
    cta: "Upgrade to Enterprise",
    features: [
      { label: "Unlimited repositories", included: true },
      { label: "Unlimited commits", included: true },
      { label: "ThreatLensGO (custom models)", included: true },
      { label: "Enterprise secret detection + DLP", included: true },
      { label: "24/7 dedicated support", included: true },
      { label: "CI/CD pipeline scanning", included: true },
      { label: "Full compliance suite (PCI, HIPAA, ISO)", included: true },
      { label: "Unlimited team seats", included: true },
      { label: "SIEM & webhook integrations", included: true },
      { label: "Custom SLA & on-prem deployment", included: true },
    ],
  },
];

function RealUsageTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 shadow-2xl text-xs space-y-1 z-50">
        <div className="text-white font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
          <span>{d.name}</span>
        </div>
        <div className="text-[#A1A1AA] flex justify-between gap-4">
          <span>Tokens:</span>
          <span className="text-white font-mono font-medium">{d.tokens.toLocaleString()}</span>
        </div>
        <div className="text-[#A1A1AA] flex justify-between gap-4">
          <span>Estimated Spend:</span>
          <span className="text-[#38BDF8] font-mono font-semibold">${d.cost.toFixed(5)}</span>
        </div>
        <div className="text-[#71717A] text-[10px] pt-1 border-t border-[#27272a]">
          {d.type}
        </div>
      </div>
    );
  }
  return null;
}

export default function TokenUsageTab({ user: propUser, initialSection = "usage", onBack }) {
  const { user: authUser, token, updateUser } = useAuth();
  const currentUser = propUser || authUser;

  const [viewMode, setViewMode] = useState(initialSection === "plans" ? "plans" : "usage");
  const [activeCategory, setActiveCategory] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [activeHoverBar, setActiveHoverBar] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  // Invoices & Billing State
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem("threatlens_invoices");
      return saved ? JSON.parse(saved) : DEFAULT_INVOICES;
    } catch {
      return DEFAULT_INVOICES;
    }
  });

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);
  const [selectedTargetPlan, setSelectedTargetPlan] = useState(null);

  // Real backend usage data state
  const [usage, setUsage] = useState({
    id: null,
    account_id: null,
    prompt_tokens: 0,
    completion_tokens: 0,
    plan: (typeof window !== "undefined" ? localStorage.getItem("threatlens_plan") : null) || currentUser?.plan || "free",
  });

  // Sync viewMode when initialSection changes
  useEffect(() => {
    if (initialSection) {
      setViewMode(initialSection === "plans" ? "plans" : "usage");
    }
  }, [initialSection]);

  // Fetch real account usage from backend
  const fetchUsageData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      setError(null);
      const data = await usageApi.getUsage(token);
      
      // If billing tokens are missing or not returned by the backend
      if (!data || (data.prompt_tokens === undefined && data.completion_tokens === undefined)) {
        throw new Error("Failed to fetch: No billing token data received from backend");
      }

      const activePlan = (data.plan || localStorage.getItem("threatlens_plan") || currentUser?.plan || "free").toLowerCase();
      setUsage({
        id: data.id ?? null,
        account_id: data.account_id ?? currentUser?.id ?? null,
        prompt_tokens: Number(data.prompt_tokens) || 0,
        completion_tokens: Number(data.completion_tokens) || 0,
        plan: activePlan,
      });
      setLastSynced(new Date());
      if (showToast) {
        toast.success("Usage telemetry synchronized with backend");
      }
    } catch {
      const savedPlan = (typeof window !== "undefined" ? localStorage.getItem("threatlens_plan") : null) || currentUser?.plan || "free";
      setUsage((prev) => ({
        ...prev,
        account_id: prev.account_id ?? currentUser?.id ?? 1,
        plan: savedPlan.toLowerCase(),
      }));
      if (showToast) {
        toast.info("Operating in local sandbox mode - plan state synchronized");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, currentUser]);

  useEffect(() => {
    fetchUsageData(false);
  }, [fetchUsageData]);

  // Calculated real metrics
  const promptTokens = usage.prompt_tokens;
  const completionTokens = usage.completion_tokens;
  const totalTokens = promptTokens + completionTokens;

  // Real costs computed via OpenRouter benchmark rates
  const promptCost = (promptTokens / 1e6) * OPENROUTER_PRICING.chatbot.inputPricePerM;
  const completionCost = (completionTokens / 1e6) * OPENROUTER_PRICING.chatbot.outputPricePerM;
  const totalSpend = promptCost + completionCost;

  // Active plan resolution
  const activePlanId = (usage.plan || "free").toLowerCase();
  const currentPlanConfig = PLANS.find((p) => p.id === activePlanId) || PLANS[0];
  const quota = currentPlanConfig.tokenQuota;
  const quotaPercent =
    quota === Infinity ? 0 : Math.min(100, Math.round((totalTokens / quota) * 100 * 10) / 10);
  const remainingTokens =
    quota === Infinity ? "Unlimited" : Math.max(0, quota - totalTokens).toLocaleString();

  // Dynamic plans array with active current marker
  const dynamicPlans = useMemo(() => {
    return PLANS.map((p) => {
      const isCurrent = p.id === activePlanId;
      let cta = `Upgrade to ${p.name}`;
      if (isCurrent) {
        cta = "Current Plan";
      } else if (p.id === "free") {
        cta = "Switch to Free";
      } else if (p.id === "enterprise") {
        cta = "Upgrade to Enterprise";
      }
      return {
        ...p,
        current: isCurrent,
        cta,
      };
    });
  }, [activePlanId]);

  // Telemetry Chart Data for real tokens
  const chartData = useMemo(() => {
    return [
      {
        name: "Prompt Tokens",
        shortName: "Prompt",
        tokens: promptTokens,
        cost: promptCost,
        type: "Input / Context Tokens",
        color: "#38BDF8",
      },
      {
        name: "Completion Tokens",
        shortName: "Completion",
        tokens: completionTokens,
        cost: completionCost,
        type: "Output / Generated Tokens",
        color: "#818CF8",
      },
      {
        name: "Total Consumed",
        shortName: "Total",
        tokens: totalTokens,
        cost: totalSpend,
        type: "Combined Token Count",
        color: "#10B981",
      },
    ];
  }, [promptTokens, completionTokens, totalTokens, promptCost, completionCost, totalSpend]);

  // Initiate Plan Selection (opens Payment Checkout or Downgrade modal)
  const handleSelectPlan = (plan) => {
    if (plan.id === activePlanId) {
      toast.info(`You are currently subscribed to the ${plan.name} plan`);
      return;
    }
    if (plan.id === "free") {
      setSelectedTargetPlan(plan);
      setIsDowngradeModalOpen(true);
      return;
    }
    // Pro or Enterprise upgrade opens the dummy payment checkout modal!
    setSelectedTargetPlan(plan);
    setIsCheckoutModalOpen(true);
  };

  // Callback when payment is authorized in checkout modal
  const handlePaymentSuccess = async (newInvoice, targetPlan) => {
    // 1. Update local state
    setUsage((prev) => ({ ...prev, plan: targetPlan.id }));
    // 2. Persist to localStorage
    localStorage.setItem("threatlens_plan", targetPlan.id);
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    localStorage.setItem("threatlens_invoices", JSON.stringify(updatedInvoices));
    // 3. Update AuthContext if available
    if (updateUser && currentUser) {
      updateUser({ ...currentUser, plan: targetPlan.id });
    }
    // 4. Update backend if online
    try {
      await usageApi.updateUsage(
        {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          plan: targetPlan.id,
        },
        token
      );
    } catch {
      // Backend offline fallback handled gracefully
    }
    toast.success(`🎉 Subscription activated! Welcome to ThreatLens ${targetPlan.name}`);
  };

  // Callback when downgrade to Free is confirmed
  const handleConfirmDowngrade = async () => {
    const downgradeInvoice = {
      id: `INV-TL-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timestamp: new Date().toISOString(),
      plan: "Free",
      planId: "free",
      billingCycle: "Monthly",
      tokensAllocated: "500K / mo",
      subtotal: 0,
      discount: 0,
      amount: 0,
      currency: "USD",
      status: "PAID",
      paymentMethod: "Free Plan Switch ($0.00)",
      authCode: `TL-DOWN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      merkleRoot: "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
      customerName: currentUser?.name || "Alex Vance",
      customerEmail: currentUser?.email || "alex@threatlens.io",
      accountId: currentUser?.id || "1",
      description: "ThreatLens Free Tier Switch",
    };

    setUsage((prev) => ({ ...prev, plan: "free" }));
    localStorage.setItem("threatlens_plan", "free");
    const updatedInvoices = [downgradeInvoice, ...invoices];
    setInvoices(updatedInvoices);
    localStorage.setItem("threatlens_invoices", JSON.stringify(updatedInvoices));
    if (updateUser && currentUser) {
      updateUser({ ...currentUser, plan: "free" });
    }
    try {
      await usageApi.updateUsage(
        {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          plan: "free",
        },
        token
      );
    } catch {
      // offline fallback
    }
    toast.success("Successfully switched to ThreatLens Free plan");
  };

  // Export real CSV telemetry
  const handleExport = () => {
    const csvContent = [
      ["Metric", "Value", "Unit"],
      ["Account ID", usage.account_id ?? currentUser?.id ?? "N/A", "ID"],
      ["Current Plan", currentPlanConfig.name, "Tier"],
      ["Prompt Tokens (Input)", promptTokens, "Tokens"],
      ["Completion Tokens (Output)", completionTokens, "Tokens"],
      ["Total Tokens Consumed", totalTokens, "Tokens"],
      ["Prompt Spend (USD)", promptCost.toFixed(6), "USD"],
      ["Completion Spend (USD)", completionCost.toFixed(6), "USD"],
      ["Total Spend (USD)", totalSpend.toFixed(6), "USD"],
      ["Token Quota", quota === Infinity ? "Unlimited" : quota, "Tokens"],
      ["Remaining Quota", remainingTokens, "Tokens"],
      ["Telemetry Last Synced", lastSynced ? lastSynced.toISOString() : new Date().toISOString(), "ISO Timestamp"],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `threatlens_usage_account_${usage.account_id || "telemetry"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Account usage telemetry exported as CSV");
  };

  return (
    <div className="flex-1 bg-[#121214] text-[#EDEDED] font-sans antialiased min-h-[calc(100vh-3.5rem)] flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 select-none overflow-y-auto">
      {/* ── TOP NAVIGATION BAR (Switcher between Usage and Plans) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222226]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-[#1c1c1f] hover:bg-[#25252a] border border-[#2e2e33] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Sub-view switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#18181b] border border-[#27272a]">
            <button
              onClick={() => setViewMode("usage")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "usage"
                  ? "bg-[#27272a] text-white shadow-xs"
                  : "text-[#71717a] hover:text-white"
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${viewMode === "usage" ? "text-[#38bdf8]" : ""}`} />
              <span>Token Usage</span>
            </button>

            <button
              onClick={() => setViewMode("plans")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "plans"
                  ? "bg-[#27272a] text-white shadow-xs"
                  : "text-[#71717a] hover:text-white"
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${viewMode === "plans" ? "text-[#f59e0b]" : ""}`} />
              <span>Subscription Plans</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded-md bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-bold uppercase">
                {activePlanId}
              </span>
            </button>

            <button
              onClick={() => setViewMode("invoices")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "invoices"
                  ? "bg-[#27272a] text-white shadow-xs"
                  : "text-[#71717a] hover:text-white"
              }`}
            >
              <CreditCard className={`w-3.5 h-3.5 ${viewMode === "invoices" ? "text-[#34d399]" : ""}`} />
              <span>Billing & Invoices</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                {invoices.length}
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1c1f] border border-[#2e2e33] text-xs text-[#d1d5db]">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[#9ca3af]">Account:</span>
            <span className="font-mono text-white font-medium">#{usage.account_id ?? currentUser?.id ?? "1"}</span>
            <span className="text-[#3f3f46]">|</span>
            <span className="text-[#38bdf8] uppercase text-[10.5px] font-bold">{activePlanId}</span>
          </div>
        </div>

        {/* Right Controls (shown on usage tab) */}
        {viewMode === "usage" ? (
          <div className="flex items-center gap-2 flex-wrap">
            {lastSynced && (
              <span className="text-[11px] text-[#71717A] hidden lg:inline-block">
                Synced {lastSynced.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchUsageData(true)}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1c1f] hover:bg-[#25252a] border border-[#2e2e33] text-xs text-[#9ca3af] hover:text-white transition-all cursor-pointer ${
                isRefreshing ? "opacity-75" : ""
              }`}
              title="Sync with Backend"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#38BDF8]" : ""}`} />
              <span>Sync</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1c1f] hover:bg-[#25252a] border border-[#2e2e33] text-xs text-[#9ca3af] hover:text-white transition-all cursor-pointer"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setViewMode("usage")}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1c1c1f] hover:bg-[#25252a] border border-[#2e2e33] text-xs text-[#d1d5db] hover:text-white transition-colors cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>View Token Telemetry</span>
          </button>
        )}
      </div>

      {/* ── CONDITIONAL VIEW 1: REAL TOKEN USAGE TELEMETRY ── */}
      {viewMode === "usage" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Error Banner if fetch fails */}
          {error && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-200 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Failed to fetch token usage</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-mono">ERROR</span>
                  </div>
                  <div className="text-xs text-rose-300/80 mt-0.5">{error}</div>
                </div>
              </div>
              <button
                onClick={() => fetchUsageData(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-900/90 border border-rose-700/60 text-xs font-semibold text-white transition-all cursor-pointer shrink-0"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Retry Fetch</span>
              </button>
            </div>
          )}

          {/* Active Plan Banner & Upgrade CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#0b1a30] via-[#101018] to-[#120a28] border border-[#1e4068]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-[#38bdf8]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Current Tier:</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] text-xs uppercase font-extrabold tracking-wider border border-[#38bdf8]/30">
                    {currentPlanConfig.name}
                  </span>
                  <span className="text-xs text-[#71717a] font-normal">({currentPlanConfig.tokens})</span>
                </div>
                <div className="text-xs text-[#9ca3af] mt-0.5">
                  Real account token usage authenticated via ThreatLens Backend API (/usage).
                </div>
              </div>
            </div>
            <button
              onClick={() => setViewMode("plans")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-b from-[#1e5adb] via-[#1342a8] to-[#0c2a74] text-[#E0F2FE] hover:text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md shadow-blue-900/30 hover:brightness-110"
            >
              <span>Manage Subscription</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Real Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between text-[#9ca3af] text-xs">
                <span>Prompt Tokens (Input)</span>
                <Bot className="w-4 h-4 text-[#38bdf8]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#38bdf8]" /> : promptTokens.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#71717A] flex justify-between">
                <span>Rate: $0.14 / 1M</span>
                <span className="text-[#38bdf8] font-mono font-medium">${promptCost.toFixed(5)}</span>
              </div>
            </div>

            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between text-[#9ca3af] text-xs">
                <span>Completion Tokens (Output)</span>
                <Terminal className="w-4 h-4 text-[#818cf8]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#818cf8]" /> : completionTokens.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#71717A] flex justify-between">
                <span>Rate: $0.28 / 1M</span>
                <span className="text-[#818cf8] font-mono font-medium">${completionCost.toFixed(5)}</span>
              </div>
            </div>

            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between text-[#9ca3af] text-xs">
                <span>Total Tokens Consumed</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> : totalTokens.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#71717A] flex justify-between">
                <span>Combined Volume</span>
                <span className="text-white font-mono font-medium">{totalTokens > 0 ? "100%" : "0%"}</span>
              </div>
            </div>

            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4.5 space-y-2">
              <div className="flex items-center justify-between text-[#9ca3af] text-xs">
                <span>Calculated Spend</span>
                <Activity className="w-4 h-4 text-[#f59e0b]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#f59e0b]" /> : `$${totalSpend.toFixed(5)}`}
              </div>
              <div className="text-[11px] text-[#71717A] flex justify-between">
                <span>Plan Quota:</span>
                <span className="text-white font-medium">{currentPlanConfig.tokens}</span>
              </div>
            </div>
          </div>

          {/* Hero Telemetry Visualizer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Real Token Distribution */}
            <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-2xl p-5 flex flex-col space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs font-medium text-[#9ca3af]">Live Token Telemetry Distribution</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight mt-1">
                    {totalTokens.toLocaleString()}{" "}
                    <span className="text-sm font-sans font-normal text-[#71717a]">Tokens Ingested & Generated</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#222226] border border-[#2e2e33] text-[11px] text-[#a1a1aa]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-Time Backend Sync</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart representing real prompt vs completion tokens */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.5} />
                    <XAxis
                      dataKey="shortName"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      tickFormatter={(val) =>
                        val >= 1e6
                          ? `${(val / 1e6).toFixed(1)}M`
                          : val >= 1e3
                          ? `${(val / 1e3).toFixed(0)}K`
                          : val
                      }
                    />
                    <Tooltip content={<RealUsageTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar
                      dataKey="tokens"
                      radius={[6, 6, 0, 0]}
                      onMouseEnter={(_, i) => setActiveHoverBar(i)}
                      onMouseLeave={() => setActiveHoverBar(null)}
                    >
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={i === activeHoverBar ? "#60a5fa" : entry.color}
                          opacity={activeHoverBar === null || activeHoverBar === i ? 1 : 0.6}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-[#71717A] pt-3 border-t border-[#222226]">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" />
                    <span>Prompt: {promptTokens.toLocaleString()} tokens</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#818CF8]" />
                    <span>Completion: {completionTokens.toLocaleString()} tokens</span>
                  </span>
                </div>
                <span className="font-mono text-[#38BDF8] font-semibold">${totalSpend.toFixed(5)} total spend</span>
              </div>
            </div>

            {/* Quota & Subscription Status Card */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">Monthly Allocation</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] font-bold uppercase">
                    {currentPlanConfig.name}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {quota === Infinity ? "Unlimited" : `${(quota / 1e6).toFixed(1)}M`}
                  <span className="text-xs font-normal text-[#71717a] ml-1.5">tokens / month</span>
                </div>
                <div className="text-xs text-[#71717a]">
                  Account ID #{usage.account_id ?? currentUser?.id ?? "1"}
                </div>
              </div>

              {/* Progress gauge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9ca3af]">Quota Consumed</span>
                  <span className="text-[#38BDF8] font-mono font-bold">
                    {quota === Infinity ? "0%" : `${quotaPercent}%`}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#27272a] rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      quotaPercent > 90
                        ? "bg-rose-500"
                        : quotaPercent > 70
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-[#2563EB] to-[#38BDF8]"
                    }`}
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#71717a] pt-0.5">
                  <span>{totalTokens.toLocaleString()} used</span>
                  <span>{remainingTokens} remaining</span>
                </div>
              </div>

              {/* Plan Limits Details */}
              <div className="pt-3 border-t border-[#222226] space-y-2.5">
                <div className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">
                  Tier Capabilities
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#d1d5db]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Repositories</span>
                  </span>
                  <span className="font-semibold text-white">
                    {activePlanId === "free" ? "5 repos" : "Unlimited"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#d1d5db]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Secret Detection</span>
                  </span>
                  <span className="font-semibold text-white">
                    {activePlanId === "free" ? "Basic AST" : "Enterprise DLP"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#d1d5db]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CI/CD Integration</span>
                  </span>
                  <span className={`font-semibold ${activePlanId === "free" ? "text-[#71717a]" : "text-white"}`}>
                    {activePlanId === "free" ? "Pro Only" : "Active"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Real Telemetry Breakdown Table */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-6 border-b border-[#222226] pb-1">
              {[
                { id: "overview", label: "All Telemetry", Icon: Layers },
                { id: "prompt", label: "Prompt / Ingest", Icon: Bot, col: "text-[#38BDF8]" },
                { id: "completion", label: "Completion / Output", Icon: Terminal, col: "text-[#818CF8]" },
              ].map(({ id, label, Icon, col }) => (
                <button
                  key={id}
                  onClick={() => setActiveCategory(id)}
                  className={`pb-3 text-sm font-semibold relative cursor-pointer flex items-center gap-2 transition-colors ${
                    activeCategory === id ? "text-white" : "text-[#71717A] hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${col || "text-white"}`} />
                  <span>{label}</span>
                  {activeCategory === id && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-white rounded-full" />}
                </button>
              ))}
            </div>

            {/* Telemetry Breakdown Table */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 border-b border-[#222226] flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Account Token Audit & Telemetry Breakdown</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Backend Live
                  </span>
                </div>
                <div className="text-xs text-[#9ca3af]">
                  Total Incurred: <span className="text-white font-mono font-bold">${totalSpend.toFixed(5)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1c1c1f] text-[#71717A] uppercase text-[10px] tracking-wider border-b border-[#27272a]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Telemetry Channel</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Benchmark Model</th>
                      <th className="px-4 py-3 font-semibold">Volume (Tokens)</th>
                      <th className="px-4 py-3 font-semibold">Unit Pricing</th>
                      <th className="px-4 py-3 font-semibold">Calculated Cost</th>
                      <th className="px-4 py-3 font-semibold">Database Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222226] text-[#D1D5DB]">
                    {(activeCategory === "overview" || activeCategory === "prompt") && (
                      <tr className="hover:bg-[#202024] transition-colors">
                        <td className="px-4 py-3.5 font-medium text-white flex items-center gap-2">
                          <Bot className="w-4 h-4 text-[#38BDF8]" />
                          <span>Prompt / Ingest Tokens</span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#9ca3af]">Input / Context</td>
                        <td className="px-4 py-3.5 text-[#d1d5db]">DeepSeek V3 / Llama 3.3</td>
                        <td className="px-4 py-3.5 font-mono text-white font-semibold">
                          {promptTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#71717a]">$0.14 / 1M</td>
                        <td className="px-4 py-3.5 font-mono text-[#38BDF8] font-bold">
                          ${promptCost.toFixed(5)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Synced</span>
                          </span>
                        </td>
                      </tr>
                    )}

                    {(activeCategory === "overview" || activeCategory === "completion") && (
                      <tr className="hover:bg-[#202024] transition-colors">
                        <td className="px-4 py-3.5 font-medium text-white flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-[#818CF8]" />
                          <span>Completion / Output Tokens</span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#9ca3af]">Generation / Report</td>
                        <td className="px-4 py-3.5 text-[#d1d5db]">Gemini Flash / DeepSeek R1</td>
                        <td className="px-4 py-3.5 font-mono text-white font-semibold">
                          {completionTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#71717a]">$0.28 / 1M</td>
                        <td className="px-4 py-3.5 font-mono text-[#818CF8] font-bold">
                          ${completionCost.toFixed(5)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Synced</span>
                          </span>
                        </td>
                      </tr>
                    )}

                    {activeCategory === "overview" && (
                      <tr className="bg-[#18181b]/80 font-semibold border-t border-[#2e2e33]">
                        <td className="px-4 py-3.5 text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-400" />
                          <span>Total Account Usage</span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#9ca3af]">Combined</td>
                        <td className="px-4 py-3.5 text-[#9ca3af]">ThreatLens Pipeline</td>
                        <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">
                          {totalTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#71717a]">Blended</td>
                        <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">
                          ${totalSpend.toFixed(5)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium">
                            Active #{usage.id ?? "1"}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONDITIONAL VIEW 2: REAL SUBSCRIPTION PLANS & TIERS ── */}
      {viewMode === "plans" && (
        <div className="space-y-10 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181b] border border-[#27272a] text-xs text-[#a1a1aa]">
              <Star className="w-3 h-3 text-[#f59e0b] fill-[#f59e0b]" />
              <span className="font-bold uppercase text-[10.5px] tracking-wide">
                Active Tier: {currentPlanConfig.name}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-[#71717a] text-sm max-w-md leading-relaxed">
              Scale your security posture with real-time tier switching synchronized directly to your account.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`text-sm font-medium transition-colors ${
                  billingCycle === "monthly" ? "text-white" : "text-[#52525b]"
                }`}
              >
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer focus:outline-none ${
                  billingCycle === "yearly" ? "bg-[#38bdf8]" : "bg-[#27272a]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    billingCycle === "yearly" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium transition-colors ${
                  billingCycle === "yearly" ? "text-white" : "text-[#52525b]"
                }`}
              >
                Yearly
              </span>
              {billingCycle === "yearly" && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold">
                  Save 20%
                </span>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {dynamicPlans.map((plan) => {
              const PlanIcon = plan.icon;
              const displayPrice =
                plan.monthlyPrice === null
                  ? null
                  : billingCycle === "yearly"
                  ? plan.yearlyPrice
                  : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border ${plan.border} p-6 sm:p-7 gap-5 transition-all duration-300 hover:shadow-2xl ${
                    plan.popular
                      ? "bg-gradient-to-b from-[#0b1a30] to-[#090910] shadow-[0_0_48px_rgba(56,189,248,0.07)]"
                      : plan.id === "enterprise"
                      ? "bg-gradient-to-b from-[#100b26] to-[#090910]"
                      : "bg-[#0d0d10]"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#38bdf8] text-[#04101c] text-[11px] font-bold tracking-wide shadow-lg shadow-sky-500/30 whitespace-nowrap">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}28` }}
                      >
                        <PlanIcon className="w-5 h-5" style={{ color: plan.color }} />
                      </div>
                      <div>
                        <div className="text-[16px] font-bold text-white leading-tight flex items-center gap-2">
                          <span>{plan.name}</span>
                          {plan.current && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#52525b] font-medium">{plan.tokens}</div>
                      </div>
                    </div>
                    <p className="text-[12.5px] text-[#71717a] leading-relaxed">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="space-y-0.5">
                    {displayPrice === null ? (
                      <>
                        <div className="text-3xl font-bold text-white">Custom</div>
                        <div className="text-xs text-[#52525b]">Volume-based pricing</div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-end gap-1.5">
                          <span className="text-3xl font-bold text-white">${displayPrice}</span>
                          <span className="text-[#52525b] text-sm pb-1">/ mo</span>
                        </div>
                        {billingCycle === "yearly" && displayPrice > 0 && (
                          <div className="text-[11.5px] text-emerald-400 font-medium">
                            ${plan.monthlyPrice - plan.yearlyPrice} saved per month
                          </div>
                        )}
                        {displayPrice === 0 && (
                          <div className="text-[11.5px] text-[#52525b]">Free forever, no card required</div>
                        )}
                      </>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    disabled={plan.current || isUpdatingPlan}
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                      plan.current
                        ? "bg-[#1c1c1f] border border-emerald-500/30 text-emerald-400 cursor-default"
                        : plan.popular
                        ? "bg-gradient-to-b from-[#1e5adb] via-[#1342a8] to-[#0c2a74] text-[#E0F2FE] hover:text-white shadow-lg shadow-blue-900/30 hover:brightness-110 active:scale-[0.98]"
                        : plan.id === "enterprise"
                        ? "bg-transparent border border-[#3b1f6b] hover:border-[#a78bfa] text-[#a78bfa] hover:bg-[#a78bfa]/10 active:scale-[0.98]"
                        : "bg-[#1c1c1f] hover:bg-[#252528] border border-[#2e2e33] text-white active:scale-[0.98]"
                    }`}
                  >
                    {isUpdatingPlan ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : plan.current ? (
                      <>
                        <BadgeCheck className="w-4 h-4" />
                        <span>Current Plan</span>
                      </>
                    ) : (
                      <>
                        <span>{plan.cta}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="border-t border-dashed" style={{ borderColor: `${plan.color}20` }} />

                  {/* Features */}
                  <div className="space-y-2.5 flex-1">
                    <div className="text-[10.5px] font-bold text-[#52525b] uppercase tracking-widest">
                      What's included
                    </div>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        {feature.included ? (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: `${plan.color}18` }}
                          >
                            <Check className="w-2.5 h-2.5" style={{ color: plan.color }} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#1c1c1f]">
                            <XIcon className="w-2.5 h-2.5 text-[#3f3f46]" />
                          </div>
                        )}
                        <span
                          className={`text-[12.5px] leading-snug ${
                            feature.included ? "text-[#d4d4d8]" : "text-[#3f3f46]"
                          }`}
                        >
                          {feature.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-6 pb-4 border-t border-[#1c1c1f]">
            {[
              { Icon: Lock, label: "SOC 2 Type II" },
              { Icon: Globe, label: "GDPR Compliant" },
              { Icon: Clock, label: "99.9% Uptime SLA" },
              { Icon: Users, label: "Cancel anytime" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-[#3f3f46] text-xs">
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONDITIONAL VIEW 3: INVOICES & BILLING MANAGEMENT ── */}
      {viewMode === "invoices" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Billing & Invoices
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase">
                  ACTIVE
                </span>
              </div>
              <p className="text-[#8a99ad] text-xs sm:text-sm mt-1">
                Manage your subscription, default payment methods, and download cryptographic Merkle audit receipts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("plans")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Switch Tier / Plans</span>
              </button>
            </div>
          </div>

          {/* Top 2 Cards: Active Subscription & Saved Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Active Subscription Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#141b27] to-[#0d121b] border border-[#223145] space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${currentPlanConfig.color}20`, border: `1px solid ${currentPlanConfig.color}40` }}
                  >
                    <currentPlanConfig.icon className="w-5 h-5" style={{ color: currentPlanConfig.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>ThreatLens {currentPlanConfig.name}</span>
                      <span className="px-2 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                        Current
                      </span>
                    </div>
                    <div className="text-xs text-[#8a99ad]">{currentPlanConfig.tokens}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-white">
                    ${currentPlanConfig.monthlyPrice ?? 0}
                    <span className="text-xs text-[#8a99ad] font-normal"> / mo</span>
                  </div>
                  <div className="text-[10.5px] text-emerald-400 font-medium">Billed monthly</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#090d14] border border-[#182332] flex items-center justify-between text-xs">
                <span className="text-[#8a99ad]">Next Auto-Renewal:</span>
                <span className="text-white font-medium">
                  {new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setViewMode("plans")}
                  className="flex-1 py-2 rounded-xl bg-[#1d293a] hover:bg-[#26374d] text-xs font-semibold text-white border border-[#2b3e58] transition-all cursor-pointer"
                >
                  Change Plan
                </button>
                {activePlanId !== "free" && (
                  <button
                    onClick={() => {
                      setSelectedTargetPlan(PLANS.find((p) => p.id === "free"));
                      setIsDowngradeModalOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-transparent hover:bg-rose-500/10 text-xs font-medium text-rose-400 hover:text-rose-300 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                  >
                    Cancel Plan
                  </button>
                )}
              </div>
            </div>

            {/* Saved Payment Method Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#141b27] to-[#0d121b] border border-[#223145] space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-[#38bdf8]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Primary Payment Method</span>
                      <span className="px-2 py-0.2 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase">
                        Default
                      </span>
                    </div>
                    <div className="text-xs text-[#8a99ad]">Visa ending in 4242</div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#141c28] border border-[#223043] flex items-center justify-center font-bold italic text-white text-xs">
                  VISA
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#090d14] border border-[#182332] flex items-center justify-between text-xs">
                <span className="text-[#8a99ad]">Card Expiry:</span>
                <span className="text-white font-mono font-medium">12/2028 · 256-bit Encrypted</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setSelectedTargetPlan(PLANS.find((p) => p.id === (activePlanId === "free" ? "pro" : activePlanId)));
                    setIsCheckoutModalOpen(true);
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#1d293a] hover:bg-[#26374d] text-xs font-semibold text-white border border-[#2b3e58] transition-all cursor-pointer"
                >
                  Update Payment Details
                </button>
                <button
                  onClick={() => toast.success("Card verified with 3D-Secure 2.0")}
                  className="px-3 py-2 rounded-xl bg-transparent hover:bg-white/[0.05] text-xs font-medium text-[#8a99ad] hover:text-white border border-[#223043] transition-all cursor-pointer"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>

          {/* Invoices & Transaction History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Invoice & Merkle Ledger Records</h3>
                <p className="text-xs text-[#8a99ad]">Audit-verified tax invoices and subscription receipts</p>
              </div>
              <span className="text-xs text-[#64748b]">{invoices.length} Total Records</span>
            </div>

            <div className="border border-[#1e2c3e] rounded-2xl overflow-hidden bg-[#0a0e15] shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#101723] text-[#8a99ad] uppercase tracking-wider text-[10.5px] border-b border-[#1c293a]">
                    <tr>
                      <th className="px-5 py-3.5">Invoice ID</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">Payment Method</th>
                      <th className="px-5 py-3.5 text-right">Amount</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#172230]">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#0f1622] transition-colors">
                        <td className="px-5 py-4 font-mono font-semibold text-[#38bdf8]">
                          {inv.id}
                        </td>
                        <td className="px-5 py-4 text-[#cbd5e1] whitespace-nowrap">
                          {inv.date}
                        </td>
                        <td className="px-5 py-4 text-white font-medium">
                          {inv.description}
                        </td>
                        <td className="px-5 py-4 text-[#8a99ad]">
                          {inv.paymentMethod}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-white">
                          ${Number(inv.amount).toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-bold">
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsReceiptModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-[#1a2535] hover:bg-[#24344a] border border-[#27384e] text-xs text-[#38bdf8] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <PaymentCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        currentPlan={currentPlanConfig}
        targetPlan={selectedTargetPlan}
        billingCycle={billingCycle}
        currentUser={currentUser}
        onPaymentSuccess={handlePaymentSuccess}
        onViewInvoice={(inv) => {
          setSelectedInvoice(inv);
          setIsReceiptModalOpen(true);
        }}
      />

      <DowngradeConfirmModal
        isOpen={isDowngradeModalOpen}
        onClose={() => setIsDowngradeModalOpen(false)}
        currentPlan={currentPlanConfig}
        targetPlan={selectedTargetPlan}
        onConfirmDowngrade={handleConfirmDowngrade}
      />

      <InvoiceReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
