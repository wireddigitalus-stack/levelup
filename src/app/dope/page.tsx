"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Zap, Crosshair, Clock, Gauge } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { calculateTrajectory, getBCForAmmo, getTransonicRange, type TrajectoryPoint } from "@/lib/ballistics";

export default function DopePage() {
  const { rifles, ammo, selectedRifleId, selectedAmmoId, setSelectedRifleId, setSelectedAmmoId, shots } = useApp();

  const [zeroRange, setZeroRange] = useState(50);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [transonic, setTransonic] = useState(0);

  const selectedAmmo = ammo.find((a) => a.id === selectedAmmoId);
  const selectedRifle = rifles.find((r) => r.id === selectedRifleId);

  // Calculate average MV from logged shots for this ammo
  const ammoShots = shots.filter((s) => s.ammoId === selectedAmmoId);
  const avgMV = ammoShots.length > 0
    ? Math.round(ammoShots.reduce((sum, s) => sum + s.velocityFps, 0) / ammoShots.length)
    : 1060;

  useEffect(() => {
    if (!selectedAmmo) return;
    const bc = getBCForAmmo(selectedAmmo.brand, selectedAmmo.model);
    const traj = calculateTrajectory(avgMV, 40, bc, zeroRange, 300);
    setTrajectory(traj);
    setTransonic(getTransonicRange(avgMV, bc));
  }, [avgMV, zeroRange, selectedAmmo]);

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
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-white font-extrabold">Level</span><span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent font-extrabold">UP</span>{" "}
          Dope Card
        </h1>
        <p className="text-[11px] font-medium tracking-widest uppercase text-textSecondary/60 mt-0.5">
          Lot Evaluation & Velocity Error Logger
        </p>
        <p className="text-textSecondary text-sm mt-1">
          Personalized trajectory from your logged data
        </p>
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
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-center py-4">
          <Gauge className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{avgMV}</p>
          <p className="text-[10px] text-textSecondary">Avg MV (fps)</p>
        </div>
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-center py-4">
          <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{transonic}</p>
          <p className="text-[10px] text-textSecondary">Transonic (yds)</p>
        </div>
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-center py-4">
          <Crosshair className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{zeroRange}</p>
          <p className="text-[10px] text-textSecondary">Zero (yds)</p>
        </div>
      </div>

      {/* Source indicator */}
      <div className="flex items-center gap-2 bg-green-500/10 rounded-lg px-3 py-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <p className="text-xs text-green-400">
          Calculated from {ammoShots.length} logged shots •{" "}
          {selectedAmmo?.brand} {selectedAmmo?.model} #{selectedAmmo?.lotNumber}
        </p>
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
        <div className="grid grid-cols-6 text-[10px] font-semibold text-textSecondary uppercase tracking-wider px-3 py-2 bg-[#1A1A1C] border-b border-[#2C2C2E]">
          <div>Range</div>
          <div className="text-center">Vel</div>
          <div className="text-center">Drop</div>
          <div className="text-center">MOA</div>
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
              <span className="text-[10px] text-textSecondary">y</span>
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
              {point.dropMoa > 0 ? "+" : ""}{point.dropMoa.toFixed(1)}
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
      <div className="flex flex-wrap gap-3 text-[10px] text-textSecondary px-1">
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
