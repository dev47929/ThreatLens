import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { HeartPulse, CheckCircle2 } from "lucide-react";

export default function RequestHealthChart({ attack }) {
  if (!attack) return null;

  const { timeline, final, execution } = attack;

  // Peak active requests
  const peakActive = useMemo(() => {
    if (!timeline || !timeline.length) return 0;
    return timeline.reduce((max, pt) => (pt.active > max ? pt.active : max), 0);
  }, [timeline]);

  // Custom hover tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-[#0b1017]/95 border border-[#23354d] shadow-[0_8px_30px_rgba(0,0,0,0.8)] rounded-xl p-3.5 text-xs select-none backdrop-blur-md min-w-[210px] space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#1b2636]">
          <span className="text-[11px] font-mono text-[#8a99ad]">Elapsed Time:</span>
          <span className="font-mono font-bold text-white text-xs">{data.time.toFixed(2)}s</span>
        </div>

        <div className="space-y-1.5 font-mono text-[11.5px]">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Success Rate:
            </span>
            <span className="font-bold">{data.successRate}%</span>
          </div>

          <div className="flex items-center justify-between text-[#0284c7]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
              Active In-Flight:
            </span>
            <span className="font-bold">{data.active.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-[#f97316]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f97316]" />
              Failed / Denied:
            </span>
            <span className="font-bold">{data.failed.toLocaleString()}</span>
          </div>

          {data.timeouts > 0 && (
            <div className="flex items-center justify-between text-[#16a34a]">
              <span>Timeouts:</span>
              <span>{data.timeouts.toLocaleString()}</span>
            </div>
          )}

          {data.retried > 0 && (
            <div className="flex items-center justify-between text-[#dc2626]">
              <span>Retries:</span>
              <span>{data.retried.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#101724]/90 backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
      {/* Chart Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-[#1b2838]">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-[#38bdf8]" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Request Health — Success & Request State
            </h2>
          </div>
          <p className="text-[11.5px] text-[#8a99ad] mt-0.5">
            Correlates success percentage (left axis) with active and problematic request counts (right axis)
          </p>
        </div>

        {/* Status context badge matching 04_request_health.png */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-2.5 py-1 rounded-lg bg-[#0c131d] border border-[#23354b] text-[11px] font-mono text-[#8a99ad] shadow-sm">
            <span className="text-white font-bold">{(execution.status || "COMPLETED").toUpperCase()}</span> · Failed{" "}
            <span className="text-white font-bold">{final.failed}</span> · Timeouts{" "}
            <span className="text-white font-bold">{final.timeouts}</span> · Retries{" "}
            <span className="text-white font-bold">{final.retried}</span> · Peak active{" "}
            <span className="text-[#38bdf8] font-bold">{peakActive}</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300 shadow-sm">
            Final <strong className="text-white">{execution.successRate}%</strong> (
            {final.successful.toLocaleString()} / {execution.attempted.toLocaleString()} attempted)
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-white text-[11.5px]">Success rate (%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
          <span className="text-[#8a99ad] text-[11.5px]">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
          <span className="text-[#8a99ad] text-[11.5px]">Failed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]" />
          <span className="text-[#8a99ad] text-[11.5px]">Timeouts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
          <span className="text-[#8a99ad] text-[11.5px]">Retried</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 pt-1">
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

            {/* Left Axis: Success Rate (%) */}
            <YAxis
              yAxisId="left"
              stroke="#10b981"
              fontSize={11}
              domain={[0, 105]}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />

            {/* Right Axis: Request Counts */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              fontSize={11}
              domain={[0, (dataMax) => Math.max(10, Math.ceil(dataMax * 1.15))]}
              tickLine={false}
              tickFormatter={(v) => Number(v).toFixed(0)}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Success rate curve (Left Axis) */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="successRate"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, fill: "#10b981", stroke: "#0f172a", strokeWidth: 1.5 }}
              activeDot={{ r: 6.5, fill: "#34d399", stroke: "#ffffff", strokeWidth: 2 }}
            />

            {/* Active count curve (Right Axis) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="active"
              stroke="#0284c7"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0284c7", stroke: "#0f172a", strokeWidth: 1 }}
              activeDot={{ r: 5, fill: "#38bdf8", stroke: "#ffffff", strokeWidth: 1.5 }}
            />

            {/* Failed count curve (Right Axis) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="failed"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3, fill: "#f97316", stroke: "#0f172a", strokeWidth: 1 }}
              activeDot={{ r: 5, fill: "#fb923c", stroke: "#ffffff", strokeWidth: 1.5 }}
            />

            {/* Timeouts count curve (Right Axis) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="timeouts"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 3, fill: "#16a34a", stroke: "#0f172a", strokeWidth: 1 }}
              activeDot={{ r: 5, fill: "#4ade80", stroke: "#ffffff", strokeWidth: 1.5 }}
            />

            {/* Retried count curve (Right Axis) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="retried"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 3, fill: "#dc2626", stroke: "#0f172a", strokeWidth: 1 }}
              activeDot={{ r: 5, fill: "#f87171", stroke: "#ffffff", strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
