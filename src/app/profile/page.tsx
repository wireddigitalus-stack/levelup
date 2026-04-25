"use client";

import { User, Settings, LogOut, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function ProfilePage() {
  const { user, rifles } = useApp();

  return (
    <main className="p-4 max-w-md mx-auto space-y-6 pt-8 pb-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-white font-extrabold">Level</span><span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent font-extrabold">UP</span>{" "}
          Profile
        </h1>
        <p className="text-[11px] font-medium tracking-widest uppercase text-textSecondary/60 mt-0.5">
          Lot Evaluation & Velocity Error Logger
        </p>
      </header>

      {/* User Card */}
      <div className="ios-card flex items-center gap-4 py-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 flex items-center justify-center">
          <User className="w-8 h-8 text-black" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.fullName}</h2>
          <p className="text-sm text-textSecondary">{user.email}</p>
        </div>
      </div>

      {/* Rifles */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider ml-1 mb-2">
          My Rifles ({rifles.length})
        </h3>
        <div className="ios-card divide-y divide-[#2C2C2E]">
          {rifles.map((rifle) => (
            <div key={rifle.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-semibold">
                  {rifle.make} {rifle.model}
                </p>
                <p className="text-xs text-textSecondary">
                  {rifle.barrelLength} {rifle.barrelTwist}
                  {rifle.tunerType !== "None" ? ` • ${rifle.tunerType}` : ""}
                </p>
              </div>
              <button className="text-primary text-sm font-medium">Edit</button>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-2 mt-8">
        <div className="ios-card divide-y divide-[#2C2C2E]">
          <button className="w-full flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-textSecondary" />
              <span>App Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-textSecondary" />
          </button>
          <button className="w-full flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="text-red-500">Log Out</span>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
