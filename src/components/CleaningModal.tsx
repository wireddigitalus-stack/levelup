"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { CleaningEvent, CleaningType } from "@/lib/mockData";

interface CleaningModalProps {
  open: boolean;
  onClose: () => void;
  preselectedRifleId?: string;
}

const CLEANING_TYPES: { value: CleaningType; label: string; desc: string; emoji: string }[] = [
  { value: "quick_swab", label: "Quick Swab", desc: "BoreSnake / patch — minimal impact", emoji: "🧹" },
  { value: "deep_clean", label: "Deep Clean", desc: "Solvent soak + rod & patch — full reset", emoji: "🧪" },
  { value: "ultrasonic", label: "Ultrasonic", desc: "Nuclear option — complete barrel reset", emoji: "⚡" },
];

export default function CleaningModal({ open, onClose, preselectedRifleId }: CleaningModalProps) {
  const { rifles, addCleaning, shots } = useApp();

  const [selectedRifle, setSelectedRifle] = useState(preselectedRifleId || rifles[0]?.id || "");
  const [cleanType, setCleanType] = useState<CleaningType>("quick_swab");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const rifleShots = shots.filter((s) => s.rifleId === selectedRifle).length;

  const handleSubmit = () => {
    const cleaning: CleaningEvent = {
      id: `clean_${Date.now()}`,
      rifleId: selectedRifle,
      date: new Date().toISOString().split("T")[0],
      type: cleanType,
      method: method.trim() || undefined,
      notes: notes.trim() || undefined,
      shotCountAtClean: rifleShots,
    };

    addCleaning(cleaning);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setMethod("");
      setNotes("");
      onClose();
    }, 1500);
  };

  const selectedRifleObj = rifles.find((r) => r.id === selectedRifle);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1C1C1E] rounded-t-3xl p-5 pb-10 space-y-4 animate-[slideUp_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold">Log Barrel Cleaning</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center active:scale-90">
            <X className="w-4 h-4 text-textSecondary" />
          </button>
        </div>

        {/* Rifle selector */}
        <div>
          <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
            Rifle
          </label>
          <select
            className="ios-input appearance-none bg-black text-sm w-full"
            value={selectedRifle}
            onChange={(e) => setSelectedRifle(e.target.value)}
          >
            {rifles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.make} {r.model} — {r.barrelLength}
              </option>
            ))}
          </select>
          {selectedRifleObj && (
            <p className="text-xs text-textSecondary mt-1 ml-1">
              {rifleShots} total shots logged on this barrel
            </p>
          )}
        </div>

        {/* Cleaning type */}
        <div>
          <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block">
            Cleaning Type
          </label>
          <div className="space-y-2">
            {CLEANING_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setCleanType(ct.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  cleanType === ct.value
                    ? "bg-cyan-500/10 border border-cyan-500/30"
                    : "bg-[#0A0A0A] border border-transparent"
                }`}
              >
                <span className="text-lg">{ct.emoji}</span>
                <div>
                  <p className={`text-sm font-semibold ${cleanType === ct.value ? "text-cyan-400" : "text-white"}`}>
                    {ct.label}
                  </p>
                  <p className="text-xs text-textSecondary">{ct.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Method + Notes */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
              Method (optional)
            </label>
            <input
              type="text"
              className="ios-input bg-black text-sm w-full"
              placeholder="e.g. BoreSnake 2 passes"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5 block">
              Notes (optional)
            </label>
            <input
              type="text"
              className="ios-input bg-black text-sm w-full"
              placeholder="e.g. Heavy copper after 800 rounds"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        {success ? (
          <div className="w-full py-3 rounded-xl bg-green-500/20 text-green-400 font-bold text-sm text-center flex items-center justify-center gap-2">
            ✓ Cleaning Logged — Counter Reset
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white active:scale-[0.97] transition-all shadow-lg shadow-cyan-500/20"
          >
            Log Cleaning
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
