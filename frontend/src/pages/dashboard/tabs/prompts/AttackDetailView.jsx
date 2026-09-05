import React, { useMemo } from "react";
import GradientWaves from "@/animations/GradientWaves";
import { normalizeAttackForGraphs } from "@/lib/attackTelemetryData";
import AttackTrafficChart from "./components/AttackTrafficChart";
import RequestRateChart from "./components/RequestRateChart";
import LatencyProfileChart from "./components/LatencyProfileChart";
import RequestHealthChart from "./components/RequestHealthChart";
import AttackConfigPanels from "./components/AttackConfigPanels";

export default function AttackDetailView({ attack, onBack }) {
  // Normalize the input attack object
  const normalizedAttack = useMemo(() => {
    return normalizeAttackForGraphs(attack);
  }, [attack]);

  const attackName =
    attack?.name ||
    normalizedAttack?.identity?.name ||
    attack?.category ||
    "";

  if (!normalizedAttack) {
    return (
      <div className="p-10 text-center text-xs text-[#8a99ad]">
        No attack record selected.
        <button
          onClick={onBack}
          className="ml-2 text-[#38bdf8] hover:underline cursor-pointer"
        >
          Return to Attack history
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col pb-24">
      {/* Background Gradient Waves Animation */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30 overflow-hidden">
        <GradientWaves
          horizonColor="#010114"
          waveColor="#6f6e9d"
          crestColor="#292596"
          speed={0.3}
          amplitude={2.0}
          waveScale={0.6}
          waveRatio={0.9}
          swell={30}
          turbulence={18}
          tilt={1.11}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 p-6 lg:p-10 space-y-6 max-w-[1700px] w-full mx-auto">
        {/* Attack Detail heading in dark blue bold font, followed by attack name */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FFFFFF]">
            Attack Details {attackName ? `— ${attackName}` : ""}
          </h1>
        </div>

        {/* 2. Attack Traffic & Request Rate (2-Column Grid) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Graph 1: Attack Traffic — Request Progress */}
          <AttackTrafficChart attack={normalizedAttack} />

          {/* Graph 2: Request Rate — Attack Intensity */}
          <RequestRateChart attack={normalizedAttack} />
        </div>

        {/* 3. Full-width Latency Profile (Minimal Area Graph on Left, Plain English Details on Right) */}
        <div className="w-full">
          <LatencyProfileChart attack={normalizedAttack} />
        </div>

        {/* 4. Full-width Request Health (Dual-Blue Stacked Bar Graph on Left, Plain English Details on Right) */}
        <div className="w-full">
          <RequestHealthChart attack={normalizedAttack} />
        </div>

        {/* 4. Metadata, Defense Interception & Raw JSON Telemetry */}
        <AttackConfigPanels attack={normalizedAttack} />
      </div>
    </div>
  );
}
