import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Activity, Info } from "lucide-react";

export default function AttackTrafficChart({ attack }) {
  if (!attack) return null;

  const { timeline, config, final, identity } = attack;
  const plannedRequests = config.plannedRequests || 1000;

  // Custom hover tooltip for exact snapshot
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    const completion =
      plannedRequests > 0
        ? ((data.attempted / plannedRequests) * 100).toFixed(1)
        : "0.0";

    return (
      <div className="bg-[#0b1017]/95 border border-[#23354d] shadow-[0_8px_30px_rgba(0,0,0,0.8)] rounded-xl p-3.5 text-xs select-none backdrop-blur-md min-w-[210px] space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#1b2636]">
          <span className="text-[11px] font-mono text-[#8a99ad]">Elapsed Time:</span>
          <span className="font-mono font-bold text-white text-xs">{data.time.toFixed(2)}s</span>
        </div>

        <div className="space-y-1 font-mono text-[11.5px]">
          <div className="flex items-center justify-between text-[#38bdf8]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
              Attempted:
            </span>
            <span className="font-bold">{data.attempted.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-[#f97316]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f97316]" />
              Successful:
            </span>
            <span className="font-bold">{data.successful.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-[#94a3b8]">
            <span>Active:</span>
            <span>{data.active.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-rose-400">
            <span>Failed / Dropped:</span>
            <span>{data.failed.toLocaleString()}</span>
          </div>

          {data.timeouts > 0 && (
            <div className="flex items-center justify-between text-amber-400">
              <span>Timeouts:</span>
              <span>{data.timeouts}</span>
            </div>
          )}
        </div>

        <div className="pt-1.5 border-t border-[#1b2636] flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#8a99ad]">Planned Progress:</span>
          <span className="text-emerald-400 font-bold">{completion}%</span>
        </div>
      </div>
    );
  };

  const finalCompletion =
    plannedRequests > 0
      ? ((final.successful / plannedRequests) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="bg-black backdrop-blur-md border border-[#1e2d42] rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
      {/* Chart Header */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-[#38bdf8]" />
        <h2 className="text-sm font-bold text-white tracking-wide">
          Attack Traffic — Request Progress
        </h2>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="attemptedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
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
              domain={[0, (dataMax) => Math.max(dataMax, plannedRequests) * 1.05]}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Planned Requests Reference Line */}
            <ReferenceLine
              y={plannedRequests}
              stroke="#38bdf8"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Planned · ${plannedRequests.toLocaleString()}`,
                position: "insideTopLeft",
                fill: "#38bdf8",
                fontSize: 10.5,
                fontFamily: "monospace",
              }}
            />

            {/* Attempted Area & Curve */}
            <Area
              type="monotone"
              dataKey="attempted"
              stroke="#0284c7"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#attemptedGradient)"
              dot={{ r: 3.5, fill: "#0284c7", stroke: "#0f172a", strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: "#38bdf8", stroke: "#ffffff", strokeWidth: 2 }}
            />

            {/* Successful Curve */}
            <Line
              type="monotone"
              dataKey="successful"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#f97316", stroke: "#0f172a", strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: "#fb923c", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats below the graph */}
      <div className="flex flex-wrap items-center gap-10 pt-3">
        <div>
          <div className="text-xs text-[#8a99ad]">Successful requests</div>
          <div className="text-xl font-bold text-white mt-1">
            {final.successful.toLocaleString()}
          </div>
          <div className="text-xs text-white mt-0.5">Requests</div>
        </div>

        <div>
          <div className="text-xs text-[#8a99ad]">Success rate</div>
          <div className="text-xl font-bold text-white mt-1">
            {finalCompletion}%
          </div>
          <div className="text-xs text-white mt-0.5">Completed</div>
        </div>

        <div>
          <div className="text-xs text-[#8a99ad]">Planned requests</div>
          <div className="text-xl font-bold text-white mt-1">
            {plannedRequests.toLocaleString()}
          </div>
          <div className="text-xs text-white mt-0.5">Requests</div>
        </div>
      </div>
    </div>
  );
}
