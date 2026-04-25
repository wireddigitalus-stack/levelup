"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import MicButton from "@/components/MicButton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ScatterChart, Scatter, AreaChart, Area
} from "recharts";
import {
  Brain, TrendingUp, Thermometer, Send, Loader2, ChevronDown, Zap, Activity, Target, Filter
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import PageHeader from "@/components/layout/PageHeader";

export default function AnalyticsPage() {
  const { rifles, ammo, sessions, shots, getSD, getES, getAvgGroup, getGrade } = useApp();

  // Filters
  const [filterRifle, setFilterRifle] = useState("all");
  const [filterAmmo, setFilterAmmo] = useState("all");
  const [filterDays, setFilterDays] = useState(90);
  const [showFilters, setShowFilters] = useState(false);

  // AI Chat
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "spotter"; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, aiLoading]);

  // Filter shots by selection
  const filteredShots = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filterDays);
    return shots.filter((s) => {
      if (filterRifle !== "all" && s.rifleId !== filterRifle) return false;
      if (filterAmmo !== "all" && s.ammoId !== filterAmmo) return false;
      if (new Date(s.timestamp) < cutoff) return false;
      return true;
    });
  }, [shots, filterRifle, filterAmmo, filterDays]);

  // ── Velocity Over Time ──
  const velocityTimeline = useMemo(() => {
    return filteredShots
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((s, i) => {
        const lot = ammo.find((a) => a.id === s.ammoId);
        return {
          idx: i + 1,
          velocity: s.velocityFps,
          label: `${lot?.brand || ""} #${lot?.lotNumber || ""}`,
          date: new Date(s.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        };
      });
  }, [filteredShots, ammo]);

  // ── SD per Session ──
  const sdBySession = useMemo(() => {
    const sessionGroups: Record<string, number[]> = {};
    filteredShots.forEach((s) => {
      if (!sessionGroups[s.sessionId]) sessionGroups[s.sessionId] = [];
      sessionGroups[s.sessionId].push(s.velocityFps);
    });
    return Object.entries(sessionGroups).map(([sid, vels]) => {
      const session = sessions.find((s) => s.id === sid);
      const mean = vels.reduce((a, b) => a + b, 0) / vels.length;
      const variance = vels.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (vels.length - 1 || 1);
      const sd = Math.round(Math.sqrt(variance) * 10) / 10;
      const es = Math.max(...vels) - Math.min(...vels);
      return {
        session: session?.date ? new Date(session.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : sid,
        sd,
        es,
        shots: vels.length,
        temp: session?.temperature || 0,
      };
    });
  }, [filteredShots, sessions]);

  // ── Temp vs Velocity Scatter ──
  const tempVelocity = useMemo(() => {
    return filteredShots.map((s) => {
      const session = sessions.find((sess) => sess.id === s.sessionId);
      return { temp: session?.temperature || 0, velocity: s.velocityFps };
    }).filter((d) => d.temp > 0);
  }, [filteredShots, sessions]);

  // ── Group Size Trend ──
  const groupTrend = useMemo(() => {
    return filteredShots
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((s, i) => ({ idx: i + 1, group: s.groupSizeMoa }));
  }, [filteredShots]);

  // ── Lot Ranking Table ──
  const lotRanking = useMemo(() => {
    return ammo.map((lot) => {
      const bestRifle = rifles.reduce((best, r) => {
        const g = getGrade(r.id, lot.id);
        return g.score > best.score ? { ...g, rifleName: `${r.make} ${r.model}` } : best;
      }, { grade: "N/A", color: "#8E8E93", score: 0, rifleName: "" });
      return {
        id: lot.id,
        name: `${lot.brand} ${lot.model}`,
        lot: lot.lotNumber,
        sd: getSD(lot.id),
        es: getES(lot.id),
        grade: bestRifle.grade,
        gradeColor: bestRifle.color,
        score: bestRifle.score,
        bestRifle: bestRifle.rifleName,
        shots: shots.filter((s) => s.ammoId === lot.id).length,
      };
    }).sort((a, b) => b.score - a.score);
  }, [ammo, rifles, getSD, getES, getGrade, shots]);

  // ── Computed Stats ──
  const totalShots = filteredShots.length;
  const avgVelocity = totalShots > 0 ? Math.round(filteredShots.reduce((s, sh) => s + sh.velocityFps, 0) / totalShots) : 0;
  const overallSD = useMemo(() => {
    if (totalShots < 2) return 0;
    const mean = filteredShots.reduce((s, sh) => s + sh.velocityFps, 0) / totalShots;
    const variance = filteredShots.reduce((s, sh) => s + Math.pow(sh.velocityFps - mean, 2), 0) / (totalShots - 1);
    return Math.round(Math.sqrt(variance) * 10) / 10;
  }, [filteredShots, totalShots]);
  const avgGroupFiltered = totalShots > 0 ? Math.round((filteredShots.reduce((s, sh) => s + sh.groupSizeMoa, 0) / totalShots) * 100) / 100 : 0;

  // ── AI Insights ──
  const buildContext = useCallback(() => {
    const ctx = [
      `Total shots: ${totalShots}`, `Avg MV: ${avgVelocity} fps`, `Overall SD: ${overallSD} fps`, `Avg Group: ${avgGroupFiltered} MOA`,
      `\nLot Rankings:`,
      ...lotRanking.map((l) => `  ${l.name} #${l.lot}: Grade ${l.grade} (${l.score}/100), SD=${l.sd}, ES=${l.es}, ${l.shots} shots, best in ${l.bestRifle}`),
      `\nSession History:`,
      ...sdBySession.map((s) => `  ${s.session}: SD=${s.sd}, ES=${s.es}, ${s.shots} shots, ${s.temp}°F`),
    ];
    return ctx.join("\n");
  }, [totalShots, avgVelocity, overallSD, avgGroupFiltered, lotRanking, sdBySession]);

  const askAI = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    const userMsg = aiPrompt.trim();
    setAiMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setAiPrompt("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg, context: buildContext() }),
      });
      const data = await res.json();
      setAiMessages((prev) => [...prev, { role: "spotter", text: data.response || data.error || "No response." }]);
    } catch {
      setAiMessages((prev) => [...prev, { role: "spotter", text: "Connection failed. Check your GEMINI_API_KEY." }]);
    }
    setAiLoading(false);
  };

  return (
    <main className="p-4 max-w-md mx-auto space-y-5 pt-8 pb-36">
      <PageHeader title="Analytics" subtitle="Performance trends & AI insights" />
      <div className="flex items-center justify-between">
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-primary text-sm font-semibold active:opacity-70">
          <Filter className="w-4 h-4" /> Filters
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
        <span className="text-[11px] text-textSecondary font-mono">Last {filterDays} days · {filteredShots.length} shots</span>
      </div>

      {showFilters && (
        <div className="ios-card space-y-3">
          <select className="ios-input appearance-none bg-black text-sm" value={filterRifle} onChange={(e) => setFilterRifle(e.target.value)}>
            <option value="all">All Rifles</option>
            {rifles.map((r) => <option key={r.id} value={r.id}>{r.make} {r.model}</option>)}
          </select>
          <select className="ios-input appearance-none bg-black text-sm" value={filterAmmo} onChange={(e) => setFilterAmmo(e.target.value)}>
            <option value="all">All Lots</option>
            {ammo.map((a) => <option key={a.id} value={a.id}>{a.brand} {a.model} #{a.lotNumber}</option>)}
          </select>
          <div className="flex gap-2">
            {[30, 60, 90, 365].map((d) => (
              <button key={d} onClick={() => setFilterDays(d)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${filterDays === d ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black" : "bg-[#2C2C2E] text-textSecondary"}`}>
                {d === 365 ? "1yr" : `${d}d`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Shots", value: totalShots, icon: Target, color: "#32D74B" },
          { label: "Avg MV", value: avgVelocity, icon: Zap, color: "#FFD60A" },
          { label: "SD", value: overallSD, icon: Activity, color: "#FF9F0A" },
          { label: "Avg Grp", value: `${avgGroupFiltered}`, icon: Target, color: "#32D74B" },
        ].map((card) => (
          <div key={card.label} className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-center py-3">
            <card.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: card.color }} />
            <p className="text-lg font-bold">{card.value}</p>
            <p className="text-[9px] text-textSecondary">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Velocity Timeline */}
      <div className="ios-card">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Velocity Over Time</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={velocityTimeline} margin={{ top: 5, right: 10, bottom: 15, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#8E8E93", fontSize: 9 }} tickLine={false} axisLine={{ stroke: "#2C2C2E" }} />
              <YAxis domain={["dataMin - 10", "dataMax + 10"]} tick={{ fill: "#8E8E93", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2C2C2E" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }} labelStyle={{ color: "#fff", fontWeight: 600 }} itemStyle={{ color: "#fff" }} formatter={(v: number) => [`${v} fps`, "MV"]} />
              <Line type="monotone" dataKey="velocity" stroke="#32D74B" strokeWidth={2} dot={{ r: 3, fill: "#32D74B" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SD & ES Per Session */}
      <div className="ios-card">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-sm">SD & ES Per Session</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sdBySession} margin={{ top: 5, right: 10, bottom: 15, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
              <XAxis dataKey="session" tick={{ fill: "#8E8E93", fontSize: 9 }} tickLine={false} axisLine={{ stroke: "#2C2C2E" }} />
              <YAxis tick={{ fill: "#8E8E93", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2C2C2E" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }} labelStyle={{ color: "#fff", fontWeight: 600 }} itemStyle={{ color: "#fff" }} />
              <Bar dataKey="sd" name="SD" fill="#FF9F0A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="es" name="ES" fill="#FF453A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Temperature vs Velocity */}
      <div className="ios-card">
        <div className="flex items-center gap-2 mb-3">
          <Thermometer className="w-4 h-4 text-red-400" />
          <h3 className="font-semibold text-sm">Temp Sensitivity</h3>
          <span className="text-[10px] text-textSecondary ml-auto">°F vs fps</span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 10, bottom: 15, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" />
              <XAxis type="number" dataKey="temp" name="Temp" domain={["dataMin - 5", "dataMax + 5"]} tick={{ fill: "#8E8E93", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2C2C2E" }} />
              <YAxis type="number" dataKey="velocity" name="MV" domain={["dataMin - 10", "dataMax + 10"]} tick={{ fill: "#8E8E93", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2C2C2E" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }} labelStyle={{ color: "#fff", fontWeight: 600 }} itemStyle={{ color: "#fff" }} formatter={(v: number, name: string) => [name === "Temp" ? `${v}°F` : `${v} fps`, name === "Temp" ? "Temperature" : "Velocity"]} />
              <Scatter data={tempVelocity} fill="#FF6B6B">
                {tempVelocity.map((_, i) => <Cell key={i} fill={`hsl(${(tempVelocity[i].temp - 40) * 3}, 80%, 55%)`} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Group Size Trend */}
      <div className="ios-card">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Group Size Trend</h3>
          <span className="text-[10px] text-textSecondary ml-auto">MOA</span>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={groupTrend} margin={{ top: 5, right: 10, bottom: 15, left: -15 }}>
              <defs>
                <linearGradient id="groupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#32D74B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#32D74B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
              <XAxis dataKey="idx" tick={{ fill: "#8E8E93", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2C2C2E" }} />
              <YAxis domain={[0, "dataMax + 0.2"]} tick={{ fill: "#8E8E93", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2C2C2E" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }} labelStyle={{ color: "#fff", fontWeight: 600 }} itemStyle={{ color: "#fff" }} formatter={(v: number) => [`${v} MOA`, "Group"]} />
              <Area type="monotone" dataKey="group" stroke="#32D74B" strokeWidth={2} fill="url(#groupGrad)" dot={{ r: 3, fill: "#32D74B" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* V-Spread vs H-Spread Analysis */}
      {(() => {
        const vhData = filteredShots
          .filter((s) => s.vSpreadIn && s.hSpreadIn)
          .map((s, i) => ({
            idx: i + 1,
            v: s.vSpreadIn!,
            h: s.hSpreadIn!,
            ratio: s.hSpreadIn! > 0 ? Math.round((s.vSpreadIn! / s.hSpreadIn!) * 100) / 100 : 0,
          }));
        const avgV = vhData.length > 0 ? Math.round((vhData.reduce((s, d) => s + d.v, 0) / vhData.length) * 100) / 100 : 0;
        const avgH = vhData.length > 0 ? Math.round((vhData.reduce((s, d) => s + d.h, 0) / vhData.length) * 100) / 100 : 0;
        const avgRatio = avgH > 0 ? Math.round((avgV / avgH) * 100) / 100 : 0;
        const diagnosis = avgRatio > 2 ? "Ammo (Vertical)" : avgRatio > 1.3 ? "Mixed" : "Wind (Horizontal)";
        const diagColor = avgRatio > 2 ? "#FF453A" : avgRatio > 1.3 ? "#FFD60A" : "#32D74B";

        return vhData.length > 0 ? (
          <div className="ios-card">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-purple-400" />
              <h3 className="font-semibold text-sm">V-Spread vs H-Spread</h3>
            </div>
            <p className="text-[10px] text-textSecondary mb-3">V = Ammo consistency • H = Wind reading</p>

            {/* Summary Badges */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-[#0A0A0A] rounded-xl py-2 text-center">
                <p className="text-lg font-bold text-orange-400">{avgV}&quot;</p>
                <p className="text-[9px] text-textSecondary">Avg V</p>
              </div>
              <div className="bg-[#0A0A0A] rounded-xl py-2 text-center">
                <p className="text-lg font-bold text-blue-400">{avgH}&quot;</p>
                <p className="text-[9px] text-textSecondary">Avg H</p>
              </div>
              <div className="bg-[#0A0A0A] rounded-xl py-2 text-center">
                <p className="text-lg font-bold" style={{ color: diagColor }}>{avgRatio}x</p>
                <p className="text-[9px] text-textSecondary">V/H Ratio</p>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="bg-[#0A0A0A] rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
              <span className="text-[10px] text-textSecondary">Primary Error Source</span>
              <span className="text-xs font-bold" style={{ color: diagColor }}>{diagnosis}</span>
            </div>

            {/* Scatter Chart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, right: 10, bottom: 15, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" />
                  <XAxis type="number" dataKey="h" name="H-Spread" domain={[0, "dataMax + 0.1"]} tick={{ fill: "#8E8E93", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2C2C2E" }} label={{ value: "H-Spread (in)", position: "insideBottom", offset: -10, fill: "#8E8E93", fontSize: 9 }} />
                  <YAxis type="number" dataKey="v" name="V-Spread" domain={[0, "dataMax + 0.1"]} tick={{ fill: "#8E8E93", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#2C2C2E" }} label={{ value: "V-Spread", angle: -90, position: "insideLeft", offset: 20, fill: "#8E8E93", fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }} labelStyle={{ color: "#fff", fontWeight: 600 }} itemStyle={{ color: "#fff" }} formatter={(v: number, name: string) => [name === "V-Spread" ? `${v}"` : `${v}"`, name]} />
                  <Scatter data={vhData} fill="#A78BFA">
                    {vhData.map((d, i) => <Cell key={i} fill={d.ratio > 2 ? "#FF453A" : d.ratio > 1.3 ? "#FFD60A" : "#32D74B"} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null;
      })()}

      {/* Lot Ranking Table */}
      <div className="ios-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2C2C2E] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Lot Power Rankings</h3>
        </div>
        {lotRanking.map((lot, i) => (
          <div key={lot.id} className={`px-4 py-3 flex items-center gap-3 ${i < lotRanking.length - 1 ? "border-b border-[#1C1C1E]" : ""}`}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ color: lot.gradeColor, backgroundColor: lot.gradeColor + "15" }}>
              {lot.grade}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{lot.name} <span className="text-textSecondary font-normal">#{lot.lot}</span></p>
              <p className="text-[10px] text-textSecondary">SD {lot.sd} • ES {lot.es} • {lot.shots} shots • Best: {lot.bestRifle}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold" style={{ color: lot.gradeColor }}>{lot.score}</p>
              <p className="text-[9px] text-textSecondary">/100</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights — Ask Spotter */}
      <div className="relative overflow-hidden rounded-2xl border border-[#2C2C2E] bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex flex-col">
        {/* Animated glow background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-green-500/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-emerald-500/15 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        {/* Header — fixed top */}
        <div className="relative px-5 pt-5 pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#1A1A2E]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-white tracking-tight">Ask Spotter</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[10px] text-green-400/80 font-medium">Powered by Gemini • Online</p>
              </div>
            </div>
            {aiMessages.length > 0 && (
              <button onClick={() => setAiMessages([])} className="text-[10px] text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Chat Body — scrollable */}
        <div className="relative px-5 py-3 space-y-3 max-h-80 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#2C2C2E transparent" }}>
          {/* Empty state — quick prompts */}
          {aiMessages.length === 0 && !aiLoading && (
            <div className="space-y-3 py-2">
              <p className="text-xs text-white/30 text-center">Ask me anything about your ballistic data</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { emoji: "🏆", text: "Best lot to buy more?" },
                  { emoji: "📈", text: "SD trending up?" },
                  { emoji: "🔧", text: "Best tuner setting?" },
                  { emoji: "🌡️", text: "Temp sensitivity?" },
                  { emoji: "💰", text: "Cost per MOA?" },
                  { emoji: "🎯", text: "Tightest group?" },
                ].map((q) => (
                  <button key={q.text} onClick={() => { setAiPrompt(q.text); }}
                    className="flex items-center gap-1.5 text-[11px] font-medium bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white/70 hover:bg-white/10 hover:text-white active:scale-95 transition-all"
                  >
                    <span>{q.emoji}</span>
                    <span>{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {aiMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "spotter" && (
                <div className="flex gap-2 max-w-[90%]">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0 mt-1">
                    <Brain className="w-3 h-3 text-black" />
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[15px] leading-relaxed text-white/90 whitespace-pre-wrap border border-white/5">
                    {msg.text}
                  </div>
                </div>
              )}
              {msg.role === "user" && (
                <div className="bg-green-500/20 border border-green-500/20 rounded-2xl rounded-tr-md px-3.5 py-2.5 text-[15px] text-white/90 max-w-[85%]">
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {aiLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0">
                <Brain className="w-3 h-3 text-black" />
              </div>
              <div className="bg-white/5 rounded-2xl rounded-tl-md px-4 py-3 border border-white/5">
                <div className="flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input — pinned bottom */}
        <div className="relative px-4 py-3 border-t border-white/5 bg-black/20">
          <div className="flex gap-2 items-center">
            <MicButton onResult={(text) => setAiPrompt((prev) => prev + text)} size="sm" />
            <div className="flex-1 relative">
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-green-400/40 transition-all placeholder:text-white/25"
                placeholder="Ask Spotter..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askAI()}
              />
            </div>
            <button onClick={askAI} disabled={aiLoading || !aiPrompt.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all shadow-lg shadow-green-500/20 shrink-0"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Send className="w-4 h-4 text-black" />}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
