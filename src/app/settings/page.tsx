"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Crosshair, Ruler, Thermometer, Target,
  Bluetooth, Bell, Shield, Moon, Info, Wifi, WifiOff, Check, Loader2, Radio,
  MapPin, Mountain, Eye, EyeOff, Download, Trash2, Database, Smartphone
} from "lucide-react";
import { clsx } from "clsx";
import PageHeader from "@/components/layout/PageHeader";

interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  signal: number; // 0-100
  status: "discovered" | "pairing" | "connected" | "failed";
}

const DEMO_DEVICES: Omit<DeviceInfo, "status">[] = [
  { id: "garmin-xero", name: "Garmin Xero C1 Pro", type: "Chronograph", signal: 92 },
  { id: "kestrel-5700", name: "Kestrel 5700 Elite", type: "Weather Meter", signal: 78 },
  { id: "labradar-lx", name: "LabRadar LX", type: "Doppler Chrono", signal: 64 },
  { id: "magnetospeed-v3", name: "MagnetoSpeed V3", type: "Barrel Chrono", signal: 41 },
];

export default function SettingsPage() {
  const [units, setUnits] = useState<"imperial" | "metric">("imperial");
  const [defaultZero, setDefaultZero] = useState(50);
  const [targetSize, setTargetSize] = useState(1.0);
  const [dropUnit, setDropUnit] = useState<"moa" | "mil">("moa");
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  // Device pairing state machine
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done">("idle");
  const [discoveredDevices, setDiscoveredDevices] = useState<DeviceInfo[]>([]);
  const [scanPulse, setScanPulse] = useState(0);

  // Animated scan pulse counter
  useEffect(() => {
    if (scanState !== "scanning") return;
    const interval = setInterval(() => setScanPulse((p) => p + 1), 150);
    return () => clearInterval(interval);
  }, [scanState]);

  const startScan = useCallback(() => {
    setScanState("scanning");
    setDiscoveredDevices([]);
    setScanPulse(0);

    // Stagger device discovery for realism
    DEMO_DEVICES.forEach((device, i) => {
      setTimeout(() => {
        setDiscoveredDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, { ...device, status: "discovered" }];
        });
      }, 1500 + i * 1200); // Each device appears 1.2s apart
    });

    // End scanning after all devices found
    setTimeout(() => setScanState("done"), 1500 + DEMO_DEVICES.length * 1200 + 800);
  }, []);

  const pairDevice = useCallback((deviceId: string) => {
    setDiscoveredDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, status: "pairing" } : d))
    );
    // Simulate pairing handshake
    setTimeout(() => {
      setDiscoveredDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, status: "connected" } : d))
      );
    }, 2000 + Math.random() * 1000);
  }, []);

  const [homeRange, setHomeRange] = useState("Kingsport Rifle & Pistol");
  const [elevation, setElevation] = useState("1200");
  const [defaultDA, setDefaultDA] = useState("2500");
  const [autoWeather, setAutoWeather] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [compactCards, setCompactCards] = useState(false);
  const [showCostData, setShowCostData] = useState(true);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={clsx(
        "w-12 h-7 rounded-full transition-colors relative shrink-0",
        value ? "bg-green-500" : "bg-[#3A3A3C]"
      )}
    >
      <div
        className={clsx(
          "w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform",
          value ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );

  const SignalBars = ({ strength }: { strength: number }) => (
    <div className="flex items-end gap-[2px] h-3">
      {[20, 40, 60, 80].map((threshold, i) => (
        <div
          key={i}
          className={clsx(
            "w-[3px] rounded-full transition-colors duration-300",
            strength >= threshold ? "bg-green-400" : "bg-[#3A3A3C]"
          )}
          style={{ height: `${40 + i * 20}%` }}
        />
      ))}
    </div>
  );

  return (
    <main className="p-4 max-w-md mx-auto space-y-6 pt-6 pb-36">
      {/* Scanning animation keyframes */}
      <style jsx global>{`
        @keyframes radar-ping {
          0% { transform: scale(0.3); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes radar-sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes device-enter {
          0% { opacity: 0; transform: translateY(12px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes shimmer-bar {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .radar-ping { animation: radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .radar-ping-delayed { animation: radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.6s; }
        .radar-ping-delayed-2 { animation: radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite 1.2s; }
        .radar-sweep { animation: radar-sweep 3s linear infinite; }
        .device-enter { animation: device-enter 0.5s ease-out forwards; }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        .shimmer-bar {
          background: linear-gradient(90deg, transparent, rgba(74,222,128,0.3), transparent);
          background-size: 200% 100%;
          animation: shimmer-bar 1.5s ease-in-out infinite;
        }
      `}</style>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-primary text-sm font-medium active:opacity-70"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      <header>
        <PageHeader title="Settings" subtitle="Precision preferences" />
      </header>

      {/* Ballistic Preferences */}
      <div className="ios-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Ballistic Defaults</h3>
          </div>
        </div>

        {/* Default Zero Range */}
        <div className="px-4 py-4 border-b border-[#2C2C2E]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-textSecondary" />
              <div>
                <p className="text-sm font-medium">Default Zero Range</p>
                <p className="text-xs text-textSecondary">Used for dope card generation</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((z) => (
              <button
                key={z}
                onClick={() => setDefaultZero(z)}
                className={clsx(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                  defaultZero === z
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black"
                    : "bg-[#2C2C2E] text-textSecondary"
                )}
              >
                {z}y
              </button>
            ))}
          </div>
        </div>

        {/* Target Size for Hit Probability */}
        <div className="px-4 py-4 border-b border-[#2C2C2E]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-textSecondary" />
              <div>
                <p className="text-sm font-medium">Hit Probability Target</p>
                <p className="text-xs text-textSecondary">Target size for confidence calculation</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { label: '0.5"', value: 0.5 },
              { label: '1.0"', value: 1.0 },
              { label: '1.5"', value: 1.5 },
              { label: '2.0"', value: 2.0 },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTargetSize(t.value)}
                className={clsx(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                  targetSize === t.value
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black"
                    : "bg-[#2C2C2E] text-textSecondary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drop Unit */}
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Ruler className="w-4 h-4 text-textSecondary" />
              <div>
                <p className="text-sm font-medium">Adjustment Unit</p>
                <p className="text-xs text-textSecondary">Scope turret click values</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { label: "MOA", value: "moa" as const },
              { label: "MIL", value: "mil" as const },
            ].map((u) => (
              <button
                key={u.value}
                onClick={() => setDropUnit(u.value)}
                className={clsx(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                  dropUnit === u.value
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black"
                    : "bg-[#2C2C2E] text-textSecondary"
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Units & Display */}
      <div className="ios-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Units &amp; Display</h3>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-[#2C2C2E]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Ruler className="w-4 h-4 text-textSecondary" />
              <p className="text-sm font-medium">Distance &amp; Velocity</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { label: "Imperial (yds/fps)", value: "imperial" as const },
              { label: "Metric (m/mps)", value: "metric" as const },
            ].map((u) => (
              <button
                key={u.value}
                onClick={() => setUnits(u.value)}
                className={clsx(
                  "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                  units === u.value
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black"
                    : "bg-[#2C2C2E] text-textSecondary"
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <Thermometer className="w-4 h-4 text-textSecondary" />
              <p className="text-sm font-medium">Temperature</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { label: "°F", value: "F" as const },
              { label: "°C", value: "C" as const },
            ].map((u) => (
              <button
                key={u.value}
                onClick={() => setTempUnit(u.value)}
                className={clsx(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                  tempUnit === u.value
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black"
                    : "bg-[#2C2C2E] text-textSecondary"
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Connectivity & Sync */}
      <div className="ios-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Connectivity</h3>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-[#2C2C2E] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bluetooth className="w-4 h-4 text-textSecondary" />
            <div>
              <p className="text-sm font-medium">Auto-Sync Cloud</p>
              <p className="text-xs text-textSecondary">Backup data to LevelUP Cloud</p>
            </div>
          </div>
          <Toggle value={autoSync} onChange={setAutoSync} />
        </div>

        <div className="px-4 py-4 border-b border-[#2C2C2E] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-textSecondary" />
            <div>
              <p className="text-sm font-medium">Notifications</p>
              <p className="text-xs text-textSecondary">Session reminders, lot alerts</p>
            </div>
          </div>
          <Toggle value={notifications} onChange={setNotifications} />
        </div>

        <div className="px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-textSecondary" />
            <div>
              <p className="text-sm font-medium">Haptic Feedback</p>
              <p className="text-xs text-textSecondary">Vibration on shot log</p>
            </div>
          </div>
          <Toggle value={hapticFeedback} onChange={setHapticFeedback} />
        </div>
      </div>

      {/* Device Pairing — Interactive Scanner */}
      <div className="ios-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Pair Devices</h3>
          </div>
          {scanState === "scanning" && (
            <span className="text-[10px] text-green-400 font-medium tracking-wider uppercase">
              Scanning...
            </span>
          )}
          {scanState === "done" && (
            <span className="text-[10px] text-textSecondary font-medium">
              {discoveredDevices.length} found
            </span>
          )}
        </div>

        {/* Radar Scanner Visual */}
        {scanState === "idle" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-2 border-[#2C2C2E]" />
              <div className="absolute inset-3 rounded-full border border-[#2C2C2E]" />
              <div className="absolute inset-6 rounded-full border border-[#2C2C2E]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Bluetooth className="w-6 h-6 text-[#3A3A3C]" />
              </div>
            </div>
            <p className="text-xs text-textSecondary text-center">
              Scan for nearby chronographs,<br />weather meters & accessories
            </p>
            <button
              onClick={startScan}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-black text-sm font-bold tracking-wide active:scale-95 transition-transform shadow-lg shadow-green-500/20"
            >
              Start Scan
            </button>
          </div>
        )}

        {scanState === "scanning" && (
          <div className="flex flex-col items-center py-6 space-y-4">
            {/* Animated radar with pulse rings */}
            <div className="relative w-28 h-28">
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full border border-green-400/30 radar-ping" />
              <div className="absolute inset-0 rounded-full border border-green-400/20 radar-ping-delayed" />
              <div className="absolute inset-0 rounded-full border border-green-400/10 radar-ping-delayed-2" />
              {/* Static rings */}
              <div className="absolute inset-0 rounded-full border border-green-400/10" />
              <div className="absolute inset-4 rounded-full border border-green-400/10" />
              <div className="absolute inset-8 rounded-full border border-green-400/10" />
              {/* Sweep line */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full relative radar-sweep">
                  <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-green-400 to-transparent origin-left -translate-y-1/2" />
                </div>
              </div>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center backdrop-blur-sm">
                  <Bluetooth className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>
            <p className="text-xs text-green-400/80 font-medium">
              Searching for Bluetooth devices...
            </p>
          </div>
        )}

        {scanState === "done" && discoveredDevices.length === 0 && (
          <div className="flex flex-col items-center py-6 space-y-3">
            <WifiOff className="w-8 h-8 text-textSecondary/40" />
            <p className="text-xs text-textSecondary">No devices found nearby</p>
            <button
              onClick={startScan}
              className="text-xs text-primary font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Discovered Devices List */}
        {discoveredDevices.length > 0 && (
          <div className="space-y-2">
            {discoveredDevices.map((device, idx) => (
              <div
                key={device.id}
                className="device-enter flex items-center justify-between bg-[#0A0A0A] rounded-xl px-4 py-3"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "relative w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-500",
                    device.status === "connected"
                      ? "bg-green-500/20"
                      : device.status === "pairing"
                      ? "bg-yellow-500/20"
                      : "bg-[#2C2C2E]"
                  )}>
                    {device.status === "connected" ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : device.status === "pairing" ? (
                      <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                    ) : (
                      <Bluetooth className="w-4 h-4 text-textSecondary" />
                    )}
                    {/* Connected pulse dot */}
                    {device.status === "connected" && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 pulse-dot" />
                    )}
                  </div>
                  <div>
                    <p className={clsx(
                      "text-sm font-medium transition-colors duration-300",
                      device.status === "connected" ? "text-white" : "text-textSecondary"
                    )}>
                      {device.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className={clsx(
                        "text-[10px] transition-colors duration-300",
                        device.status === "connected"
                          ? "text-green-400"
                          : device.status === "pairing"
                          ? "text-yellow-400"
                          : "text-textSecondary/60"
                      )}>
                        {device.status === "connected"
                          ? "Connected"
                          : device.status === "pairing"
                          ? "Pairing..."
                          : device.type}
                      </p>
                      {device.status !== "pairing" && (
                        <SignalBars strength={device.signal} />
                      )}
                      {device.status === "pairing" && (
                        <div className="h-1 w-16 rounded-full bg-[#2C2C2E] overflow-hidden">
                          <div className="h-full w-full shimmer-bar rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {device.status === "discovered" && (
                  <button
                    onClick={() => pairDevice(device.id)}
                    className="text-xs text-primary font-semibold px-3 py-1.5 rounded-lg bg-primary/10 active:scale-95 transition-transform"
                  >
                    Pair
                  </button>
                )}
                {device.status === "connected" && (
                  <span className="text-[10px] text-green-400/60 font-medium">
                    ✓ Linked
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rescan button */}
        {scanState === "done" && discoveredDevices.length > 0 && (
          <button
            onClick={startScan}
            className="w-full py-2 text-xs text-primary font-semibold rounded-lg active:bg-primary/5 transition-colors"
          >
            Scan Again
          </button>
        )}

        <p className="text-[10px] text-textSecondary/40 text-center">
          Demo mode • Simulated device discovery
        </p>
      </div>

      {/* Range & Environment */}
      <div className="ios-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Range &amp; Environment</h3>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-4 h-4 text-textSecondary" />
            <div>
              <p className="text-sm font-medium">Home Range</p>
              <p className="text-xs text-textSecondary">Auto-fills session location</p>
            </div>
          </div>
          <input
            className="w-full bg-[#0A0A0A] border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-textSecondary/30 mt-1"
            value={homeRange}
            onChange={(e) => setHomeRange(e.target.value)}
            placeholder="e.g. Kingsport Rifle & Pistol"
          />
        </div>

        <div className="px-4 py-4 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-3 mb-2">
            <Mountain className="w-4 h-4 text-textSecondary" />
            <div>
              <p className="text-sm font-medium">Range Elevation</p>
              <p className="text-xs text-textSecondary">Altitude for DA calculations (ft)</p>
            </div>
          </div>
          <input
            type="number"
            className="w-full bg-[#0A0A0A] border border-[#2C2C2E] rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500/50 transition-colors placeholder:text-textSecondary/30 mt-1"
            value={elevation}
            onChange={(e) => setElevation(e.target.value)}
            placeholder="1200"
          />
        </div>

        <div className="px-4 py-4 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-3 mb-2">
            <Thermometer className="w-4 h-4 text-textSecondary" />
            <div>
              <p className="text-sm font-medium">Default Density Altitude</p>
              <p className="text-xs text-textSecondary">Baseline DA for comparisons (ft)</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[1000, 2000, 2500, 3500, 5000].map((da) => (
              <button
                key={da}
                onClick={() => setDefaultDA(String(da))}
                className={clsx(
                  "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                  defaultDA === String(da)
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black"
                    : "bg-[#2C2C2E] text-textSecondary"
                )}
              >
                {da >= 1000 ? `${(da / 1000).toFixed(da % 1000 === 0 ? 0 : 1)}k` : da}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wifi className="w-4 h-4 text-textSecondary" />
            <div>
              <p className="text-sm font-medium">Auto-Fetch Weather</p>
              <p className="text-xs text-textSecondary">GPS weather at session start</p>
            </div>
          </div>
          <Toggle value={autoWeather} onChange={setAutoWeather} />
        </div>
      </div>

      {/* Display Preferences */}
      <div className="ios-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Display Preferences</h3>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-[#2C2C2E] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-textSecondary" />
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-textSecondary">Optimized for outdoor glare</p>
            </div>
          </div>
          <Toggle value={darkMode} onChange={setDarkMode} />
        </div>

        <div className="px-4 py-4 border-b border-[#2C2C2E] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Eye className="w-4 h-4 text-textSecondary" />
            <div>
              <p className="text-sm font-medium">Show Cost Data</p>
              <p className="text-xs text-textSecondary">Display $/round and investment</p>
            </div>
          </div>
          <Toggle value={showCostData} onChange={setShowCostData} />
        </div>

        <div className="px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Target className="w-4 h-4 text-textSecondary" />
            <div>
              <p className="text-sm font-medium">Compact Cards</p>
              <p className="text-xs text-textSecondary">Denser layout for more data</p>
            </div>
          </div>
          <Toggle value={compactCards} onChange={setCompactCards} />
        </div>
      </div>

      {/* Data Management */}
      <div className="ios-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Data Management</h3>
          </div>
        </div>

        <button className="w-full px-4 py-4 border-b border-[#2C2C2E] flex items-center gap-3 active:bg-white/5 transition-colors">
          <Download className="w-4 h-4 text-textSecondary" />
          <div className="text-left flex-1">
            <p className="text-sm font-medium">Export All Data</p>
            <p className="text-xs text-textSecondary">Download CSV of shots, lots &amp; sessions</p>
          </div>
          <span className="text-xs text-primary font-medium">.csv</span>
        </button>

        <button className="w-full px-4 py-4 border-b border-[#2C2C2E] flex items-center gap-3 active:bg-white/5 transition-colors">
          <Download className="w-4 h-4 text-textSecondary" />
          <div className="text-left flex-1">
            <p className="text-sm font-medium">Export Dope Cards</p>
            <p className="text-xs text-textSecondary">Generate PDF for all rifles</p>
          </div>
          <span className="text-xs text-primary font-medium">.pdf</span>
        </button>

        <button className="w-full px-4 py-4 flex items-center gap-3 active:bg-red-500/5 transition-colors">
          <Trash2 className="w-4 h-4 text-red-500/60" />
          <div className="text-left flex-1">
            <p className="text-sm font-medium text-red-400">Clear All Data</p>
            <p className="text-xs text-textSecondary">Permanently delete all local data</p>
          </div>
        </button>
      </div>

      {/* About */}
      <div className="ios-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">About</h3>
          </div>
        </div>
        <div className="px-4 py-3 flex justify-between items-center border-b border-[#2C2C2E]">
          <span className="text-sm text-textSecondary">Version</span>
          <span className="text-sm font-mono">1.0.0-beta</span>
        </div>
        <div className="px-4 py-3 flex justify-between items-center border-b border-[#2C2C2E]">
          <span className="text-sm text-textSecondary">Ballistic Engine</span>
          <span className="text-sm font-mono">G1 Rimfire v1</span>
        </div>
        <div className="px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-textSecondary">Data Storage</span>
          <span className="text-sm font-mono text-yellow-500">Local Only</span>
        </div>
      </div>
    </main>
  );
}
