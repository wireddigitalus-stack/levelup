"use client";

import { useState, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ScatterChart, Scatter, AreaChart, Area
} from "recharts";
import {
  Brain, TrendingUp, Thermometer, Send, Loader2, ChevronDown, Zap, Activity, Target, Filter
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function AnalyticsPage() {
  const { rifles, ammo, sessions, shots, getSD, getES, getAvgGroup, getGrade } = useApp();

  // Filters
  const [filterRifle, setFilterRifle] = useState("all");
  const [filterAmmo, setFilterAmmo] = useState("all");
  const [filterDays, setFilterDays] = useState(90);
  const [showFilters, setShowFilters] = useState(false);

  // AI Chat
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

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
    setAiLoading(true);
    setAiResponse("");
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, context: buildContext() }),
      });
      const data = await res.json();
      setAiResponse(data.response || data.error || "No response.");
    } catch {
      setAiResponse("Failed to connect. Check your GEMINI_API_KEY in .env.local");
    }
    setAiLoading(false);
  };

  return (
    <main className="p-4 max-w-md mx-auto space-y-5 pt-8 pb-28">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-white font-extrabold">Level</span>
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent font-extrabold">UP</span>{" "}
          Analytics
        </h1>
        <p className="text-[11px] font-medium tracking-widest uppercase text-textSecondary/60 mt-0.5">
          Lot Evaluation & Velocity Error Logger
        </p>
      </header>

      {/* Filter Toggle */}
      <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-primary text-sm font-semibold active:opacity-70">
        <Filter className="w-4 h-4" /> Filters
        <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
      </button>

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
              <Tooltip contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }} formatter={(v: number) => [`${v} fps`, "MV"]} />
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
              <Tooltip contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }} />
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
              <Tooltip contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }} formatter={(v: number, name: string) => [name === "Temp" ? `${v}°F` : `${v} fps`, name]} />
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
              <Tooltip contentStyle={{ backgroundColor: "#1C1C1E", borderColor: "#2C2C2E", borderRadius: "12px", color: "#fff" }} formatter={(v: number) => [`${v} MOA`, "Group"]} />
              <Area type="monotone" dataKey="group" stroke="#32D74B" strokeWidth={2} fill="url(#groupGrad)" dot={{ r: 3, fill: "#32D74B" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

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

      {/* AI Insights */}
      <div className="ios-card space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">LevelUP AI</h3>
            <p className="text-[10px] text-textSecondary">Powered by Gemini • Ask your data anything</p>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            "Which lot should I buy more of?",
            "Is my SD trending up?",
            "Best tuner setting?",
            "Temp sensitivity?",
          ].map((q) => (
            <button key={q} onClick={() => setAiPrompt(q)}
              className="shrink-0 text-[11px] font-medium bg-[#2C2C2E] rounded-full px-3 py-1.5 text-textSecondary active:scale-95 transition-transform">
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            className="ios-input flex-1 text-sm"
            placeholder="Ask about your data..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askAI()}
          />
          <button onClick={askAI} disabled={aiLoading || !aiPrompt.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform shrink-0">
            {aiLoading ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Send className="w-4 h-4 text-black" />}
          </button>
        </div>

        {/* Response */}
        {aiResponse && (
          <div className="bg-[#0A0A0A] rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap border border-[#2C2C2E]">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[10px] text-green-500 font-semibold uppercase tracking-wider">AI Analysis</span>
            </div>
            {aiResponse}
          </div>
        )}
      </div>
    </main>
  );
}
