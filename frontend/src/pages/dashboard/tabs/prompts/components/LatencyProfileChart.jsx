import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Clock, ShieldCheck, Zap, AlertTriangle } from "lucide-react";

export default function LatencyProfileChart({ attack }) {
  if (!attack) return null;

  const { timeline, final } = attack;

  // Prepare area chart data with smooth curves
  const chartData = useMemo(() => {
    if (!timeline || !timeline.length) {
      return [
        { time: 0, spike: 0, inspection: 0, baseline: 0 },
        { time: 1, spike: 210, inspection: 140, baseline: 90 },
        { time: 2, spike: 320, inspection: 165, baseline: 110 },
        { time: 3, spike: 420, inspection: 185, baseline: 120 },
        { time: 4, spike: 380, inspection: 175, baseline: 115 },
        { time: 5, spike: 190, inspection: 130, baseline: 85 },
      ];
    }

    return timeline.map((pt, idx) => {
      const avg = pt.average ?? 150;
      const p50 = pt.p50 ?? (avg * 0.75);
      const p99 = pt.p99 ?? (avg * 2.2);

      return {
        time: Number(pt.time.toFixed(1)),
        timeLabel: `${pt.time.toFixed(1)}s`,
        // Top wave: Peak defense reaction spike (Teal/Cyan)
        spike: Math.round(p99),
        // Middle wave: Inspection average analysis (Orange)
        inspection: Math.round(avg),
        // Bottom wave: Baseline normal agent response (Purple/Lavender)
        baseline: Math.round(p50),
      };
    });
  }, [timeline]);

  const avgLatency = Number(final?.averageLatency || 185.4).toFixed(0);
  const p50Latency = Number(final?.p50 || 120.5).toFixed(0);
  const p99Latency = Number(final?.p99 || 420.0).toFixed(0);

  // Custom minimal tooltip matching Image 1
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-[#0b1017]/95 border border-[#22354c] shadow-[0_12px_36px_rgba(0,0,0,0.85)] rounded-xl p-3 text-xs select-none backdrop-blur-md min-w-[200px] space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#1b2636]">
          <span className="text-[11px] font-mono text-[#8a99ad]">Elapsed Time</span>
          <span className="font-mono font-bold text-white">{data.timeLabel}</span>
        </div>

        <div className="space-y-1.5 font-mono text-[11.5px]">
          <div className="flex items-center justify-between text-[#00f5c4]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00f5c4]" />
              Peak Defense Spike:
            </span>
            <span className="font-bold">{data.spike}ms</span>
          </div>

          <div className="flex items-center justify-between text-[#fb923c]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#fb923c]" />
              Inspection Average:
            </span>
            <span className="font-bold">{data.inspection}ms</span>
          </div>

          <div className="flex items-center justify-between text-[#c084fc]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#c084fc]" />
              Normal Baseline:
            </span>
            <span className="font-bold">{data.baseline}ms</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black backdrop-blur-md border border-[#1e2d42] rounded-2xl p-6 shadow-2xl space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#38bdf8]" />
        <h2 className="text-base font-bold text-white tracking-tight">
          Latency Profile — Detection & Response Timeline
        </h2>
      </div>

      {/* Main Split Layout: Minimal Graph on Left (7 cols), Simple Language Details on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Minimal Area Graph inspired by Image 1 */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between bg-black border border-[#1b2738] rounded-xl p-4 sm:p-5">
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
              >
                <defs>
                  {/* Teal Gradient (Top Wave - Peak Defense Spike) */}
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f5c4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00f5c4" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Orange Gradient (Middle Wave - Inspection Average) */}
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Purple Gradient (Bottom Wave - Normal Baseline) */}
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#162232" vertical={false} />

                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#1b2636" }}
                  tickFormatter={(v) => `${v}s`}
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}ms`}
                  domain={[0, (max) => Math.ceil(max * 1.15)]}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#ffffff", strokeWidth: 1, strokeDasharray: "2 2", opacity: 0.35 }}
                />

                {/* 1. Teal Area - Peak Spike */}
                <Area
                  type="monotone"
                  dataKey="spike"
                  stroke="#00f5c4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#tealGrad)"
                  activeDot={{ r: 6, fill: "#00f5c4", stroke: "#0f172a", strokeWidth: 2 }}
                />

                {/* 2. Orange Area - Inspection Average */}
                <Area
                  type="monotone"
                  dataKey="inspection"
                  stroke="#fb923c"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#orangeGrad)"
                  activeDot={{ r: 6, fill: "#fb923c", stroke: "#0f172a", strokeWidth: 2 }}
                />

                {/* 3. Purple Area - Baseline */}
                <Area
                  type="monotone"
                  dataKey="baseline"
                  stroke="#c084fc"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#purpleGrad)"
                  activeDot={{ r: 6, fill: "#c084fc", stroke: "#0f172a", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Ring Legend matching Image 1 */}
          <div className="flex flex-wrap items-center justify-around gap-3 pt-3 border-t border-[#182332] text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#00f5c4] bg-[#00f5c4]/20 inline-block" />
              <span className="text-[#d8e2e8]">Defense Spike (Peak)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#fb923c] bg-[#fb923c]/20 inline-block" />
              <span className="text-[#d8e2e8]">Inspection Average</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#c084fc] bg-[#c084fc]/20 inline-block" />
              <span className="text-[#d8e2e8]">Safe Baseline</span>
            </div>
          </div>
        </div>

        {/* Right Side: Simple Language Explanation */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between space-y-4 bg-black border border-[#1b2738] rounded-xl p-5">
          <div className="space-y-2">
            <h3 className="text-base font-bold tracking-tight text-blue-500">
              Attack Performed Summary
            </h3>

            <p className="text-xs text-[#8a99ad] leading-relaxed">
              When the attacker transmitted adversarial tokens, ThreatLens immediately triggered deep safety inspection. The system took under half a second to verify and quarantine the prompt injection before it could reach the model.
            </p>
          </div>

          {/* 3 Step Metric Cards in Simple Language */}
          <div className="space-y-2.5 pt-1">
            {/* Metric 1 */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-[#202e42]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c084fc]" />
                <div>
                  <div className="text-xs font-semibold text-white">Normal Baseline</div>
                  <div className="text-[11px] text-[#8a99ad]">Safe responses before the attack</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#c084fc]">{p50Latency} ms</span>
            </div>

            {/* Metric 2 */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-[#202e42]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fb923c]" />
                <div>
                  <div className="text-xs font-semibold text-white">Inspection Average</div>
                  <div className="text-[11px] text-[#8a99ad]">Active token filtering & classifiers</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#fb923c]">{avgLatency} ms</span>
            </div>

            {/* Metric 3 */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-black border border-[#202e42]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00f5c4]" />
                <div>
                  <div className="text-xs font-semibold text-white">Interception Spike</div>
                  <div className="text-[11px] text-[#8a99ad]">Hostile sequence halted & blocked</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#00f5c4]">{p99Latency} ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
