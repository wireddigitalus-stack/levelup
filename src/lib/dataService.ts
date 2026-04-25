// ============================================================
// LevelUP — Data Service (Persistence Layer)
//
// This is the ONLY file that touches storage. Every component
// reads/writes through AppContext → dataService.
//
// RIGHT NOW:  localStorage (works offline, survives refresh)
// LATER:      Swap these functions to Supabase calls. Zero
//             component changes needed.
// ============================================================

import type {
  RifleProfile,
  AmmoLot,
  Session,
  ShotLog,
  UserProfile,
} from "./mockData";

import {
  mockUser,
  mockRifles,
  mockAmmo,
  mockSessions,
  mockShots,
} from "./mockData";

// ── Storage Keys ──────────────────────────────────────────────
const KEYS = {
  user: "levelup_user",
  rifles: "levelup_rifles",
  ammo: "levelup_ammo",
  sessions: "levelup_sessions",
  shots: "levelup_shots",
  settings: "levelup_settings",
} as const;

// ── Settings Type ─────────────────────────────────────────────
export interface AppSettings {
  units: "imperial" | "metric";
  defaultZero: number;
  targetSize: number;
  dropUnit: "moa" | "mil";
  tempUnit: "F" | "C";
  notifications: boolean;
  autoSync: boolean;
  hapticFeedback: boolean;
  homeRange: string;
  elevation: string;
  defaultDA: string;
  autoWeather: boolean;
  darkMode: boolean;
  compactCards: boolean;
  showCostData: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  units: "imperial",
  defaultZero: 50,
  targetSize: 1.0,
  dropUnit: "moa",
  tempUnit: "F",
  notifications: true,
  autoSync: true,
  hapticFeedback: true,
  homeRange: "Kingsport Rifle & Pistol",
  elevation: "1200",
  defaultDA: "2500",
  autoWeather: true,
  darkMode: true,
  compactCards: false,
  showCostData: true,
};

// ── Helpers ───────────────────────────────────────────────────
function isClient(): boolean {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, data: T): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("[dataService] localStorage write failed:", e);
  }
}

// ── User ──────────────────────────────────────────────────────
export function getUser(): UserProfile {
  return read(KEYS.user, mockUser);
}

export function updateUser(user: UserProfile): void {
  write(KEYS.user, user);
}

// ── Rifles ────────────────────────────────────────────────────
export function getRifles(): RifleProfile[] {
  return read(KEYS.rifles, mockRifles);
}

export function saveRifles(rifles: RifleProfile[]): void {
  write(KEYS.rifles, rifles);
}

export function addRifle(rifle: RifleProfile): RifleProfile[] {
  const current = getRifles();
  const updated = [...current, rifle];
  saveRifles(updated);
  return updated;
}

export function updateRifle(rifle: RifleProfile): RifleProfile[] {
  const current = getRifles();
  const updated = current.map((r) => (r.id === rifle.id ? rifle : r));
  saveRifles(updated);
  return updated;
}

export function deleteRifle(rifleId: string): RifleProfile[] {
  const current = getRifles();
  const updated = current.filter((r) => r.id !== rifleId);
  saveRifles(updated);
  return updated;
}

// ── Ammo Lots ─────────────────────────────────────────────────
export function getAmmoLots(): AmmoLot[] {
  return read(KEYS.ammo, mockAmmo);
}

export function saveAmmoLots(lots: AmmoLot[]): void {
  write(KEYS.ammo, lots);
}

export function addAmmoLot(lot: AmmoLot): AmmoLot[] {
  const current = getAmmoLots();
  const updated = [...current, lot];
  saveAmmoLots(updated);
  return updated;
}

export function updateAmmoLot(lot: AmmoLot): AmmoLot[] {
  const current = getAmmoLots();
  const updated = current.map((a) => (a.id === lot.id ? lot : a));
  saveAmmoLots(updated);
  return updated;
}

export function deleteAmmoLot(lotId: string): AmmoLot[] {
  const current = getAmmoLots();
  const updated = current.filter((a) => a.id !== lotId);
  saveAmmoLots(updated);
  return updated;
}

// ── Sessions ──────────────────────────────────────────────────
export function getSessions(): Session[] {
  return read(KEYS.sessions, mockSessions);
}

export function saveSessions(sessions: Session[]): void {
  write(KEYS.sessions, sessions);
}

export function addSession(session: Session): Session[] {
  const current = getSessions();
  const updated = [...current, session];
  saveSessions(updated);
  return updated;
}

// ── Shot Logs ─────────────────────────────────────────────────
export function getShots(): ShotLog[] {
  return read(KEYS.shots, mockShots);
}

export function saveShots(shots: ShotLog[]): void {
  write(KEYS.shots, shots);
}

export function addShot(shot: ShotLog): ShotLog[] {
  const current = getShots();
  const updated = [...current, shot];
  saveShots(updated);
  return updated;
}

// ── Settings ──────────────────────────────────────────────────
export function getSettings(): AppSettings {
  return read(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  write(KEYS.settings, settings);
}

export function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): AppSettings {
  const current = getSettings();
  const updated = { ...current, [key]: value };
  saveSettings(updated);
  return updated;
}

// ── Reset (for "Clear All Data") ──────────────────────────────
export function clearAllData(): void {
  if (!isClient()) return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
