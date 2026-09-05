import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Zap,
  Gauge,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";

export default function AttackKpiCards({ attack }) {
  if (!attack) return null;

  const { execution, config, final } = attack;

  // Format milliseconds into human readable seconds if > 1000ms
  const formatMs = (ms) => {
    if (ms == null) return "N/A";
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms.toFixed(1)}ms`;
  };

  const isBlocked = execution.status === "blocked";

  const cards = [
    {
      id: "status",
      label: "STATUS",
      value: (execution.status || "COMPLETED").toUpperCase(),
      sub: isBlocked ? "Guardrail Enforced" : "Execution Finished",
      accent: isBlocked ? "#f43f5e" : "#10b981",
      icon: isBlocked ? ShieldAlert : ShieldCheck,
    },
    {
      id: "requests",
      label: "REQUESTS",
      value: `${final.successful.toLocaleString()} / ${config.plannedRequests.toLocaleString()}`,
      sub: `${final.successful.toLocaleString()} successful`,
      accent: "#38bdf8",
      icon: Activity,
    },
    {
      id: "success_rate",
      label: "SUCCESS RATE",
      value: `${execution.successRate}%`,
      sub: isBlocked ? "100% Adversarial Denied" : `${(100 - execution.successRate).toFixed(1)}% dropped`,
      accent: isBlocked ? "#f43f5e" : execution.successRate >= 95 ? "#10b981" : "#f59e0b",
      icon: isBlocked ? XCircle : CheckCircle2,
    },
    {
      id: "rps",
      label: "PEAK / FINAL RPS",
      value: `${Number(final.rps).toFixed(1)}`,
      sub: "requests / second",
      accent: "#60a5fa",
      icon: TrendingUp,
    },
    {
      id: "avg_latency",
      label: "AVG LATENCY",
      value: formatMs(final.averageLatency),
      sub: `P50: ${formatMs(final.p50)}`,
      accent: "#a78bfa",
      icon: Gauge,
    },
    {
      id: "p99_latency",
      label: "P99 LATENCY",
      value: formatMs(final.p99),
      sub: `P95: ${formatMs(final.p95)}`,
      accent: "#f43f5e",
      icon: Zap,
    },
    {
      id: "elapsed",
      label: "ELAPSED TIME",
      value: `${Number(execution.elapsedSeconds).toFixed(2)}s`,
      sub: `Planned: ${config.duration}s`,
      accent: "#38bdf8",
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-[#101724]/90 backdrop-blur-md border border-[#1e2d42] hover:border-[#2f435e] rounded-xl p-4 relative overflow-hidden shadow-lg transition-all group"
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: card.accent }}
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#8a99ad]">
                {card.label}
              </span>
              <Icon
                className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ color: card.accent }}
              />
            </div>

            <div
              className="text-lg lg:text-xl font-bold font-mono tracking-tight mt-1 truncate"
              style={{ color: card.id === "status" ? card.accent : "#ffffff" }}
              title={card.value}
            >
              {card.value}
            </div>

            <div className="text-[10.5px] text-[#8a99ad] mt-0.5 truncate font-mono">
              {card.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
