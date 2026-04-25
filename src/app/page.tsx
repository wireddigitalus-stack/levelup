"use client";

import Link from "next/link";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from "recharts";
import { Settings2, Activity, Target, Calendar, ChevronRight, Thermometer, Shield, Crosshair } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getConfidenceProfile, getBCForAmmo, getTransonicRange } from "@/lib/ballistics";
import WeatherCard from "@/components/weather/WeatherCard";
import PageHeader from "@/components/layout/PageHeader";

export default function DashboardPage() {
  const {
    rifles,
    ammo,
    sessions,
    shots,
    selectedRifleId,
    selectedAmmoId,
    setSelectedRifleId,
    setSelectedAmmoId,
    getSD,
    getES,
    getAvgGroup,
    getTunerData,
    getVerticalData,
    getShotCountForLot,
    getGrade,
  } = useApp();

  const sd = getSD(selectedAmmoId);
  const es = getES(selectedAmmoId);
  const avgGroup = getAvgGroup(selectedRifleId, selectedAmmoId);
  const shotCount = getShotCountForLot(selectedAmmoId);
  const tunerData = getTunerData(selectedRifleId, selectedAmmoId);
  const verticalData = getVerticalData(selectedAmmoId);
  const grade = getGrade(selectedRifleId, selectedAmmoId);

  const selectedAmmo = ammo.find((a) => a.id === selectedAmmoId);

  // Average MV from shots
  const ammoShots = shots.filter((s) => s.ammoId === selectedAmmoId);
  const avgMV = ammoShots.length > 0
    ? Math.round(ammoShots.reduce((sum, s) => sum + s.velocityFps, 0) / ammoShots.length)
    : 1060;

  // Hit probability profile (1" target)
  const confidenceData = getConfidenceProfile(sd, avgGroup, avgMV, 1.0);

  // Transonic range
  const bc = selectedAmmo ? getBCForAmmo(selectedAmmo.brand, selectedAmmo.model) : 0.14;
  const transonicRange = getTransonicRange(avgMV, bc);

  // Recent sessions (top 2)
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="p-4 max-w-md mx-auto space-y-6 pt-8 pb-10">
      <header className="flex justify-between items-end mb-6">
        <div>
          <PageHeader title="Dashboard" />
        </div>
        <Link href="/settings" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform">
          <Settings2 className="w-5 h-5 text-textPrimary" />
        </Link>
      </header>

      {/* Range Weather */}
      <WeatherCard />

      {/* Filter Card */}
      <div className="ios-card space-y-3">
        <h2 className="text-xs font-semibold text-textSecondary uppercase tracking-wider ml-1">Global Filters</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <select
            className="bg-black border border-border rounded-lg px-3 py-1.5 text-sm outline-none shrink-0 text-white"
            value={selectedRifleId}
            onChange={(e) => setSelectedRifleId(e.target.value)}
          >
            {rifles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.make} {r.model}
              </option>
            ))}
          </select>
          <select
            className="bg-black border border-border rounded-lg px-3 py-1.5 text-sm outline-none shrink-0 text-white"
            value={selectedAmmoId}
            onChange={(e) => setSelectedAmmoId(e.target.value)}
          >
            {ammo.map((a) => (
              <option key={a.id} value={a.id}>
                {a.brand} {a.model} (#{a.lotNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pairing Grade + ES/SD Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-center py-4">
          <span className="text-xs text-textSecondary font-medium block mb-1">Grade</span>
          <p className="text-4xl font-black" style={{ color: grade.color }}>
            {grade.grade}
          </p>
          <p className="text-[10px] text-textSecondary mt-1">{grade.score}/100</p>
        </div>
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A]">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] text-textSecondary font-medium">SD</span>
          </div>
          <p className="text-2xl font-bold tracking-tight">{sd}</p>
          <p className="text-[10px] text-textSecondary mt-0.5">{shotCount} shots</p>
        </div>
        <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A]">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] text-textSecondary font-medium">ES</span>
          </div>
          <p className="text-2xl font-bold tracking-tight">{es}</p>
          <p className="text-[10px] text-textSecondary mt-0.5">{shotCount} shots</p>
        </div>
      </div>

      {/* Hit Probability Card */}
      <div className="ios-card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-lg">Hit Probability</h3>
            </div>
            <p className="text-xs text-textSecondary">
              Chance of hitting a 1&quot; target at distance (SD: {sd} fps)
            </p>
          </div>
        </div>

        {/* Probability Chart */}
        <div className="h-44 w-full overflow-hidden mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={confidenceData} margin={{ top: 5, right: 10, bottom: 20, left: -15 }}>
              <defs>
                <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#32D74B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#32D74B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
              <XAxis
                dataKey="range"
                tick={{ fill: "#8E8E93", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#2C2C2E" }}
                label={{ value: "yards", position: "insideBottom", offset: -10, fill: "#8E8E93", fontSize: 10 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#8E8E93", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#2C2C2E" }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }}
                labelStyle={{ color: "#fff", fontWeight: 600 }}
                itemStyle={{ color: "#fff" }}
                formatter={(value: number) => [`${value}%`, "Hit Probability"]}
                labelFormatter={(label: number) => `${label} yards`}
              />
              <Area
                type="monotone"
                dataKey="probability"
                stroke="#32D74B"
                strokeWidth={2}
                fill="url(#probGradient)"
                dot={{ fill: "#32D74B", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: "#32D74B", strokeWidth: 2, fill: "#0A0A0A" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key Distances */}
        <div className="grid grid-cols-4 gap-2">
          {[50, 100, 200, 300].map((d) => {
            const point = confidenceData.find((p) => p.range === d);
            const prob = point?.probability || 0;
            const probColor = prob >= 80 ? "#32D74B" : prob >= 50 ? "#FFD60A" : "#FF453A";
            return (
              <div key={d} className="text-center bg-[#0A0A0A] rounded-xl py-2.5">
                <p className="text-xl font-bold" style={{ color: probColor }}>
                  {prob}%
                </p>
                <p className="text-[10px] text-textSecondary mt-0.5">{d}y</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links: Dope Card */}
      <div className="relative rounded-2xl p-[2px] overflow-hidden">
        {/* Rotating gradient border */}
        <div
          className="absolute inset-[-100px]"
          style={{
            background: "conic-gradient(from var(--border-angle), #32D74B, #ffffff90, #059669, #ffffff50, #32D74B)",
            animation: "borderRotate 4s linear infinite",
          }}
        />
        <Link
          href="/dope"
          className="relative block bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] rounded-[14px] px-4 py-4 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Crosshair className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Range Card / Dope Card</p>
                <p className="text-xs text-textSecondary">
                  MV {avgMV} fps • Transonic at ~{transonicRange}y
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-textSecondary" />
          </div>
        </Link>
      </div>

      {/* Border animation keyframes */}
      <style jsx global>{`
        @property --border-angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes borderRotate {
          to {
            --border-angle: 360deg;
          }
        }
      `}</style>

      {/* Tuner Node Scatter Plot */}
      <div className="ios-card">
        <div className="mb-4">
          <h3 className="font-semibold text-lg">Harmonic Sweet Spots</h3>
          <p className="text-xs text-textSecondary">Harrell Setting vs. Group Size (MOA)</p>
        </div>
        <div className="h-56 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" />
              <XAxis
                type="number"
                dataKey="setting"
                name="Setting"
                domain={[0, 500]}
                tick={{ fill: "#8E8E93", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#2C2C2E" }}
              />
              <YAxis
                type="number"
                dataKey="group"
                name="MOA"
                domain={[0, 1.2]}
                tick={{ fill: "#8E8E93", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#2C2C2E" }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }}
                labelStyle={{ color: "#fff", fontWeight: 600 }}
                itemStyle={{ color: "#fff" }}
              />
              <Scatter name="Groups" data={tunerData} fill="#32D74B" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        {tunerData.length === 0 && (
          <p className="text-center text-textSecondary text-sm py-6">
            No shot data for this rifle + lot combo yet.
          </p>
        )}
      </div>

      {/* Vertical Consistency */}
      <div className="ios-card">
        <div className="mb-4">
          <h3 className="font-semibold text-lg">Vertical Stringing</h3>
          <p className="text-xs text-textSecondary">Y-Axis deviation at 300 yds (inches)</p>
        </div>
        <div className="h-48 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={verticalData} margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
              <XAxis dataKey="id" hide />
              <YAxis
                domain={[-3, 3]}
                tick={{ fill: "#8E8E93", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#2C2C2E" }}
              />
              <Tooltip
                cursor={{ fill: "#2C2C2E" }}
                contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }}
                labelStyle={{ color: "#fff", fontWeight: 600 }}
                itemStyle={{ color: "#fff" }}
                formatter={(value: number) => [
                  `${value > 0 ? "+" : ""}${value} in`,
                  "Vertical",
                ]}
              />
              <Bar dataKey="yOffset" radius={[4, 4, 4, 4]}>
                {verticalData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={Math.abs(entry.yOffset) > 1 ? "#FF453A" : "#32D74B"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {verticalData.length === 0 && (
          <p className="text-center text-textSecondary text-sm py-6">
            No vertical data for this lot yet.
          </p>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="space-y-3">
        <div className="flex justify-between items-center ml-1">
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
            Recent Sessions
          </h3>
          <Link href="/sessions" className="text-xs text-primary font-medium flex items-center gap-0.5">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recentSessions.map((session) => (
          <Link href="/sessions" key={session.id} className="ios-card flex items-center gap-4 active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{session.location}</p>
              <p className="text-xs text-textSecondary">{formatDate(session.date)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-xs text-textSecondary">
                <Thermometer className="w-3 h-3" />
                {session.temperature}°F
              </div>
              <ChevronRight className="w-4 h-4 text-textSecondary" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
