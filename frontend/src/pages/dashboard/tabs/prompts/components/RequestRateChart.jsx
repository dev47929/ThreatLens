import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { Zap, Flame, TrendingUp } from "lucide-react";

export default function RequestRateChart({ attack }) {
  if (!attack) return null;

  const { timeline, config, identity } = attack;

  // Calculate Peak RPS point
  const peakPoint =
    timeline && timeline.length > 0
      ? timeline.reduce(
          (max, point) => (point.rps > (max?.rps || 0) ? point : max),
          timeline[0]
        )
      : { rps: 0, time: 0 };

  const finalPoint =
    timeline && timeline.length > 0 ? timeline[timeline.length - 1] : { rps: 0 };

  // Custom hover tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    const isPeak = data.time === peakPoint?.time;

    return (
      <div className="bg-[#0b1017]/95 border border-[#23354d] shadow-[0_8px_30px_rgba(0,0,0,0.8)] rounded-xl p-3.5 text-xs select-none backdrop-blur-md min-w-[190px] space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#1b2636]">
          <span className="text-[11px] font-mono text-[#8a99ad]">Elapsed Time:</span>
          <span className="font-mono font-bold text-white text-xs">{data.time.toFixed(2)}s</span>
        </div>

        <div className="space-y-1 font-mono text-[11.5px]">
          <div className="flex items-center justify-between text-[#38bdf8]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
              Observed RPS:
            </span>
            <span className="font-bold text-white">{Number(data.rps).toFixed(1)} req/s</span>
          </div>

          <div className="flex items-center justify-between text-[#94a3b8] text-[11px]">
            <span>Active Volume:</span>
            <span>{data.active.toLocaleString()}</span>
          </div>
        </div>

        {isPeak && (
          <div className="pt-1.5 border-t border-[#1b2636] flex items-center gap-1 text-[11px] font-mono text-amber-400">
            <Flame className="w-3.5 h-3.5" />
            <span className="font-bold">Peak Attack Intensity</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#101724]/90 backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
      {/* Chart Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-2 border-b border-[#1b2838]">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#38bdf8]" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Request Rate — Attack Intensity
            </h2>
          </div>
          <p className="text-[11.5px] text-[#8a99ad] mt-0.5">
            Monitors rate of request flooding generation over time (Requests / Second)
          </p>
        </div>

        {/* Badges: Config parameters and Peak Marker matching 02_request_rate.png */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-2.5 py-1 rounded-lg bg-[#0c131d] border border-[#23354b] text-[11px] font-mono text-[#8a99ad] shadow-sm">
            <span className="text-white font-bold">{identity.type}</span> · concurrency{" "}
            <span className="text-[#38bdf8] font-bold">{config.concurrency}</span> · delay{" "}
            <span className="text-white font-bold">{config.delay}s</span> · timeout{" "}
            <span className="text-white font-bold">{config.timeout}s</span> · retries{" "}
            <span className="text-white font-bold">{config.retries}</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 to-rose-500/15 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Peak <strong className="text-white">{Number(peakPoint?.rps || 0).toFixed(1)} RPS</strong> @{" "}
              {Number(peakPoint?.time || 0).toFixed(2)}s
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="rpsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

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
              tickFormatter={(v) => Number(v).toFixed(0)}
              domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Peak RPS Dot Marker */}
            {peakPoint && peakPoint.rps > 0 && (
              <ReferenceDot
                x={peakPoint.time}
                y={peakPoint.rps}
                r={5.5}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={2}
                label={{
                  value: `Peak ${Number(peakPoint.rps).toFixed(1)} RPS`,
                  position: "top",
                  fill: "#f59e0b",
                  fontSize: 10.5,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              />
            )}

            {/* Observed RPS Curve */}
            <Area
              type="monotone"
              dataKey="rps"
              stroke="#0284c7"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#rpsGradient)"
              dot={{ r: 3.5, fill: "#0284c7", stroke: "#0f172a", strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: "#38bdf8", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
