"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
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

import * as ds from "@/lib/dataService";
import type { AppSettings } from "@/lib/dataService";

interface AppContextType {
  // Data
  user: UserProfile;
  rifles: RifleProfile[];
  ammo: AmmoLot[];
  sessions: Session[];
  shots: ShotLog[];
  settings: AppSettings;

  // Mutations — Rifles
  addRifle: (rifle: RifleProfile) => void;
  updateRifle: (rifle: RifleProfile) => void;
  deleteRifle: (rifleId: string) => void;

  // Mutations — Ammo
  addAmmoLot: (lot: AmmoLot) => void;
  updateAmmoLot: (lot: AmmoLot) => void;
  deleteAmmoLot: (lotId: string) => void;

  // Mutations — Shots & Sessions
  addShot: (shot: ShotLog) => void;
  addSession: (session: Session) => void;

  // Mutations — Settings
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  clearAllData: () => void;

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

  // Hydration flag
  isReady: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Hydration flag — prevents flash of mock data on SSR
  const [isReady, setIsReady] = useState(false);

  // Core state
  const [user, setUser] = useState<UserProfile>(ds.getUser());
  const [rifles, setRifles] = useState<RifleProfile[]>([]);
  const [ammo, setAmmo] = useState<AmmoLot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [shots, setShots] = useState<ShotLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(ds.DEFAULT_SETTINGS);

  // Filters
  const [selectedRifleId, setSelectedRifleId] = useState("");
  const [selectedAmmoId, setSelectedAmmoId] = useState("");

  // Load persisted data on mount (client only)
  useEffect(() => {
    const loadedRifles = ds.getRifles();
    const loadedAmmo = ds.getAmmoLots();
    const loadedSessions = ds.getSessions();
    const loadedShots = ds.getShots();
    const loadedSettings = ds.getSettings();
    const loadedUser = ds.getUser();

    setUser(loadedUser);
    setRifles(loadedRifles);
    setAmmo(loadedAmmo);
    setSessions(loadedSessions);
    setShots(loadedShots);
    setSettings(loadedSettings);

    // Default selections
    if (loadedRifles.length > 0) setSelectedRifleId(loadedRifles[0].id);
    if (loadedAmmo.length > 0) setSelectedAmmoId(loadedAmmo[0].id);

    setIsReady(true);
  }, []);

  // ── Rifle mutations ───────────────────────────────────────
  const addRifle = (rifle: RifleProfile) => {
    const updated = ds.addRifle(rifle);
    setRifles(updated);
  };

  const updateRifle = (rifle: RifleProfile) => {
    const updated = ds.updateRifle(rifle);
    setRifles(updated);
  };

  const deleteRifle = (rifleId: string) => {
    const updated = ds.deleteRifle(rifleId);
    setRifles(updated);
  };

  // ── Ammo mutations ────────────────────────────────────────
  const addAmmoLot = (lot: AmmoLot) => {
    const updated = ds.addAmmoLot(lot);
    setAmmo(updated);
  };

  const updateAmmoLot = (lot: AmmoLot) => {
    const updated = ds.updateAmmoLot(lot);
    setAmmo(updated);
  };

  const deleteAmmoLot = (lotId: string) => {
    const updated = ds.deleteAmmoLot(lotId);
    setAmmo(updated);
  };

  // ── Shot & Session mutations ──────────────────────────────
  const addShot = (shot: ShotLog) => {
    const updated = ds.addShot(shot);
    setShots(updated);
  };

  const addSession = (session: Session) => {
    const updated = ds.addSession(session);
    setSessions(updated);
  };

  // ── Settings mutations ────────────────────────────────────
  const updateSettingFn = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = ds.updateSetting(key, value);
    setSettings(updated);
  };

  const clearAllData = () => {
    ds.clearAllData();
    // Reset to defaults
    const freshRifles = ds.getRifles();
    const freshAmmo = ds.getAmmoLots();
    setRifles(freshRifles);
    setAmmo(freshAmmo);
    setSessions(ds.getSessions());
    setShots(ds.getShots());
    setSettings(ds.DEFAULT_SETTINGS);
  };

  // ── Label helpers ─────────────────────────────────────────
  const getAmmoLabel = (ammoId: string) => {
    const lot = ammo.find((a) => a.id === ammoId);
    return lot ? `${lot.brand} ${lot.model} (Lot #${lot.lotNumber})` : "Unknown";
  };

  const getRifleLabel = (rifleId: string) => {
    const rifle = rifles.find((r) => r.id === rifleId);
    return rifle ? `${rifle.make} ${rifle.model} - ${rifle.barrelLength}` : "Unknown";
  };

  return (
    <AppContext.Provider
      value={{
        user,
        rifles,
        ammo,
        sessions: sessions,
        shots: shots,
        settings,
        addRifle,
        updateRifle,
        deleteRifle,
        addAmmoLot,
        updateAmmoLot,
        deleteAmmoLot,
        addShot,
        addSession,
        updateSetting: updateSettingFn,
        clearAllData,
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
        isReady,
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
