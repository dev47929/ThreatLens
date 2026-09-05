import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { Clock, Eye, EyeOff } from "lucide-react";

export default function LatencyProfileChart({ attack }) {
  if (!attack) return null;

  const { timeline, final } = attack;

  // Series visibility toggles
  const [visibleSeries, setVisibleSeries] = useState({
    average: true,
    p50: true,
    p95: true,
    p99: true,
  });

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Find Peak P99 point
  const peakP99Point = useMemo(() => {
    if (!timeline || !timeline.length) return null;
    return timeline.reduce((max, pt) => {
      const p99Val = pt.p99 ?? pt.latency?.p99 ?? 0;
      const maxVal = max?.p99 ?? 0;
      return p99Val > maxVal ? { p99: p99Val, time: pt.time } : max;
    }, { p99: 0, time: 0 });
  }, [timeline]);

  const formatMs = (ms) => {
    if (ms == null) return "N/A";
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s (${ms.toFixed(0)}ms)`;
    return `${ms.toFixed(1)}ms`;
  };

  // Custom hover tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-[#0b1017]/95 border border-[#23354d] shadow-[0_8px_30px_rgba(0,0,0,0.8)] rounded-xl p-3.5 text-xs select-none backdrop-blur-md min-w-[220px] space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#1b2636]">
          <span className="text-[11px] font-mono text-[#8a99ad]">Elapsed Time:</span>
          <span className="font-mono font-bold text-white text-xs">{data.time.toFixed(2)}s</span>
        </div>

        <div className="space-y-1.5 font-mono text-[11.5px]">
          {visibleSeries.average && (
            <div className="flex items-center justify-between text-[#0284c7]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
                Average:
              </span>
              <span className="font-bold">{formatMs(data.average)}</span>
            </div>
          )}

          {visibleSeries.p50 && (
            <div className="flex items-center justify-between text-[#f97316]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f97316]" />
                P50 (Median):
              </span>
              <span className="font-bold">{formatMs(data.p50)}</span>
            </div>
          )}

          {visibleSeries.p95 && (
            <div className="flex items-center justify-between text-[#16a34a]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                P95 (Degradation):
              </span>
              <span className="font-bold">{formatMs(data.p95)}</span>
            </div>
          )}

          {visibleSeries.p99 && (
            <div className="flex items-center justify-between text-[#dc2626]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                P99 (Tail Latency):
              </span>
              <span className="font-bold">{formatMs(data.p99)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const seriesMeta = [
    { key: "average", label: "Average", color: "#0284c7" },
    { key: "p50", label: "P50", color: "#f97316" },
    { key: "p95", label: "P95", color: "#16a34a" },
    { key: "p99", label: "P99", color: "#dc2626" },
  ];

  return (
    <div className="bg-[#101724]/90 backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
      {/* Chart Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-[#1b2838]">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#38bdf8]" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Latency Profile — Response Performance
            </h2>
          </div>
          <p className="text-[11.5px] text-[#8a99ad] mt-0.5">
            Evaluates server responsiveness across percentiles (Average, P50, P95, P99 in milliseconds)
          </p>
        </div>

        {/* Legend & Summary Badge matching 03_latency_profile.png */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Interactive Legend series toggles */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {seriesMeta.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] transition-colors cursor-pointer select-none ${
                  visibleSeries[s.key]
                    ? "bg-[#131e2d] border-[#293d56] text-white"
                    : "bg-[#0b1017] border-[#1b2636] text-[#5b6e82] opacity-60"
                }`}
                title={`Click to ${visibleSeries[s.key] ? "hide" : "show"} ${s.label}`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: visibleSeries[s.key] ? s.color : "#475569" }}
                />
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Final Latency Summary Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-[#0c131d] border border-[#23354b] text-[11px] font-mono text-[#8a99ad] shadow-sm">
            Final · Avg <span className="text-white font-bold">{Number(final.averageLatency).toFixed(1)}ms</span> · P50{" "}
            <span className="text-white font-bold">{Number(final.p50).toFixed(1)}ms</span> · P95{" "}
            <span className="text-white font-bold">{Number(final.p95).toFixed(1)}ms</span> · P99{" "}
            <span className="text-rose-400 font-bold">{Number(final.p99).toFixed(1)}ms</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeline} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2838" vertical={true} />

            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${Number(v).toFixed(1)}s`}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`)}
              domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Peak P99 Marker Callout matching 03_latency_profile.png */}
            {peakP99Point && peakP99Point.p99 > 0 && visibleSeries.p99 && (
              <ReferenceDot
                x={peakP99Point.time}
                y={peakP99Point.p99}
                r={5.5}
                fill="#16a34a"
                stroke="#ffffff"
                strokeWidth={2}
                label={{
                  value: `Peak P99 ${Number(peakP99Point.p99).toFixed(0)} ms`,
                  position: "top",
                  fill: "#16a34a",
                  fontSize: 10.5,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              />
            )}

            {/* Average Line */}
            {visibleSeries.average && (
              <Line
                type="monotone"
                dataKey="average"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#0284c7", stroke: "#0f172a", strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: "#38bdf8", stroke: "#ffffff", strokeWidth: 2 }}
              />
            )}

            {/* P50 Line */}
            {visibleSeries.p50 && (
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#f97316", stroke: "#0f172a", strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: "#fb923c", stroke: "#ffffff", strokeWidth: 2 }}
              />
            )}

            {/* P95 Line */}
            {visibleSeries.p95 && (
              <Line
                type="monotone"
                dataKey="p95"
                stroke="#16a34a"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#16a34a", stroke: "#0f172a", strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: "#4ade80", stroke: "#ffffff", strokeWidth: 2 }}
              />
            )}

            {/* P99 Line */}
            {visibleSeries.p99 && (
              <Line
                type="monotone"
                dataKey="p99"
                stroke="#dc2626"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#dc2626", stroke: "#0f172a", strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: "#f87171", stroke: "#ffffff", strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
