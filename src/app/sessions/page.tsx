"use client";

import { Calendar, MapPin, Thermometer, Droplets, Wind, ChevronRight, Target } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function SessionsPage() {
  const { sessions, ammo, rifles, getSessionShotData } = useApp();

  // Sort sessions newest first
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get unique ammo lots used in a session
  const getSessionLots = (sessionId: string) => {
    const sessionShots = getSessionShotData(sessionId);
    const lotIds = Array.from(new Set(sessionShots.map((s) => s.ammoId)));
    return lotIds
      .map((id) => ammo.find((a) => a.id === id))
      .filter(Boolean);
  };

  // Get unique rifles used in a session
  const getSessionRifles = (sessionId: string) => {
    const sessionShots = getSessionShotData(sessionId);
    const rifleIds = Array.from(new Set(sessionShots.map((s) => s.rifleId)));
    return rifleIds
      .map((id) => rifles.find((r) => r.id === id))
      .filter(Boolean);
  };

  return (
    <main className="p-4 max-w-md mx-auto space-y-6 pt-8 pb-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-white font-extrabold">Level</span><span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent font-extrabold">UP</span>{" "}
          Sessions
        </h1>
        <p className="text-[11px] font-medium tracking-widest uppercase text-textSecondary/60 mt-0.5">
          Lot Evaluation & Velocity Error Logger
        </p>
        <p className="text-textSecondary text-sm mt-1">
          {sessions.length} range session{sessions.length !== 1 ? "s" : ""} logged
        </p>
      </header>

      <div className="space-y-4">
        {sortedSessions.map((session) => {
          const sessionShots = getSessionShotData(session.id);
          const lots = getSessionLots(session.id);
          const sessionRifles = getSessionRifles(session.id);
          const coldBoreShots = sessionShots.filter((s) => s.isColdBore).length;

          return (
            <button
              key={session.id}
              className="ios-card w-full text-left active:scale-[0.98] transition-transform space-y-4"
            >
              {/* Header Row */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-semibold">{formatDate(session.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-textSecondary" />
                    <span className="text-xs text-textSecondary">{session.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-[#2C2C2E] rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-primary" />
                    <span className="text-xs font-bold">{sessionShots.length}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-textSecondary" />
                </div>
              </div>

              {/* Weather Strip */}
              <div className="flex gap-3 text-xs text-textSecondary">
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-blue-400" />
                  {session.temperature}°F
                </div>
                <div className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  {session.humidity}%
                </div>
                {session.windSpeed && (
                  <div className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-gray-400" />
                    {session.windSpeed} mph {session.windDirection}
                  </div>
                )}
                <div className="text-[10px] text-textSecondary/60">
                  DA: {session.densityAltitude}ft
                </div>
              </div>

              {/* What was tested */}
              <div className="flex flex-wrap gap-2">
                {lots.map((lot) => (
                  <span
                    key={lot!.id}
                    className="text-[10px] bg-[#2C2C2E] px-2 py-1 rounded-full font-medium"
                  >
                    {lot!.brand} {lot!.model} #{lot!.lotNumber}
                  </span>
                ))}
                {sessionRifles.map((r) => (
                  <span
                    key={r!.id}
                    className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-medium"
                  >
                    {r!.make} {r!.model}
                  </span>
                ))}
                {coldBoreShots > 0 && (
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full font-medium">
                    {coldBoreShots} cold bore
                  </span>
                )}
              </div>

              {/* Session Notes */}
              {session.notes && (
                <p className="text-xs text-textSecondary leading-relaxed border-t border-[#2C2C2E] pt-3">
                  {session.notes}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}
