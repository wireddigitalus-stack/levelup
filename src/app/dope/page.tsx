"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Zap, Crosshair, Clock, Gauge, SlidersHorizontal, RotateCcw, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import PageHeader from "@/components/layout/PageHeader";
import { calculateTrajectory, getBCForAmmo, getTransonicRange, trueBC, type TrajectoryPoint } from "@/lib/ballistics";

export default function DopePage() {
  const { rifles, ammo, selectedRifleId, selectedAmmoId, setSelectedRifleId, setSelectedAmmoId, shots } = useApp();

  const [zeroRange, setZeroRange] = useState(50);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [transonic, setTransonic] = useState(0);
  const [unit, setUnit] = useState<'moa' | 'mil'>('moa');

  // BC Truing state
  const [truingOpen, setTruingOpen] = useState(false);
  const [truingRange, setTruingRange] = useState("100");
  const [truingDrop, setTruingDrop] = useState("");
  const [truedBCValue, setTruedBCValue] = useState<number | null>(null);
  const [truingResult, setTruingResult] = useState<{ truedBC: number; predictedDrop: number; originalBC: number } | null>(null);

  const selectedAmmo = ammo.find((a) => a.id === selectedAmmoId);
  const selectedRifle = rifles.find((r) => r.id === selectedRifleId);

  // Calculate average MV from logged shots for this ammo
  const ammoShots = shots.filter((s) => s.ammoId === selectedAmmoId);
  const avgMV = ammoShots.length > 0
    ? Math.round(ammoShots.reduce((sum, s) => sum + s.velocityFps, 0) / ammoShots.length)
    : 1060;

  useEffect(() => {
    if (!selectedAmmo) return;
    const catalogBC = getBCForAmmo(selectedAmmo.brand, selectedAmmo.model);
    const activeBC = truedBCValue ?? catalogBC;
    const traj = calculateTrajectory(avgMV, 40, activeBC, zeroRange, 300);
    setTrajectory(traj);
    setTransonic(getTransonicRange(avgMV, activeBC));
  }, [avgMV, zeroRange, selectedAmmo, truedBCValue]);

  // Reset trued BC when ammo changes
  useEffect(() => {
    setTruedBCValue(null);
    setTruingResult(null);
    setTruingDrop("");
  }, [selectedAmmoId]);

  const handleTrueBC = useCallback(() => {
    if (!selectedAmmo || !truingDrop) return;
    const range = parseInt(truingRange);
    const drop = parseFloat(truingDrop);
    if (isNaN(range) || isNaN(drop) || range <= zeroRange) return;

    const catalogBC = getBCForAmmo(selectedAmmo.brand, selectedAmmo.model);
    const result = trueBC(avgMV, zeroRange, range, -drop, 40); // negative because drop is below
    if (result) {
      setTruedBCValue(result.truedBC);
      setTruingResult({
        truedBC: result.truedBC,
        predictedDrop: result.predictedDrop,
        originalBC: catalogBC,
      });
    }
  }, [selectedAmmo, truingDrop, truingRange, avgMV, zeroRange]);

  const resetTruing = useCallback(() => {
    setTruedBCValue(null);
    setTruingResult(null);
    setTruingDrop("");
  }, []);

  // Color coding for drop values
  const getDropColor = (drop: number, range: number) => {
    if (range <= zeroRange) return "#32D74B";
    const absDrop = Math.abs(drop);
    if (absDrop < 5) return "#32D74B";
    if (absDrop < 20) return "#FFD60A";
    if (absDrop < 50) return "#FF9F0A";
    return "#FF453A";
  };

  return (
    <main className="p-4 max-w-md mx-auto space-y-6 pt-6 pb-36">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-primary text-sm font-medium active:opacity-70"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      <header>
        <PageHeader title="Dope Card" subtitle="Personalized trajectory from your logged data" />
      </header>

      {/* Rifle + Ammo Selectors */}
      <div className="ios-card space-y-3">
        <div>
          <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block ml-1">
            Rifle
          </label>
          <select
            className="ios-input appearance-none bg-black text-sm"
            value={selectedRifleId}
            onChange={(e) => setSelectedRifleId(e.target.value)}
          >
            {rifles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.make} {r.model} — {r.barrelLength}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block ml-1">
            Ammo Lot
          </label>
          <select
            className="ios-input appearance-none bg-black text-sm"
            value={selectedAmmoId}
            onChange={(e) => setSelectedAmmoId(e.target.value)}
          >
            {ammo.map((a) => (
              <option key={a.id} value={a.id}>
                {a.brand} {a.model} — Lot #{a.lotNumber}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block ml-1">
            Zero Range
          </label>
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((z) => (
              <button
                key={z}
                onClick={() => setZeroRange(z)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  zeroRange === z
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black"
                    : "bg-[#2C2C2E] text-textSecondary"
                }`}
              >
                {z}y
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block ml-1">
            Adjustment Unit
          </label>
          <div className="flex gap-2">
            {(['moa', 'mil'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  unit === u
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black"
                    : "bg-[#2C2C2E] text-textSecondary"
                }`}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-center py-4">
          <Gauge className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{avgMV}</p>
          <p className="text-xs text-textSecondary">Avg MV (fps)</p>
        </div>
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-center py-4">
          <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{transonic}</p>
          <p className="text-xs text-textSecondary">Transonic (yds)</p>
        </div>
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-center py-4">
          <Crosshair className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{zeroRange}</p>
          <p className="text-xs text-textSecondary">Zero (yds)</p>
        </div>
      </div>

      {/* Source indicator */}
      <div className="flex items-center gap-2 bg-green-500/10 rounded-lg px-3 py-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <p className="text-xs text-green-400">
          Calculated from {ammoShots.length} logged shots •{" "}
          {selectedAmmo?.brand} {selectedAmmo?.model} #{selectedAmmo?.lotNumber}
          {truedBCValue && " • BC Trued"}
        </p>
      </div>

      {/* ========== BC TRUING PANEL ========== */}
      <div className="ios-card overflow-hidden">
        <button
          onClick={() => setTruingOpen(!truingOpen)}
          className="w-full flex items-center justify-between py-1 active:opacity-70"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-sm">Real-World Truing</span>
            {truedBCValue && (
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-bold">TRUED</span>
            )}
          </div>
          <span className="text-xs text-textSecondary">{truingOpen ? "▲" : "▼"}</span>
        </button>

        {truingOpen && (
          <div className="mt-3 pt-3 border-t border-[#2C2C2E] space-y-4">
            <p className="text-xs text-textSecondary leading-relaxed">
              Calibrate your ballistic model to match observed impacts. Enter the range you shot at and the actual drop you measured.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
                  Range (yds)
                </label>
                <select
                  className="ios-input appearance-none bg-black text-sm w-full"
                  value={truingRange}
                  onChange={(e) => setTruingRange(e.target.value)}
                >
                  {[50, 75, 100, 125, 150, 175, 200, 250, 300].filter(r => r > zeroRange).map((r) => (
                    <option key={r} value={r}>{r} yards</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
                  Actual Drop (in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 11.5"
                  className="ios-input bg-black text-sm w-full"
                  value={truingDrop}
                  onChange={(e) => setTruingDrop(e.target.value)}
                />
              </div>
            </div>

            {/* Current predicted vs what they'll enter */}
            {truingDrop && !truingResult && (() => {
              const range = parseInt(truingRange);
              const currentPoint = trajectory.find(p => p.rangeYds === range);
              return currentPoint ? (
                <div className="bg-[#0A0A0A] rounded-xl p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Predicted drop at {range}y:</span>
                    <span className="font-mono font-semibold">{Math.abs(currentPoint.dropInches).toFixed(1)}&quot;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Your observed drop:</span>
                    <span className="font-mono font-semibold text-cyan-400">{parseFloat(truingDrop).toFixed(1)}&quot;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Difference:</span>
                    <span className="font-mono font-semibold text-yellow-400">
                      {Math.abs(Math.abs(currentPoint.dropInches) - parseFloat(truingDrop)).toFixed(1)}&quot;
                    </span>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Truing result */}
            {truingResult && (
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-400">BC Trued Successfully</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/40 rounded-lg p-2 text-center">
                    <p className="text-textSecondary mb-0.5">Catalog BC</p>
                    <p className="font-mono font-bold text-white/50 line-through">{truingResult.originalBC.toFixed(3)}</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-2 text-center">
                    <p className="text-textSecondary mb-0.5">Trued BC</p>
                    <p className="font-mono font-bold text-cyan-400">{truingResult.truedBC.toFixed(3)}</p>
                  </div>
                </div>
                <p className="text-[10px] text-textSecondary text-center mt-1">
                  Dope card recalculated with trued BC • All ranges updated
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleTrueBC}
                disabled={!truingDrop || parseFloat(truingDrop) === 0}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-cyan-500 to-blue-500 text-white active:scale-[0.97] disabled:opacity-30 disabled:active:scale-100"
              >
                Calculate Trued BC
              </button>
              {truedBCValue && (
                <button
                  onClick={resetTruing}
                  className="px-3 py-2.5 rounded-xl font-semibold text-sm bg-[#2C2C2E] text-textSecondary active:scale-[0.97]"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trajectory Table */}
      <div className="ios-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2C2C2E] bg-[#1C1C1E]">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-primary" />
            Range Card — {selectedRifle?.make} {selectedRifle?.model}
          </h3>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-6 text-xs font-semibold text-textSecondary uppercase tracking-wider px-3 py-2 bg-[#1A1A1C] border-b border-[#2C2C2E]">
          <div>Range</div>
          <div className="text-center">Vel</div>
          <div className="text-center">Drop</div>
          <div className="text-center">{unit === 'moa' ? 'MOA' : 'MIL'}</div>
          <div className="text-center">TOF</div>
          <div className="text-center">Energy</div>
        </div>

        {/* Table Body */}
        {trajectory.map((point, i) => (
          <div
            key={point.rangeYds}
            className={`grid grid-cols-6 text-xs px-3 py-2.5 items-center ${
              i < trajectory.length - 1 ? "border-b border-[#1C1C1E]" : ""
            } ${point.rangeYds === zeroRange ? "bg-green-500/5" : ""} ${
              !point.isSuperSonic && point.rangeYds > 0 ? "bg-red-500/5" : ""
            }`}
          >
            <div className="font-semibold flex items-center gap-1">
              {point.rangeYds}
              <span className="text-xs text-textSecondary">y</span>
              {!point.isSuperSonic && point.rangeYds > 0 && (
                <Zap className="w-2.5 h-2.5 text-yellow-500" />
              )}
            </div>
            <div className="text-center font-mono" style={{ color: point.isSuperSonic || point.rangeYds === 0 ? "#FFFFFF" : "#FF9F0A" }}>
              {point.velocityFps}
            </div>
            <div
              className="text-center font-mono font-semibold"
              style={{ color: getDropColor(point.dropInches, point.rangeYds) }}
            >
              {point.dropInches > 0 ? "+" : ""}
              {point.dropInches.toFixed(1)}&quot;
            </div>
            <div className="text-center font-mono text-textSecondary">
              {unit === 'moa'
                ? `${point.dropMoa > 0 ? "+" : ""}${point.dropMoa.toFixed(1)}`
                : `${point.dropMil > 0 ? "+" : ""}${point.dropMil.toFixed(1)}`
              }
            </div>
            <div className="text-center font-mono text-textSecondary">
              {point.tofSeconds.toFixed(3)}s
            </div>
            <div className="text-center font-mono text-textSecondary">
              {point.energyFtLbs.toFixed(0)}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-textSecondary px-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          Zero range
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-yellow-500" />
          Transonic / subsonic
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          TOF = Time of Flight
        </div>
      </div>
    </main>
  );
}
