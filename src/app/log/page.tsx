"use client";

import { useState, useRef, useCallback } from "react";
import {
  Bluetooth, Zap, Thermometer, Wind, Camera, X,
  ScanLine, Loader2, CheckCircle2, AlertTriangle, FileText, Crosshair, Gauge, Wifi, WifiOff
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/context/AppContext";
import PageHeader from "@/components/layout/PageHeader";
import SequencingOverlay from "@/components/SequencingOverlay";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ScanResult {
  header: { rifle: string | null; date: string | null; temperature: number | null; windDirection: string | null; condition: string | null; windSpeed: number | null };
  ammo: { make: string | null; type: string | null; lotNumber: string | null; nickname: string | null };
  rounds: { round: number; distance: number | null; tunerSetting: number | null; velocityAvg: number | null; sd: number | null; es: number | null; groupSize: number | null; vSpread: number | null; hSpread: number | null; elevation: number | null; notes: string | null }[];
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

interface ChronoResult {
  device: string;
  view: string;
  summary: { avgFps: number | null; sdFps: number | null; esFps: number | null; highFps: number | null; lowFps: number | null; shotCount: number | null };
  shots: { round: number; fps: number }[];
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

export default function LogShotPage() {
  const { rifles, ammo, sessions } = useApp();

  const [selectedRifle, setSelectedRifle] = useState(rifles[0]?.id || "");
  const [selectedAmmo, setSelectedAmmo] = useState(ammo[0]?.id || "");
  const [isColdBore, setIsColdBore] = useState(false);
  const [muzzleVelocity, setMuzzleVelocity] = useState("");
  const [tunerSetting, setTunerSetting] = useState("");
  const [vSpread, setVSpread] = useState("");
  const [hSpread, setHSpread] = useState("");
  const [elevation, setElevation] = useState("");
  const [elevationUnit, setElevationUnit] = useState<"moa"|"mil">("moa");
  const [windSpeed, setWindSpeed] = useState("");
  const [windDirection, setWindDirection] = useState("");
  const [roundNotes, setRoundNotes] = useState(["" ,"", "", "", ""]);
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Scan Data Sheet state
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState("");
  const [scanSequencing, setScanSequencing] = useState(false);

  // Snap Chrono state
  const chronoInputRef = useRef<HTMLInputElement>(null);
  const [chronoState, setChronoState] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [chronoImage, setChronoImage] = useState<string | null>(null);
  const [chronoResult, setChronoResult] = useState<ChronoResult | null>(null);
  const [chronoError, setChronoError] = useState("");
  const [chronoSequencing, setChronoSequencing] = useState(false);

  // Mock Bluetooth state
  type BtState = "idle" | "scanning" | "connecting" | "synced";
  const [garminState, setGarminState] = useState<BtState>("idle");
  const [kestrelState, setKestrelState] = useState<BtState>("idle");
  const [garminData, setGarminData] = useState<{fps: number; sd: number; es: number; shots: number} | null>(null);
  const [kestrelData, setKestrelData] = useState<{temp: number; humidity: number; wind: number; da: number} | null>(null);

  const mockGarminSync = () => {
    if (garminState !== "idle") return;
    setGarminState("scanning");
    setGarminData(null);
    setTimeout(() => setGarminState("connecting"), 1500);
    setTimeout(() => {
      setGarminData({ fps: 1058, sd: 8, es: 22, shots: 5 });
      setMuzzleVelocity("1058");
      setGarminState("synced");
    }, 3200);
    setTimeout(() => setGarminState("idle"), 8000);
  };

  const mockKestrelSync = () => {
    if (kestrelState !== "idle") return;
    setKestrelState("scanning");
    setKestrelData(null);
    setTimeout(() => setKestrelState("connecting"), 1800);
    setTimeout(() => {
      setKestrelData({ temp: 72, humidity: 45, wind: 6, da: 1250 });
      setWindSpeed("6");
      setKestrelState("synced");
    }, 3500);
    setTimeout(() => setKestrelState("idle"), 8000);
  };

  const latestSession = sessions[0];

  const getTransonicDistance = (mv: string) => {
    const v = parseInt(mv);
    if (!v || v < 900) return null;
    return v - 900;
  };

  const transonicDistance = getTransonicDistance(muzzleVelocity);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setGroupPhoto(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageData = ev.target?.result as string;
      setScanImage(imageData);
      setScanState("scanning");
      setScanSequencing(true);
      setScanError("");
      setScanResult(null);

      try {
        const res = await fetch("/api/scan-sheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageData }),
        });
        const data = await res.json();
        if (data.error) {
          setScanState("error");
          setScanError(data.error);
        } else {
          setScanResult(data.data);
          setScanState("done");
        }
      } catch {
        setScanState("error");
        setScanError("Network error — check your connection.");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleChronoCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imageData = ev.target?.result as string;
      setChronoImage(imageData);
      setChronoState("reading");
      setChronoSequencing(true);
      setChronoError("");
      setChronoResult(null);
      try {
        const res = await fetch("/api/read-chrono", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageData }),
        });
        const data = await res.json();
        if (data.error) {
          setChronoState("error");
          setChronoError(data.error);
        } else {
          setChronoResult(data.data);
          setChronoState("done");
        }
      } catch {
        setChronoState("error");
        setChronoError("Network error — check your connection.");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const applyChronoData = () => {
    if (!chronoResult) return;
    if (chronoResult.summary.avgFps) setMuzzleVelocity(String(chronoResult.summary.avgFps));
    setChronoState("idle");
    setChronoResult(null);
    setChronoImage(null);
  };

  const confidenceColor = (c: string) =>
    c === "high" ? "text-green-400" : c === "medium" ? "text-yellow-400" : "text-red-400";

  return (
    <main className="p-4 max-w-md mx-auto space-y-6 pt-8">
      <style jsx global>{`
        @keyframes scan-line {
          0% { top: 0%; }
          50% { top: 90%; }
          100% { top: 0%; }
        }
        .scan-line-anim { animation: scan-line 2s ease-in-out infinite; }
      `}</style>

      <header className="mb-6">
        <PageHeader title="Log" />
        {latestSession && (
          <p className="text-textSecondary text-sm mt-1">
            Session: {latestSession.location} • {latestSession.temperature}°F
          </p>
        )}
      </header>

      {/* ========== SCAN DATA SHEET ========== */}
      <input ref={scanInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanCapture} />

      {scanState === "idle" && (
        <button
          onClick={() => scanInputRef.current?.click()}
          className="w-full ios-card flex items-center gap-4 active:scale-[0.98] transition-transform border border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0">
            <ScanLine className="w-6 h-6 text-black" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">Scan Data Sheet</p>
            <p className="text-xs text-textSecondary">Photograph your handwritten sheet — Spotter reads it instantly</p>
          </div>
        </button>
      )}

      {(scanState === "scanning" || scanSequencing) && (
        <div className="space-y-4">
          {scanImage && (
            <div className="ios-card">
              <div className="relative rounded-xl overflow-hidden">
                <img src={scanImage} alt="Scanned sheet" className="w-full h-48 object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-green-400/10 to-transparent" />
                <div className="absolute left-0 right-0 h-[2px] bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)] scan-line-anim" />
              </div>
            </div>
          )}
          <SequencingOverlay
            active={scanSequencing}
            mode="scan"
            duration={4200}
            onComplete={() => setScanSequencing(false)}
          />
        </div>
      )}

      {scanState === "error" && (
        <div className="ios-card space-y-3 border border-red-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm font-bold text-red-400">Scan Failed</p>
          </div>
          <p className="text-xs text-textSecondary">{scanError}</p>
          <button onClick={() => { setScanState("idle"); setScanImage(null); }} className="text-xs text-primary font-semibold">Try Again</button>
        </div>
      )}

      {scanState === "done" && scanResult && (
        <div className="ios-card space-y-4 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="font-bold text-sm">Sheet Scanned</p>
            </div>
            <span className={clsx("text-xs font-bold uppercase tracking-wider", confidenceColor(scanResult.confidence))}>
              {scanResult.confidence} confidence
            </span>
          </div>

          {/* Extracted Header */}
          {(scanResult.header.rifle || scanResult.header.date) && (
            <div className="bg-[#0A0A0A] rounded-xl p-3 space-y-1">
              <p className="text-xs text-textSecondary font-bold uppercase tracking-wider mb-2">Session Info</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {scanResult.header.rifle && <p><span className="text-textSecondary">Rifle:</span> {scanResult.header.rifle}</p>}
                {scanResult.header.date && <p><span className="text-textSecondary">Date:</span> {scanResult.header.date}</p>}
                {scanResult.header.temperature && <p><span className="text-textSecondary">Temp:</span> {scanResult.header.temperature}°F</p>}
                {scanResult.header.windSpeed && <p><span className="text-textSecondary">Wind:</span> {scanResult.header.windSpeed} mph {scanResult.header.windDirection || ""}</p>}
              </div>
            </div>
          )}

          {/* Extracted Ammo */}
          {(scanResult.ammo.make || scanResult.ammo.lotNumber) && (
            <div className="bg-[#0A0A0A] rounded-xl p-3">
              <p className="text-xs text-textSecondary font-bold uppercase tracking-wider mb-2">Ammo</p>
              <p className="text-sm font-medium">
                {scanResult.ammo.make} {scanResult.ammo.type}
                {scanResult.ammo.lotNumber && <span className="text-textSecondary"> • Lot #{scanResult.ammo.lotNumber}</span>}
              </p>
            </div>
          )}

          {/* Extracted Rounds */}
          {scanResult.rounds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-textSecondary font-bold uppercase tracking-wider">Rounds Data</p>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-textSecondary/60 border-b border-[#2C2C2E]">
                      <th className="py-1.5 px-2 text-left font-medium">Rnd</th>
                      <th className="py-1.5 px-2 text-right font-medium">Vel</th>
                      <th className="py-1.5 px-2 text-right font-medium">SD</th>
                      <th className="py-1.5 px-2 text-right font-medium">ES</th>
                      <th className="py-1.5 px-2 text-right font-medium">Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanResult.rounds.map((r) => (
                      <tr key={r.round} className="border-b border-[#2C2C2E]/50">
                        <td className="py-1.5 px-2 font-mono text-green-400">{r.round}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{r.velocityAvg ?? "—"}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{r.sd ?? "—"}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{r.es ?? "—"}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{r.groupSize ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warnings */}
          {scanResult.warnings.length > 0 && (
            <div className="bg-yellow-500/10 rounded-xl p-3">
              <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider mb-1">⚠ OCR Warnings</p>
              {scanResult.warnings.map((w, i) => (
                <p key={i} className="text-xs text-yellow-400/80">• {w}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-black text-sm font-bold active:scale-95 transition-transform">
              Import Data
            </button>
            <button
              onClick={() => { setScanState("idle"); setScanResult(null); setScanImage(null); }}
              className="px-4 py-2.5 rounded-xl bg-[#2C2C2E] text-sm font-medium text-textSecondary active:scale-95 transition-transform"
            >
              Rescan
            </button>
          </div>
        </div>
      )}

      {/* ========== SNAP CHRONO ========== */}
      <input ref={chronoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChronoCapture} />

      {chronoState === "idle" && (
        <button
          onClick={() => chronoInputRef.current?.click()}
          className="w-full ios-card flex items-center gap-4 active:scale-[0.98] transition-transform border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-violet-500/5"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center shrink-0">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">Snap Chrono</p>
            <p className="text-xs text-textSecondary">Photograph your Garmin / LabRadar screen — AI reads the FPS</p>
          </div>
        </button>
      )}

      {(chronoState === "reading" || chronoSequencing) && (
        <div className="space-y-4">
          {chronoImage && (
            <div className="ios-card">
              <div className="relative rounded-xl overflow-hidden">
                <img src={chronoImage} alt="Chrono screen" className="w-full h-48 object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-purple-400/10 to-transparent" />
                <div className="absolute left-0 right-0 h-[2px] bg-purple-400 shadow-[0_0_12px_rgba(167,139,250,0.8)] scan-line-anim" />
              </div>
            </div>
          )}
          <SequencingOverlay
            active={chronoSequencing}
            mode="chrono"
            duration={3800}
            onComplete={() => setChronoSequencing(false)}
          />
        </div>
      )}

      {chronoState === "error" && (
        <div className="ios-card space-y-3 border border-red-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm font-bold text-red-400">Chrono Read Failed</p>
          </div>
          <p className="text-xs text-textSecondary">{chronoError}</p>
          <button onClick={() => { setChronoState("idle"); setChronoImage(null); }} className="text-xs text-primary font-semibold">Try Again</button>
        </div>
      )}

      {chronoState === "done" && chronoResult && (
        <div className="ios-card space-y-4 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              <p className="font-bold text-sm">Chrono Read Complete</p>
            </div>
            <span className={clsx("text-xs font-bold uppercase tracking-wider", confidenceColor(chronoResult.confidence))}>
              {chronoResult.confidence} confidence
            </span>
          </div>

          {/* Device & View */}
          <div className="bg-[#0A0A0A] rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-textSecondary">Device Detected</p>
              <p className="text-sm font-medium">{chronoResult.device}</p>
            </div>
            <span className="text-xs text-textSecondary bg-[#2C2C2E] px-2 py-0.5 rounded-full">{chronoResult.view.replace("_", " ")}</span>
          </div>

          {/* Summary Stats */}
          {(chronoResult.summary.avgFps || chronoResult.summary.sdFps || chronoResult.summary.esFps) && (
            <div className="grid grid-cols-3 gap-2">
              {chronoResult.summary.avgFps && (
                <div className="bg-[#0A0A0A] rounded-xl py-2 text-center">
                  <p className="text-lg font-bold font-mono text-purple-400">{chronoResult.summary.avgFps}</p>
                  <p className="text-[9px] text-textSecondary">Avg FPS</p>
                </div>
              )}
              {chronoResult.summary.sdFps && (
                <div className="bg-[#0A0A0A] rounded-xl py-2 text-center">
                  <p className="text-lg font-bold font-mono text-green-400">{chronoResult.summary.sdFps}</p>
                  <p className="text-[9px] text-textSecondary">SD</p>
                </div>
              )}
              {chronoResult.summary.esFps && (
                <div className="bg-[#0A0A0A] rounded-xl py-2 text-center">
                  <p className="text-lg font-bold font-mono text-yellow-400">{chronoResult.summary.esFps}</p>
                  <p className="text-[9px] text-textSecondary">ES</p>
                </div>
              )}
            </div>
          )}

          {/* Individual Shots */}
          {chronoResult.shots.length > 0 && (
            <div className="bg-[#0A0A0A] rounded-xl p-3">
              <p className="text-xs text-textSecondary font-bold uppercase tracking-wider mb-2">Shot String</p>
              <div className="flex flex-wrap gap-2">
                {chronoResult.shots.map((s) => (
                  <div key={s.round} className="flex items-center gap-1.5 bg-[#1C1C1E] rounded-lg px-2.5 py-1.5">
                    <span className="text-[9px] text-purple-400 font-bold">#{s.round}</span>
                    <span className="text-xs font-mono font-medium">{s.fps}</span>
                    <span className="text-[9px] text-textSecondary">fps</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {chronoResult.warnings.length > 0 && (
            <div className="bg-yellow-500/10 rounded-xl p-3">
              <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider mb-1">⚠ Read Warnings</p>
              {chronoResult.warnings.map((w, i) => (
                <p key={i} className="text-xs text-yellow-400/80">• {w}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={applyChronoData} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-violet-500 text-white text-sm font-bold active:scale-95 transition-transform">
              Apply to Log
            </button>
            <button
              onClick={() => { setChronoState("idle"); setChronoResult(null); setChronoImage(null); }}
              className="px-4 py-2.5 rounded-xl bg-[#2C2C2E] text-sm font-medium text-textSecondary active:scale-95 transition-transform"
            >
              Retake
            </button>
          </div>
        </div>
      )}

      {/* Hardware Sync */}
      <div className="grid grid-cols-2 gap-3">
        {/* Garmin Xero */}
        <button onClick={mockGarminSync} className={`ios-card flex flex-col items-center gap-2 active:scale-95 transition-all relative overflow-hidden ${
          garminState === "synced" ? "border border-green-500/30 bg-green-500/5" :
          garminState !== "idle" ? "border border-blue-500/30 bg-blue-500/5" :
          "bg-[#1C1C1E] hover:bg-[#2C2C2E]"
        }`}>
          <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 z-20">Demo</span>
          {garminState === "scanning" && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent animate-pulse" />}
          <div className="flex items-center gap-2 relative z-10">
            {garminState === "idle" && <Bluetooth className="w-4 h-4 text-primary" />}
            {garminState === "scanning" && <Bluetooth className="w-4 h-4 text-blue-400 animate-pulse" />}
            {garminState === "connecting" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
            {garminState === "synced" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
            <span className="text-sm font-medium">Garmin Xero</span>
          </div>
          <span className="text-[9px] text-textSecondary relative z-10">
            {garminState === "idle" && "Tap to sync"}
            {garminState === "scanning" && "Scanning..."}
            {garminState === "connecting" && "Connecting..."}
            {garminState === "synced" && "✓ Synced"}
          </span>
          {garminState === "synced" && garminData && (
            <div className="text-[9px] text-green-400/80 font-mono relative z-10">
              {garminData.fps} fps • SD {garminData.sd}
            </div>
          )}
        </button>

        {/* Kestrel 5700 */}
        <button onClick={mockKestrelSync} className={`ios-card flex flex-col items-center gap-2 active:scale-95 transition-all relative overflow-hidden ${
          kestrelState === "synced" ? "border border-green-500/30 bg-green-500/5" :
          kestrelState !== "idle" ? "border border-cyan-500/30 bg-cyan-500/5" :
          "bg-[#1C1C1E] hover:bg-[#2C2C2E]"
        }`}>
          <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 z-20">Demo</span>
          {kestrelState === "scanning" && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-pulse" />}
          <div className="flex items-center gap-2 relative z-10">
            {kestrelState === "idle" && <Wind className="w-4 h-4 text-primary" />}
            {kestrelState === "scanning" && <Wifi className="w-4 h-4 text-cyan-400 animate-pulse" />}
            {kestrelState === "connecting" && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
            {kestrelState === "synced" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
            <span className="text-sm font-medium">Kestrel 5700</span>
          </div>
          <span className="text-[9px] text-textSecondary relative z-10">
            {kestrelState === "idle" && "Tap to sync"}
            {kestrelState === "scanning" && "Scanning..."}
            {kestrelState === "connecting" && "Pairing..."}
            {kestrelState === "synced" && "✓ Synced"}
          </span>
          {kestrelState === "synced" && kestrelData && (
            <div className="text-[9px] text-green-400/80 font-mono relative z-10">
              {kestrelData.temp}°F • {kestrelData.wind}mph
            </div>
          )}
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div className="ios-card space-y-4">
          <div>
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block ml-1">
              Rifle Profile
            </label>
            <select
              className="ios-input appearance-none bg-black"
              value={selectedRifle}
              onChange={(e) => setSelectedRifle(e.target.value)}
            >
              {rifles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.make} {r.model} - {r.barrelLength}{" "}
                  {r.tunerType !== "None" ? `• ${r.tunerType}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block ml-1">
              Ammo Lot
            </label>
            <select
              className="ios-input appearance-none bg-black"
              value={selectedAmmo}
              onChange={(e) => setSelectedAmmo(e.target.value)}
            >
              {ammo.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.brand} {a.model} (Lot #{a.lotNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cold Bore Toggle */}
        <div className="ios-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center">
                <Thermometer className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Cold Bore Shot</p>
                <p className="text-xs text-textSecondary">Tag as first shot of session</p>
              </div>
            </div>
            <button
              onClick={() => setIsColdBore(!isColdBore)}
              className={clsx(
                "w-12 h-7 rounded-full transition-colors relative",
                isColdBore ? "bg-green-500" : "bg-[#3A3A3C]"
              )}
            >
              <div
                className={clsx(
                  "w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform",
                  isColdBore ? "translate-x-[22px]" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Numeric Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="ios-card">
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block ml-1">Velocity (FPS)</label>
            <input type="number" inputMode="numeric" className="ios-input font-mono text-xl py-4" placeholder="1050" value={muzzleVelocity} onChange={(e) => setMuzzleVelocity(e.target.value)} />
          </div>
          <div className="ios-card">
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block ml-1">Tuner Setting</label>
            <input type="number" inputMode="numeric" className="ios-input font-mono text-xl py-4" placeholder="0" value={tunerSetting} onChange={(e) => setTunerSetting(e.target.value)} />
          </div>
        </div>

        {/* V-Spread / H-Spread */}
        <div className="ios-card space-y-3">
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider ml-1">Group Spread (inches)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-textSecondary ml-1 block mb-1">V-Spread (Vertical)</label>
              <input type="number" step="0.01" inputMode="decimal" className="ios-input font-mono" placeholder="0.00" value={vSpread} onChange={(e) => setVSpread(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-textSecondary ml-1 block mb-1">H-Spread (Horizontal)</label>
              <input type="number" step="0.01" inputMode="decimal" className="ios-input font-mono" placeholder="0.00" value={hSpread} onChange={(e) => setHSpread(e.target.value)} />
            </div>
          </div>
          {vSpread && hSpread && Number(hSpread) > 0 && (
            <div className="bg-[#0A0A0A] rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-textSecondary">V/H Ratio</span>
              <span className={`text-sm font-bold font-mono ${Number(vSpread)/Number(hSpread) > 2 ? 'text-red-400' : Number(vSpread)/Number(hSpread) > 1.3 ? 'text-yellow-400' : 'text-green-400'}`}>
                {(Number(vSpread)/Number(hSpread)).toFixed(2)}x
              </span>
            </div>
          )}
        </div>

        {/* Elevation */}
        <div className="ios-card space-y-3">
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider ml-1">Elevation Dialed</h3>
          <div className="flex gap-3">
            <input type="number" step="0.25" inputMode="decimal" className="ios-input font-mono flex-1" placeholder="12.5" value={elevation} onChange={(e) => setElevation(e.target.value)} />
            <div className="flex bg-[#2C2C2E] rounded-lg overflow-hidden shrink-0">
              <button onClick={() => setElevationUnit("moa")} className={`px-3 py-2 text-xs font-bold transition-colors ${elevationUnit === 'moa' ? 'bg-green-500 text-black' : 'text-textSecondary'}`}>MOA</button>
              <button onClick={() => setElevationUnit("mil")} className={`px-3 py-2 text-xs font-bold transition-colors ${elevationUnit === 'mil' ? 'bg-green-500 text-black' : 'text-textSecondary'}`}>MIL</button>
            </div>
          </div>
        </div>

        {/* Wind */}
        <div className="ios-card space-y-3">
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider ml-1">Wind Conditions</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-textSecondary ml-1 block mb-1">Speed (MPH)</label>
              <input type="number" inputMode="numeric" className="ios-input font-mono" placeholder="0" value={windSpeed} onChange={(e) => setWindSpeed(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-textSecondary ml-1 block mb-1">Direction</label>
              <select className="ios-input bg-black appearance-none" value={windDirection} onChange={(e) => setWindDirection(e.target.value)}>
                <option value="">Select</option>
                {["12 o'clock","1 o'clock","2 o'clock","3 o'clock","4 o'clock","5 o'clock","6 o'clock","7 o'clock","8 o'clock","9 o'clock","10 o'clock","11 o'clock"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Per-Round Notes */}
        <div className="ios-card space-y-3">
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider ml-1">Per-Round Notes</h3>
          <p className="text-xs text-textSecondary/60 ml-1">Log observations for each round (e.g. Flier, Wind Gust, Clean)</p>
          <div className="space-y-2">
            {[1,2,3,4,5].map((rnd, i) => (
              <div key={rnd} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#2C2C2E] flex items-center justify-center text-xs font-bold text-green-400 shrink-0">{rnd}</span>
                <input className="ios-input text-xs flex-1" placeholder={`Round ${rnd} notes...`} value={roundNotes[i]} onChange={(e) => { const n = [...roundNotes]; n[i] = e.target.value; setRoundNotes(n); }} />
              </div>
            ))}
          </div>
        </div>

        {/* Group Photo Capture */}
        <div className="ios-card">
          <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-3 block ml-1">
            Target Photo
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoCapture}
          />
          {groupPhoto ? (
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={groupPhoto}
                alt="Group photo"
                className="w-full h-40 object-cover rounded-xl"
              />
              <button
                onClick={() => setGroupPhoto(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#2C2C2E] rounded-xl py-6 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center">
                <Camera className="w-5 h-5 text-textSecondary" />
              </div>
              <span className="text-sm text-textSecondary">Snap your group</span>
              <span className="text-xs text-textSecondary/60">Tap to use camera or gallery</span>
            </button>
          )}
        </div>

        {/* Transonic Barrier Widget */}
        {transonicDistance && (
          <div className="ios-card bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-green-900/30">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Transonic Barrier Estimated</p>
                <p className="text-2xl font-bold tracking-tight mt-1">
                  {transonicDistance}{" "}
                  <span className="text-sm font-normal text-textSecondary">yards</span>
                </p>
                <p className="text-xs text-textSecondary mt-2 leading-relaxed">
                  Based on MV of {muzzleVelocity} FPS, your bullet will likely drop below
                  900 FPS at this distance, destabilizing flight.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <button className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-black font-extrabold py-4 rounded-xl active:scale-95 transition-all text-lg shadow-lg shadow-green-500/20 mb-8">
        Log Shot
      </button>
    </main>
  );
}
