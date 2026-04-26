"use client";

import { useState, useEffect } from "react";
import {
  Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle,
  Wind, Droplets, Gauge, MapPin, RefreshCw, Loader2, Mountain, Thermometer
} from "lucide-react";

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  windDirection: string;
  pressure: number;
  condition: string;
  icon: string;
  elevation: number;
  densityAltitude: number;
  location: string;
  source: string;
}

function getWeatherIcon(icon: string) {
  if (icon.includes("01")) return <Sun className="w-7 h-7 text-yellow-400" />;
  if (icon.includes("02") || icon.includes("03") || icon.includes("04")) return <Cloud className="w-7 h-7 text-gray-400" />;
  if (icon.includes("09") || icon.includes("10")) return <CloudRain className="w-7 h-7 text-blue-400" />;
  if (icon.includes("11")) return <CloudLightning className="w-7 h-7 text-yellow-500" />;
  if (icon.includes("13")) return <CloudSnow className="w-7 h-7 text-blue-200" />;
  return <Cloud className="w-7 h-7 text-gray-400" />;
}

function windDegToClock(deg: number): string {
  // Convert meteorological wind direction to clock face
  // 0°=12, 90°=3, 180°=6, 270°=9
  const clock = Math.round(deg / 30) || 12;
  return `${clock > 12 ? clock - 12 : clock} o'clock`;
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Location not available");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          if (data.error) {
            setError(data.error);
          } else {
            setWeather(data.data);
            setLastUpdated(new Date());
          }
        } catch {
          setError("Failed to fetch weather");
        } finally {
          setLoading(false);
        }
      },
      () => {
        // Fallback: fetch with default coords (mock mode)
        fetch("/api/weather?lat=36.5&lon=-82.5")
          .then((r) => r.json())
          .then((data) => {
            if (data.data) {
              setWeather(data.data);
              setLastUpdated(new Date());
            }
          })
          .catch(() => setError("Location denied"))
          .finally(() => setLoading(false));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  if (loading && !weather) {
    return (
      <div className="ios-card flex items-center justify-center py-6 gap-3">
        <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
        <span className="text-sm text-textSecondary">Getting range conditions...</span>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="ios-card py-4 text-center space-y-2">
        <p className="text-xs text-textSecondary">{error}</p>
        <button onClick={fetchWeather} className="text-xs text-primary font-semibold">Retry</button>
      </div>
    );
  }

  if (!weather) return null;

  const daColor = weather.densityAltitude > 5000 ? "text-red-400" :
    weather.densityAltitude > 3000 ? "text-yellow-400" : "text-green-400";

  return (
    <div className="ios-card space-y-3 border border-[#2C2C2E] bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-white tracking-wide">Weather Where You Are</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3 h-3 text-green-400" />
            <span className="text-[10px] text-textSecondary">{weather.location}</span>
            {weather.source === "mock" && (
              <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">DEMO</span>
            )}
          </div>
        </div>
        <button
          onClick={fetchWeather}
          className="w-7 h-7 rounded-full bg-[#2C2C2E] flex items-center justify-center active:scale-90 transition-transform"
          disabled={loading}
        >
          <RefreshCw className={`w-3 h-3 text-textSecondary ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Main temp + condition */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.icon)}
          <div>
            <p className="text-3xl font-bold tracking-tight">{weather.temp}°<span className="text-lg text-textSecondary">F</span></p>
            <p className="text-xs text-textSecondary capitalize">{weather.condition}</p>
          </div>
        </div>

        {/* Density Altitude — the hero metric */}
        <div className="text-right">
          <p className="text-[9px] text-textSecondary uppercase tracking-wider font-semibold">Density Alt</p>
          <p className={`text-2xl font-black font-mono ${daColor}`}>
            {weather.densityAltitude.toLocaleString()}
            <span className="text-xs font-normal text-textSecondary"> ft</span>
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#0A0A0A] rounded-lg py-2 text-center">
          <Wind className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-0.5" />
          <p className="text-xs font-bold font-mono">{weather.windSpeed}</p>
          <p className="text-[8px] text-textSecondary">MPH {weather.windDirection}</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg py-2 text-center">
          <Droplets className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
          <p className="text-xs font-bold font-mono">{weather.humidity}%</p>
          <p className="text-[8px] text-textSecondary">Humidity</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg py-2 text-center">
          <Gauge className="w-3.5 h-3.5 text-purple-400 mx-auto mb-0.5" />
          <p className="text-xs font-bold font-mono">{weather.pressure}</p>
          <p className="text-[8px] text-textSecondary">hPa</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg py-2 text-center">
          <Mountain className="w-3.5 h-3.5 text-orange-400 mx-auto mb-0.5" />
          <p className="text-xs font-bold font-mono">{weather.elevation.toLocaleString()}</p>
          <p className="text-[8px] text-textSecondary">Elev ft</p>
        </div>
      </div>

      {/* Timestamp */}
      {lastUpdated && (
        <p className="text-[9px] text-textSecondary/40 text-center">
          Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
