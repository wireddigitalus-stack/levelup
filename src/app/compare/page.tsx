"use client";

import { useState } from "react";
import { ArrowRightLeft, Trophy, Activity, Target, Crosshair, TrendingDown } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function ComparePage() {
  const {
    rifles,
    ammo,
    getSD,
    getES,
    getAvgGroup,
    getAvgVertical,
    getGrade,
    getShotCountForLot,
  } = useApp();

  const [selectedRifle, setSelectedRifle] = useState(rifles[0]?.id || "");
  const [lotA, setLotA] = useState(ammo[0]?.id || "");
  const [lotB, setLotB] = useState(ammo.length > 1 ? ammo[1]?.id : ammo[0]?.id || "");

  const lotAData = ammo.find((a) => a.id === lotA);
  const lotBData = ammo.find((a) => a.id === lotB);

  const gradeA = getGrade(selectedRifle, lotA);
  const gradeB = getGrade(selectedRifle, lotB);

  const metrics = [
    {
      label: "Std Deviation",
      unit: "fps",
      icon: Activity,
      a: getSD(lotA),
      b: getSD(lotB),
      lowerBetter: true,
    },
    {
      label: "Ext. Spread",
      unit: "fps",
      icon: Target,
      a: getES(lotA),
      b: getES(lotB),
      lowerBetter: true,
    },
    {
      label: "Avg Group",
      unit: "MOA",
      icon: Crosshair,
      a: getAvgGroup(selectedRifle, lotA),
      b: getAvgGroup(selectedRifle, lotB),
      lowerBetter: true,
    },
    {
      label: "Avg Vertical",
      unit: "in",
      icon: TrendingDown,
      a: getAvgVertical(lotA),
      b: getAvgVertical(lotB),
      lowerBetter: true,
    },
  ];

  // Determine which lot wins each metric
  const getWinner = (a: number, b: number, lowerBetter: boolean) => {
    if (a === 0 && b === 0) return "tie";
    if (a === 0) return "b";
    if (b === 0) return "a";
    if (a === b) return "tie";
    if (lowerBetter) return a < b ? "a" : "b";
    return a > b ? "a" : "b";
  };

  return (
    <main className="p-4 max-w-md mx-auto space-y-6 pt-8 pb-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-white font-extrabold">Level</span><span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent font-extrabold">UP</span>{" "}
          Compare
        </h1>
        <p className="text-[11px] font-medium tracking-widest uppercase text-textSecondary/60 mt-0.5">
          Lot Evaluation & Velocity Error Logger
        </p>
        <p className="text-textSecondary text-sm mt-1">Head-to-head lot testing</p>
      </header>

      {/* Rifle Selector */}
      <div className="ios-card">
        <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block ml-1">
          Test Rifle
        </label>
        <select
          className="ios-input appearance-none bg-black"
          value={selectedRifle}
          onChange={(e) => setSelectedRifle(e.target.value)}
        >
          {rifles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.make} {r.model} - {r.barrelLength}
            </option>
          ))}
        </select>
      </div>

      {/* Lot Selectors Side-by-Side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="ios-card space-y-2">
          <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider block ml-1">
            Lot A
          </label>
          <select
            className="ios-input appearance-none bg-black text-sm"
            value={lotA}
            onChange={(e) => setLotA(e.target.value)}
          >
            {ammo.map((a) => (
              <option key={a.id} value={a.id}>
                {a.brand} {a.model}
              </option>
            ))}
          </select>
          <p className="text-xs text-textSecondary ml-1">#{lotAData?.lotNumber} • {getShotCountForLot(lotA)} shots</p>
        </div>
        <div className="ios-card space-y-2">
          <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider block ml-1">
            Lot B
          </label>
          <select
            className="ios-input appearance-none bg-black text-sm"
            value={lotB}
            onChange={(e) => setLotB(e.target.value)}
          >
            {ammo.map((a) => (
              <option key={a.id} value={a.id}>
                {a.brand} {a.model}
              </option>
            ))}
          </select>
          <p className="text-xs text-textSecondary ml-1">#{lotBData?.lotNumber} • {getShotCountForLot(lotB)} shots</p>
        </div>
      </div>

      {/* Grade Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-center py-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-4 h-4" style={{ color: gradeA.color }} />
            <span className="text-xs text-textSecondary font-medium">Lot A Grade</span>
          </div>
          <p className="text-5xl font-black tracking-tight" style={{ color: gradeA.color }}>
            {gradeA.grade}
          </p>
          <p className="text-xs text-textSecondary mt-2">Score: {gradeA.score}/100</p>
        </div>
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-center py-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-4 h-4" style={{ color: gradeB.color }} />
            <span className="text-xs text-textSecondary font-medium">Lot B Grade</span>
          </div>
          <p className="text-5xl font-black tracking-tight" style={{ color: gradeB.color }}>
            {gradeB.grade}
          </p>
          <p className="text-xs text-textSecondary mt-2">Score: {gradeB.score}/100</p>
        </div>
      </div>

      {/* Metric-by-Metric Comparison */}
      <div className="ios-card space-y-0 p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Metric Breakdown</h3>
          </div>
        </div>
        {metrics.map((m, i) => {
          const winner = getWinner(m.a, m.b, m.lowerBetter);
          return (
            <div
              key={m.label}
              className={`px-4 py-4 ${i < metrics.length - 1 ? "border-b border-[#2C2C2E]" : ""}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <m.icon className="w-3.5 h-3.5 text-textSecondary" />
                <span className="text-xs text-textSecondary font-medium uppercase tracking-wider">
                  {m.label}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                {/* Lot A Value */}
                <div className="text-left">
                  <span
                    className="text-2xl font-bold"
                    style={{
                      color: winner === "a" ? "#32D74B" : winner === "b" ? "#FF453A" : "#FFFFFF",
                    }}
                  >
                    {m.a || "—"}
                  </span>
                  <span className="text-xs text-textSecondary ml-1">{m.unit}</span>
                </div>
                {/* VS divider */}
                <span className="text-xs text-textSecondary font-bold">vs</span>
                {/* Lot B Value */}
                <div className="text-right">
                  <span
                    className="text-2xl font-bold"
                    style={{
                      color: winner === "b" ? "#32D74B" : winner === "a" ? "#FF453A" : "#FFFFFF",
                    }}
                  >
                    {m.b || "—"}
                  </span>
                  <span className="text-xs text-textSecondary ml-1">{m.unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verdict */}
      {gradeA.score > 0 && gradeB.score > 0 && (
        <div className="ios-card bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {gradeA.score > gradeB.score
                  ? `${lotAData?.brand} ${lotAData?.model} wins`
                  : gradeA.score < gradeB.score
                  ? `${lotBData?.brand} ${lotBData?.model} wins`
                  : "Dead even — run more rounds"}
              </p>
              <p className="text-xs text-textSecondary mt-0.5">
                {gradeA.score > gradeB.score
                  ? `Outscores by ${gradeA.score - gradeB.score} points in ${rifles.find(r => r.id === selectedRifle)?.make} ${rifles.find(r => r.id === selectedRifle)?.model}`
                  : gradeA.score < gradeB.score
                  ? `Outscores by ${gradeB.score - gradeA.score} points in ${rifles.find(r => r.id === selectedRifle)?.make} ${rifles.find(r => r.id === selectedRifle)?.model}`
                  : "Need more data to differentiate"}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
