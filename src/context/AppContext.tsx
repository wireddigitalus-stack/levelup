"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  mockUser,
  mockRifles,
  mockAmmo,
  mockSessions,
  mockShots,
  calculateSD,
  calculateES,
  calculateAvgGroup,
  calculateAvgVertical,
  gradePairing,
  getTunerScatterData,
  getVerticalSpreadData,
  getShotCount,
  getSessionShots,
  getLotInvestment,
  getCostPerRound,
  type UserProfile,
  type RifleProfile,
  type AmmoLot,
  type Session,
  type ShotLog,
} from "@/lib/mockData";

interface AppContextType {
  // Data
  user: UserProfile;
  rifles: RifleProfile[];
  ammo: AmmoLot[];
  sessions: Session[];
  shots: ShotLog[];

  // Filters
  selectedRifleId: string;
  selectedAmmoId: string;
  setSelectedRifleId: (id: string) => void;
  setSelectedAmmoId: (id: string) => void;

  // Derived helpers
  getSD: (ammoId: string) => number;
  getES: (ammoId: string) => number;
  getAvgGroup: (rifleId: string, ammoId: string) => number;
  getAvgVertical: (ammoId: string) => number;
  getGrade: (rifleId: string, ammoId: string) => { grade: string; color: string; score: number };
  getTunerData: (rifleId: string, ammoId: string) => { setting: number; group: number }[];
  getVerticalData: (ammoId: string) => { id: number; yOffset: number }[];
  getShotCountForLot: (ammoId: string) => number;
  getSessionShotData: (sessionId: string) => ShotLog[];
  getLotCost: (lot: AmmoLot) => number;
  getLotCostPerRound: (lot: AmmoLot) => number;

  // Formatted helpers
  getAmmoLabel: (ammoId: string) => string;
  getRifleLabel: (rifleId: string) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedRifleId, setSelectedRifleId] = useState(mockRifles[0].id);
  const [selectedAmmoId, setSelectedAmmoId] = useState(mockAmmo[0].id);

  const getAmmoLabel = (ammoId: string) => {
    const lot = mockAmmo.find((a) => a.id === ammoId);
    return lot ? `${lot.brand} ${lot.model} (Lot #${lot.lotNumber})` : "Unknown";
  };

  const getRifleLabel = (rifleId: string) => {
    const rifle = mockRifles.find((r) => r.id === rifleId);
    return rifle ? `${rifle.make} ${rifle.model} - ${rifle.barrelLength}` : "Unknown";
  };

  return (
    <AppContext.Provider
      value={{
        user: mockUser,
        rifles: mockRifles,
        ammo: mockAmmo,
        sessions: mockSessions,
        shots: mockShots,
        selectedRifleId,
        selectedAmmoId,
        setSelectedRifleId,
        setSelectedAmmoId,
        getSD: calculateSD,
        getES: calculateES,
        getAvgGroup: calculateAvgGroup,
        getAvgVertical: calculateAvgVertical,
        getGrade: gradePairing,
        getTunerData: getTunerScatterData,
        getVerticalData: getVerticalSpreadData,
        getShotCountForLot: getShotCount,
        getSessionShotData: getSessionShots,
        getLotCost: getLotInvestment,
        getLotCostPerRound: getCostPerRound,
        getAmmoLabel,
        getRifleLabel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
