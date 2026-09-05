import React, { useMemo } from "react";
import GradientWaves from "@/animations/GradientWaves";
import { normalizeAttackForGraphs } from "@/lib/attackTelemetryData";
import AttackDetailHeader from "./components/AttackDetailHeader";
import AttackKpiCards from "./components/AttackKpiCards";
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
        {/* 1. Attack Identity Header Banner */}
        <AttackDetailHeader attack={normalizedAttack} onBack={onBack} />

        {/* 2. 7 Aggregate Performance KPI Cards */}
        <AttackKpiCards attack={normalizedAttack} />

        {/* 3. The 4 Standard Telemetry Visualizations (2x2 Grid) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Graph 1: Attack Traffic — Request Progress */}
          <AttackTrafficChart attack={normalizedAttack} />

          {/* Graph 2: Request Rate — Attack Intensity */}
          <RequestRateChart attack={normalizedAttack} />

          {/* Graph 3: Latency Profile — Response Performance */}
          <LatencyProfileChart attack={normalizedAttack} />

          {/* Graph 4: Request Health — Success & Request State */}
          <RequestHealthChart attack={normalizedAttack} />
        </div>

        {/* 4. Metadata, Defense Interception & Raw JSON Telemetry */}
        <AttackConfigPanels attack={normalizedAttack} />
      </div>
    </div>
  );
}
