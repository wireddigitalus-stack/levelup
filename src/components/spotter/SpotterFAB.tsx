"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  Crosshair, X, Send, Loader2, Camera, Sparkles, ChevronDown,
  Target, BarChart3, ArrowRightLeft, Package, Settings, BookOpen,
  Calendar, User, Lightbulb, Zap
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/context/AppContext";

// Page-aware context and quick prompts
const PAGE_CONTEXT: Record<string, {
  context: string;
  prompts: { label: string; prompt: string }[];
  tip: string;
}> = {
  "/": {
    context: "The user is on the Dashboard — the main overview showing quick stats, top lot pairings, and recent session data.",
    prompts: [
      { label: "Best lot right now?", prompt: "Based on my data, which ammo lot is performing best overall? Consider SD, ES, and group size." },
      { label: "Session summary", prompt: "Give me a quick summary of my most recent shooting sessions — any trends or concerns?" },
      { label: "What should I test next?", prompt: "Based on my current data gaps, what should my next range session focus on?" },
    ],
    tip: "Tap any stat card to see detailed breakdowns. Spotter can analyze your full history.",
  },
  "/log": {
    context: "The user is on the Shot Logger — they're actively recording shots with muzzle velocity, conditions, and target photos.",
    prompts: [
      { label: "Analyze my target", prompt: "I just took a photo of my target group. Analyze it for group size, shot distribution pattern, and any signs of vertical stringing or wind drift." },
      { label: "Is this SD good?", prompt: "What SD should I expect from premium .22LR match ammo? How does my current lot compare?" },
      { label: "Cold bore shift?", prompt: "I'm noticing my first shot is always off. What's a normal cold bore shift for .22LR and how should I compensate?" },
    ],
    tip: "Log at least 10 shots per lot for statistically meaningful SD calculations.",
  },
  "/compare": {
    context: "The user is on the Head-to-Head Comparison page — comparing two ammo lots side by side.",
    prompts: [
      { label: "Which lot wins?", prompt: "Looking at my comparison data, which lot should I choose for competition and why?" },
      { label: "Is the difference significant?", prompt: "Are the performance differences between these lots statistically significant, or could it be random variation?" },
      { label: "Buy recommendation", prompt: "Based on my test results, should I invest in buying a case of my better-performing lot?" },
    ],
    tip: "Compare lots tested on the same day and conditions for the most accurate head-to-head.",
  },
  "/inventory": {
    context: "The user is viewing their Ammo Inventory — tracking lot numbers, quantities, purchase costs, and performance grades.",
    prompts: [
      { label: "Cost per MOA", prompt: "Rank my lots by cost-effectiveness — which lot gives me the best accuracy per dollar?" },
      { label: "Restock advice", prompt: "Based on my remaining inventory and performance data, which lots should I restock?" },
      { label: "Lot aging", prompt: "Does .22LR ammo performance change with age? Should I be concerned about my oldest lots?" },
    ],
    tip: "Track purchase price per box to let Spotter calculate your true cost-per-MOA.",
  },
  "/analytics": {
    context: "The user is on the Analytics dashboard — deep-diving into time-series velocity data, SD/ES trends, temperature sensitivity, and lot rankings.",
    prompts: [
      { label: "Temperature sensitivity", prompt: "Analyze my velocity data across different temperatures. How sensitive is my current lot to temperature changes?" },
      { label: "Barrel break-in trend", prompt: "Looking at my data over time, is my barrel still breaking in or has it stabilized?" },
      { label: "Predict match day", prompt: "If match day is 65°F with 60% humidity at 1,500ft elevation, which lot and tuner setting should I use?" },
    ],
    tip: "Filter by rifle to isolate barrel-specific performance patterns.",
  },
  "/dope": {
    context: "The user is on the Dope Card page — viewing trajectory tables with drop, wind drift, and energy at distance.",
    prompts: [
      { label: "Come-up at 200?", prompt: "What's my precise come-up at 200 yards with my current lot and zero? Include both MOA and MIL." },
      { label: "Transonic zone", prompt: "Where does my current load go transonic? How much accuracy degradation should I expect in the transonic zone?" },
      { label: "Wind call help", prompt: "I'm shooting at 150 yards with a 5 mph crosswind. What's my wind hold?" },
    ],
    tip: "Your dope card is auto-generated from your actual logged muzzle velocities — not book data.",
  },
  "/sessions": {
    context: "The user is viewing their Range Session history — past shooting sessions with dates, locations, conditions, and round counts.",
    prompts: [
      { label: "Session trends", prompt: "Are my groups getting tighter or wider over my last 5 sessions? What's the trend?" },
      { label: "Best conditions", prompt: "Looking at my session data, what weather conditions produce my best groups?" },
      { label: "Round count check", prompt: "How many total rounds have I put through each barrel? Is any barrel due for accuracy testing?" },
    ],
    tip: "Log conditions (temp, humidity, wind) every session for Spotter to find your sweet spot.",
  },
  "/settings": {
    context: "The user is in Settings — configuring zero range, units, device pairing, and preferences.",
    prompts: [
      { label: "Optimal zero range", prompt: "For .22LR ELR competition, should I zero at 50 or 100 yards? What are the pros and cons?" },
      { label: "MOA vs MIL", prompt: "I'm deciding between MOA and MIL turrets. What do most competitive rimfire shooters prefer and why?" },
      { label: "Tuner setup", prompt: "How do I properly set up and dial in a barrel tuner for .22LR? Give me a step-by-step process." },
    ],
    tip: "Configure your default zero range to match your competition rules.",
  },
  "/profile": {
    context: "The user is on their Profile page — viewing their shooter stats and rifle configurations.",
    prompts: [
      { label: "My shooting stats", prompt: "Give me an honest assessment of my shooting performance based on all available data. Where am I strong and where can I improve?" },
      { label: "Barrel life check", prompt: "Based on my round count and accuracy trends, how is my barrel holding up?" },
      { label: "Competition prep", prompt: "I have a match coming up. Give me a pre-match checklist and lot selection recommendation." },
    ],
    tip: "Keep your rifle profiles updated — barrel changes affect your ballistic data.",
  },
};

