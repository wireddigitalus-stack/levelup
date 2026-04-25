"use client";

import { useState, useRef, useCallback } from "react";
import {
  Bluetooth, Zap, Thermometer, Wind, Camera, X,
  ScanLine, Loader2, CheckCircle2, AlertTriangle, FileText, Crosshair
} from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/context/AppContext";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ScanResult {
  header: { rifle: string | null; date: string | null; temperature: number | null; windDirection: string | null; condition: string | null; windSpeed: number | null };
  ammo: { make: string | null; type: string | null; lotNumber: string | null; nickname: string | null };
  rounds: { round: number; distance: number | null; tunerSetting: number | null; velocityAvg: number | null; sd: number | null; es: number | null; groupSize: number | null; vSpread: number | null; hSpread: number | null; elevation: number | null; notes: string | null }[];
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
  const [groupPhoto, setGroupPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Scan Data Sheet state
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState("");

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
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-white font-extrabold">Level</span><span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent font-extrabold">UP</span>{" "}
          Log
        </h1>
        <p className="text-[11px] font-medium tracking-widest uppercase text-textSecondary/60 mt-0.5">
          Lot Evaluation & Velocity Error Logger
        </p>
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
            <p className="text-[11px] text-textSecondary">Photograph your handwritten sheet — Spotter reads it instantly</p>
          </div>
        </button>
      )}

      {scanState === "scanning" && (
        <div className="ios-card space-y-4">
          <div className="flex items-center gap-3">
            <Crosshair className="w-5 h-5 text-green-400 animate-spin" />
            <div>
              <p className="font-bold text-sm text-green-400">Spotter is Reading...</p>
              <p className="text-[10px] text-textSecondary">Extracting handwritten data via AI vision</p>
            </div>
          </div>
          {scanImage && (
            <div className="relative rounded-xl overflow-hidden">
              <img src={scanImage} alt="Scanned sheet" className="w-full h-48 object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-b from-green-400/10 to-transparent" />
              <div className="absolute left-0 right-0 h-[2px] bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)] scan-line-anim" />
            </div>
          )}
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
            <span className={clsx("text-[10px] font-bold uppercase tracking-wider", confidenceColor(scanResult.confidence))}>
              {scanResult.confidence} confidence
            </span>
          </div>

          {/* Extracted Header */}
          {(scanResult.header.rifle || scanResult.header.date) && (
            <div className="bg-[#0A0A0A] rounded-xl p-3 space-y-1">
              <p className="text-[10px] text-textSecondary font-bold uppercase tracking-wider mb-2">Session Info</p>
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
              <p className="text-[10px] text-textSecondary font-bold uppercase tracking-wider mb-2">Ammo</p>
              <p className="text-sm font-medium">
                {scanResult.ammo.make} {scanResult.ammo.type}
                {scanResult.ammo.lotNumber && <span className="text-textSecondary"> • Lot #{scanResult.ammo.lotNumber}</span>}
              </p>
            </div>
          )}

          {/* Extracted Rounds */}
          {scanResult.rounds.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-textSecondary font-bold uppercase tracking-wider">Rounds Data</p>
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
              <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider mb-1">⚠ OCR Warnings</p>
              {scanResult.warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-yellow-400/80">• {w}</p>
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

      {/* Hardware Sync Stubs */}
      <div className="grid grid-cols-2 gap-3">
        <button className="ios-card flex items-center justify-center gap-2 active:scale-95 transition-transform bg-[#1C1C1E] hover:bg-[#2C2C2E]">
          <Bluetooth className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Garmin Xero</span>
        </button>
        <button className="ios-card flex items-center justify-center gap-2 active:scale-95 transition-transform bg-[#1C1C1E] hover:bg-[#2C2C2E]">
          <Wind className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Kestrel 5700</span>
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
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block ml-1">
              Velocity (FPS)
            </label>
            <input
              type="number"
              pattern="[0-9]*"
              inputMode="numeric"
              className="ios-input font-mono text-xl py-4"
              placeholder="1050"
              value={muzzleVelocity}
              onChange={(e) => setMuzzleVelocity(e.target.value)}
            />
          </div>
          <div className="ios-card">
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 block ml-1">
              Tuner Setting
            </label>
            <input
              type="number"
              pattern="[0-9]*"
              inputMode="numeric"
              className="ios-input font-mono text-xl py-4"
              placeholder="0"
              value={tunerSetting}
              onChange={(e) => setTunerSetting(e.target.value)}
            />
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
              <span className="text-[10px] text-textSecondary/60">Tap to use camera or gallery</span>
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
