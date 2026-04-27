// ============================================================
// SequencingOverlay — Theatrical DNA sequencing animation
//
// Shows a terminal-style text sequence when the user scans a
// data sheet or chrono screen. Each line types in one at a time,
// a progress bar fills beneath, and it resolves with
// "✓ SEQUENCE COMPLETE" before the real results appear.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";

interface SequencingOverlayProps {
  /** Whether the overlay is active */
  active: boolean;
  /** "scan" = data sheet, "chrono" = chronograph screen */
  mode: "scan" | "chrono";
  /** Called when the sequence finishes — parent can reveal results */
  onComplete: () => void;
  /** Total duration in ms (default 4000) */
  duration?: number;
}

const SCAN_LINES = [
  "INITIALIZING GEMINI VISION...",
  "DETECTING HANDWRITTEN FIELDS...",
  "ISOLATING VELOCITY CHARACTERISTICS...",
  "FILTERING ATMOSPHERIC NOISE...",
  "MAPPING LOT SIGNATURE MARKERS...",
  "CROSS-REFERENCING DNA PROFILES...",
  "SYNCING WITH BALLISTICS ENGINE...",
  "COMPILING SEQUENCE REPORT...",
];

const CHRONO_LINES = [
  "INITIALIZING GEMINI VISION...",
  "DETECTING CHRONOGRAPH DISPLAY...",
  "ISOLATING FPS READOUT...",
  "EXTRACTING SHOT STRING DATA...",
  "CALCULATING STANDARD DEVIATION...",
  "MAPPING VELOCITY SPREAD...",
  "SYNCING WITH BALLISTICS ENGINE...",
  "COMPILING SEQUENCE REPORT...",
];

export default function SequencingOverlay({
  active,
  mode,
  onComplete,
  duration = 4000,
}: SequencingOverlayProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const lines = mode === "scan" ? SCAN_LINES : CHRONO_LINES;
  const totalLines = lines.length;
  const lineInterval = duration / (totalLines + 1); // +1 for the final "COMPLETE" beat

  const reset = useCallback(() => {
    setVisibleLines(0);
    setProgress(0);
    setComplete(false);
    setFadeOut(false);
  }, []);

  useEffect(() => {
    if (!active) {
      reset();
      return;
    }

    // Progress bar animation (smooth fill)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 100 / (duration / 50);
      });
    }, 50);

    // Line reveal animation
    const lineTimer = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= totalLines) {
          clearInterval(lineTimer);
          return prev;
        }
        return prev + 1;
      });
    }, lineInterval);

    // Completion
    const completeTimer = setTimeout(() => {
      setComplete(true);
      setProgress(100);
    }, duration - 600);

    // Fade out + callback
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 200);

    const doneTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(lineTimer);
      clearTimeout(completeTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [active, duration, lineInterval, totalLines, onComplete, reset]);

  if (!active) return null;

  const accentColor = mode === "scan" ? "#4ade80" : "#a78bfa";

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        borderColor: `${accentColor}30`,
        background: "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)",
      }}
    >
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-black/40">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <span
          className="text-[10px] font-mono font-bold tracking-widest uppercase"
          style={{ color: accentColor }}
        >
          {mode === "scan" ? "SubsonicDNA — Sheet Sequencer" : "SubsonicDNA — Chrono Decoder"}
        </span>
      </div>

      {/* Terminal body */}
      <div className="px-4 py-3 space-y-1 font-mono text-[11px] min-h-[160px]">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="flex items-center gap-2">
            <span style={{ color: accentColor }} className="opacity-60">
              {">"}
            </span>
            <span
              className="tracking-wider"
              style={{
                color: i === visibleLines - 1 ? accentColor : "rgba(255,255,255,0.4)",
                transition: "color 0.3s ease",
              }}
            >
              {line}
            </span>
            {i === visibleLines - 1 && !complete && (
              <span
                className="inline-block w-1.5 h-3.5 animate-pulse"
                style={{ backgroundColor: accentColor }}
              />
            )}
          </div>
        ))}

        {/* Completion line */}
        {complete && (
          <div className="flex items-center gap-2 mt-2">
            <span style={{ color: accentColor }}>✓</span>
            <span
              className="font-bold tracking-widest"
              style={{ color: accentColor }}
            >
              SEQUENCE COMPLETE
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100 ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: accentColor,
              boxShadow: `0 0 8px ${accentColor}60`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