export default function SpotterFAB() {
  const pathname = usePathname();
  const { rifles, ammo, sessions, shots, getSD, getES, getAvgGroup, getGrade } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "spotter"; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pageConfig = PAGE_CONTEXT[pathname] || PAGE_CONTEXT["/"];

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Build data context for Spotter
  const buildContext = useCallback(() => {
    const lotStats = ammo.map((lot) => {
      const rifleId = rifles[0]?.id || "";
      const sd = getSD(lot.id);
      const es = getES(lot.id);
      const group = getAvgGroup(rifleId, lot.id);
      const grade = getGrade(rifleId, lot.id);
      return `• ${lot.brand} ${lot.model} Lot#${lot.lotNumber}: SD=${sd.toFixed(1)}, ES=${es.toFixed(1)}, Group=${group.toFixed(2)} MOA, Grade=${grade.grade} (${grade.score}/100)`;
    }).join("\n");

    const sessionSummary = sessions.slice(0, 5).map((s) => {
      const shotCount = shots.filter((sh) => sh.sessionId === s.id).length;
      return `• ${s.date}: ${s.location}, ${s.temperature}°F, ${shotCount} shots`;
    }).join("\n");

    return `CURRENT PAGE: ${pathname}
${pageConfig.context}

RIFLES: ${rifles.map((r) => `${r.make} ${r.model} (${r.barrelLength})`).join(", ")}

LOT PERFORMANCE:
${lotStats}

RECENT SESSIONS:
${sessionSummary}

TOTAL SHOTS LOGGED: ${shots.length}`;
  }, [pathname, pageConfig, ammo, rifles, sessions, shots, getSD, getES, getAvgGroup, getGrade]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsLoading(true);
    setShowTip(false);

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          context: buildContext(),
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev, { role: "spotter", text: `⚠️ ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "spotter", text: data.response }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "spotter", text: "⚠️ Connection error. Check your network." }]);
    } finally {
      setIsLoading(false);
    }
  }, [buildContext]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          "fixed z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all duration-300",
          "bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-500/30",
          "bottom-[100px] right-4",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Crosshair className="w-6 h-6 text-black" strokeWidth={2.5} />
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" style={{ animationDuration: "3s" }} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Spotter Drawer */}
      <div
        className={clsx(
          "fixed left-0 right-0 z-50 transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ bottom: "0px" }}
      >
        <div className="max-w-md mx-auto bg-[#1C1C1E] rounded-t-3xl border-t border-[#3A3A3C] overflow-hidden shadow-2xl flex flex-col"
          style={{ maxHeight: "80dvh", height: "80dvh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2C2C2E]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Crosshair className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Ask Spotter</h3>
                <p className="text-[10px] text-green-400 font-medium">Your ballistics analyst • AI-powered</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="w-4 h-4 text-textSecondary" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="overflow-y-auto px-4 py-4 space-y-4 flex-1 min-h-0">

            {/* Pro Tip — shown initially */}
            {showTip && messages.length === 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-green-400">SPOTTER PRO TIP</span>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">
                  {pageConfig.tip}
                </p>
              </div>
            )}

            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="text-center py-4 space-y-2">
                <Sparkles className="w-6 h-6 text-green-400 mx-auto" />
                <p className="text-xs text-textSecondary">
                  I&apos;m Spotter — your AI ballistics analyst.<br />
                  Ask me anything or use a quick prompt below.
                </p>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={clsx(
                  "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-gradient-to-r from-green-400 to-emerald-500 text-black font-medium rounded-br-md"
                    : "mr-auto bg-[#2C2C2E] text-white rounded-bl-md"
                )}
              >
                {msg.role === "spotter" && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Crosshair className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] text-green-400 font-bold">SPOTTER</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-[13px]">{msg.text}</div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="mr-auto bg-[#2C2C2E] rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-3 h-3 text-green-400 animate-spin" />
                  <span className="text-[10px] text-green-400 font-bold">SPOTTER</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 0 && (
            <div className="px-4 pb-3">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {pageConfig.prompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.prompt)}
                    className="shrink-0 px-3 py-2 rounded-full bg-[#2C2C2E] text-xs font-medium text-white border border-[#3A3A3C] active:scale-95 transition-transform hover:border-green-400/30"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 px-4 pt-2 border-t border-[#2C2C2E]" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)" }}>
            <div className="flex items-center gap-2 bg-[#0A0A0A] rounded-2xl px-4 py-2.5 border border-[#2C2C2E] focus-within:border-green-400/40 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Ask Spotter anything..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-textSecondary/40 outline-none"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  input.trim()
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 active:scale-90"
                    : "bg-[#2C2C2E]"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-black" />
                )}
              </button>
            </div>
            <p className="text-center text-[9px] text-textSecondary/30 mt-2">
              Powered by Gemini • Context-aware on every page
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
