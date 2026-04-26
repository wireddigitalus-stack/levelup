// ============================================================
// SubsonicDNA — Data Service (Supabase + localStorage)
//
// This is the ONLY file that touches storage. Every component
// reads/writes through AppContext → dataService.
//
// If Supabase SDK is installed and user is authed → syncs to cloud.
// Otherwise → falls back to localStorage seamlessly.
// ============================================================

import { supabase } from "./supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any;

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

// ── localStorage fallback helpers ─────────────────────────────
const KEYS = {
  user: "subsonicdna_user",
  rifles: "subsonicdna_rifles",
  ammo: "subsonicdna_ammo",
  sessions: "subsonicdna_sessions",
  shots: "subsonicdna_shots",
  settings: "subsonicdna_settings",
} as const;

function isClient(): boolean {
  return typeof window !== "undefined";
}

function readLocal<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("[dataService] localStorage write failed:", e);
  }
}

// ── Auth helper ───────────────────────────────────────────────
async function getProfileId(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data: { user } } = await db().auth.getUser();
    if (!user) return null;

    const { data: profile } = await db()
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    return profile?.id ?? null;
  } catch {
    return null;
  }
}

// ── Mapping: Supabase row ↔ App types ─────────────────────────

function mapRifleFromDB(row: Record<string, unknown>): RifleProfile {
  return {
    id: row.id as string,
    make: row.make as string,
    model: row.model as string,
    barrelLength: (row.barrel_length as string) ?? "",
    barrelTwist: (row.twist_rate as string) ?? "",
    tunerType: (row.tuner_type as string) ?? "None",
  };
}

function mapRifleToDB(r: RifleProfile, profileId: string) {
  return {
    profile_id: profileId,
    make: r.make,
    model: r.model,
    barrel_length: r.barrelLength,
    twist_rate: r.barrelTwist,
    tuner_type: r.tunerType,
  };
}

function mapAmmoFromDB(row: Record<string, unknown>): AmmoLot {
  return {
    id: row.id as string,
    brand: row.brand as string,
    model: row.model as string,
    lotNumber: (row.lot_number as string) ?? "",
    nickname: (row.nickname as string) ?? undefined,
    purchaseDate: (row.purchase_date as string) ?? "",
    quantityRemaining: (row.quantity_remaining as number) ?? 0,
    quantityPurchased: (row.quantity_purchased as number) ?? 0,
    costPerBox: Number(row.purchase_price ?? 0),
    boxesPurchased: Math.ceil((row.quantity_purchased as number ?? 0) / 50),
  };
}

function mapAmmoToDB(a: AmmoLot, profileId: string) {
  return {
    profile_id: profileId,
    brand: a.brand,
    model: a.model,
    lot_number: a.lotNumber,
    nickname: a.nickname ?? null,
    purchase_date: a.purchaseDate || null,
    quantity_remaining: a.quantityRemaining,
    quantity_purchased: a.quantityPurchased,
    purchase_price: a.costPerBox,
  };
}

function mapSessionFromDB(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    date: (row.date as string) ?? "",
    location: (row.location as string) ?? "",
    densityAltitude: (row.density_altitude as number) ?? 0,
    temperature: Number(row.temperature ?? 0),
    humidity: Number(row.humidity ?? 0),
    windSpeed: Number(row.wind_speed ?? 0),
    windDirection: (row.wind_direction as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
  };
}

function mapSessionToDB(s: Session, profileId: string) {
  return {
    profile_id: profileId,
    date: s.date,
    location: s.location,
    density_altitude: s.densityAltitude,
    temperature: s.temperature,
    humidity: s.humidity,
    wind_speed: s.windSpeed ?? null,
    wind_direction: s.windDirection ?? null,
    notes: s.notes ?? null,
  };
}

function mapShotFromDB(row: Record<string, unknown>): ShotLog {
  return {
    id: row.id as string,
    sessionId: (row.session_id as string) ?? "",
    rifleId: (row.rifle_id as string) ?? "",
    ammoId: (row.ammo_lot_id as string) ?? "",
    isColdBore: (row.is_cold_bore as boolean) ?? false,
    tunerSetting: Number(row.tuner_setting ?? 0),
    velocityFps: Number(row.velocity_fps ?? 0),
    groupSizeMoa: Number(row.group_size_moa ?? 0),
    poiVertical: Number(row.poi_vertical ?? 0),
    poiHorizontal: Number(row.poi_horizontal ?? 0),
    timestamp: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapShotToDB(s: ShotLog, profileId: string) {
  return {
    profile_id: profileId,
    session_id: s.sessionId,
    rifle_id: s.rifleId,
    ammo_lot_id: s.ammoId,
    is_cold_bore: s.isColdBore,
    tuner_setting: s.tunerSetting,
    velocity_fps: s.velocityFps,
    group_size_moa: s.groupSizeMoa,
    poi_vertical: s.poiVertical,
    poi_horizontal: s.poiHorizontal,
  };
}

function mapSettingsFromDB(row: Record<string, unknown>): AppSettings {
  return {
    units: (row.units as "imperial" | "metric") ?? "imperial",
    defaultZero: (row.default_zero_range as number) ?? 50,
    targetSize: Number(row.target_size_inches ?? 1.0),
    dropUnit: (row.drop_unit as "moa" | "mil") ?? "moa",
    tempUnit: (row.temp_unit as "F" | "C") ?? "F",
    notifications: (row.notifications_enabled as boolean) ?? true,
    autoSync: true,
    hapticFeedback: (row.haptic_enabled as boolean) ?? true,
    homeRange: "",
    elevation: "",
    defaultDA: "",
    autoWeather: true,
    darkMode: true,
    compactCards: false,
    showCostData: true,
  };
}

// ── User ──────────────────────────────────────────────────────
export function getUser(): UserProfile {
  return readLocal(KEYS.user, mockUser);
}

export function updateUser(user: UserProfile): void {
  writeLocal(KEYS.user, user);
}

// ── Async Supabase loaders ────────────────────────────────────
// These are called once on mount from AppContext. If Supabase
// fails or user isn't authed, we fall back to localStorage.

export async function loadRifles(): Promise<RifleProfile[]> {
  const profileId = await getProfileId();
  if (!profileId) return readLocal(KEYS.rifles, mockRifles);

  const { data, error } = await db()
    .from("rifles")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return readLocal(KEYS.rifles, mockRifles);
  }

  const mapped = data.map(mapRifleFromDB);
  writeLocal(KEYS.rifles, mapped);
  return mapped;
}

export async function loadAmmoLots(): Promise<AmmoLot[]> {
  const profileId = await getProfileId();
  if (!profileId) return readLocal(KEYS.ammo, mockAmmo);

  const { data, error } = await db()
    .from("ammo_lots")
    .select("*")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return readLocal(KEYS.ammo, mockAmmo);
  }

  const mapped = data.map(mapAmmoFromDB);
  writeLocal(KEYS.ammo, mapped);
  return mapped;
}

export async function loadSessions(): Promise<Session[]> {
  const profileId = await getProfileId();
  if (!profileId) return readLocal(KEYS.sessions, mockSessions);

  const { data, error } = await db()
    .from("sessions")
    .select("*")
    .eq("profile_id", profileId)
    .order("date", { ascending: false });

  if (error || !data || data.length === 0) {
    return readLocal(KEYS.sessions, mockSessions);
  }

  const mapped = data.map(mapSessionFromDB);
  writeLocal(KEYS.sessions, mapped);
  return mapped;
}

export async function loadShots(): Promise<ShotLog[]> {
  const profileId = await getProfileId();
  if (!profileId) return readLocal(KEYS.shots, mockShots);

  const { data, error } = await db()
    .from("shots")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return readLocal(KEYS.shots, mockShots);
  }

  const mapped = data.map(mapShotFromDB);
  writeLocal(KEYS.shots, mapped);
  return mapped;
}

export async function loadSettings(): Promise<AppSettings> {
  const profileId = await getProfileId();
  if (!profileId) return readLocal(KEYS.settings, DEFAULT_SETTINGS);

  const { data, error } = await db()
    .from("profiles")
    .select("units, default_zero_range, target_size_inches, drop_unit, temp_unit, notifications_enabled, haptic_enabled")
    .eq("id", profileId)
    .single();

  if (error || !data) {
    return readLocal(KEYS.settings, DEFAULT_SETTINGS);
  }

  const mapped = mapSettingsFromDB(data);
  writeLocal(KEYS.settings, mapped);
  return mapped;
}

// ── Sync-compatible getters (used as fallback / SSR) ──────────
export function getRifles(): RifleProfile[] {
  return readLocal(KEYS.rifles, mockRifles);
}

export function getAmmoLots(): AmmoLot[] {
  return readLocal(KEYS.ammo, mockAmmo);
}

export function getSessions(): Session[] {
  return readLocal(KEYS.sessions, mockSessions);
}

export function getShots(): ShotLog[] {
  return readLocal(KEYS.shots, mockShots);
}

export function getSettings(): AppSettings {
  return readLocal(KEYS.settings, DEFAULT_SETTINGS);
}

// ── Rifles CRUD ───────────────────────────────────────────────
export function saveRifles(rifles: RifleProfile[]): void {
  writeLocal(KEYS.rifles, rifles);
}

export async function addRifle(rifle: RifleProfile): Promise<RifleProfile[]> {
  const profileId = await getProfileId();
  const current = getRifles();

  if (profileId) {
    const { data, error } = await db()
      .from("rifles")
      .insert(mapRifleToDB(rifle, profileId))
      .select()
      .single();

    if (!error && data) {
      const newRifle = mapRifleFromDB(data);
      const updated = [...current, newRifle];
      writeLocal(KEYS.rifles, updated);
      return updated;
    }
  }

  // Fallback to local
  const updated = [...current, rifle];
  writeLocal(KEYS.rifles, updated);
  return updated;
}

export async function updateRifle(rifle: RifleProfile): Promise<RifleProfile[]> {
  const profileId = await getProfileId();
  const current = getRifles();

  if (profileId) {
    await db()
      .from("rifles")
      .update(mapRifleToDB(rifle, profileId))
      .eq("id", rifle.id);
  }

  const updated = current.map((r) => (r.id === rifle.id ? rifle : r));
  writeLocal(KEYS.rifles, updated);
  return updated;
}

export async function deleteRifle(rifleId: string): Promise<RifleProfile[]> {
  const profileId = await getProfileId();

  if (profileId) {
    // Soft-delete: set is_active = false
    await db()
      .from("rifles")
      .update({ is_active: false })
      .eq("id", rifleId);
  }

  const current = getRifles();
  const updated = current.filter((r) => r.id !== rifleId);
  writeLocal(KEYS.rifles, updated);
  return updated;
}

// ── Ammo CRUD ─────────────────────────────────────────────────
export function saveAmmoLots(lots: AmmoLot[]): void {
  writeLocal(KEYS.ammo, lots);
}

export async function addAmmoLot(lot: AmmoLot): Promise<AmmoLot[]> {
  const profileId = await getProfileId();
  const current = getAmmoLots();

  if (profileId) {
    const { data, error } = await db()
      .from("ammo_lots")
      .insert(mapAmmoToDB(lot, profileId))
      .select()
      .single();

    if (!error && data) {
      const newLot = mapAmmoFromDB(data);
      const updated = [...current, newLot];
      writeLocal(KEYS.ammo, updated);
      return updated;
    }
  }

  const updated = [...current, lot];
  writeLocal(KEYS.ammo, updated);
  return updated;
}

export async function updateAmmoLot(lot: AmmoLot): Promise<AmmoLot[]> {
  const profileId = await getProfileId();
  const current = getAmmoLots();

  if (profileId) {
    await db()
      .from("ammo_lots")
      .update(mapAmmoToDB(lot, profileId))
      .eq("id", lot.id);
  }

  const updated = current.map((a) => (a.id === lot.id ? lot : a));
  writeLocal(KEYS.ammo, updated);
  return updated;
}

export async function deleteAmmoLot(lotId: string): Promise<AmmoLot[]> {
  const profileId = await getProfileId();

  if (profileId) {
    await db()
      .from("ammo_lots")
      .update({ is_active: false })
      .eq("id", lotId);
  }

  const current = getAmmoLots();
  const updated = current.filter((a) => a.id !== lotId);
  writeLocal(KEYS.ammo, updated);
  return updated;
}

// ── Sessions ──────────────────────────────────────────────────
export function saveSessions(sessions: Session[]): void {
  writeLocal(KEYS.sessions, sessions);
}

export async function addSession(session: Session): Promise<Session[]> {
  const profileId = await getProfileId();
  const current = getSessions();

  if (profileId) {
    const { data, error } = await db()
      .from("sessions")
      .insert(mapSessionToDB(session, profileId))
      .select()
      .single();

    if (!error && data) {
      const newSession = mapSessionFromDB(data);
      const updated = [...current, newSession];
      writeLocal(KEYS.sessions, updated);
      return updated;
    }
  }

  const updated = [...current, session];
  writeLocal(KEYS.sessions, updated);
  return updated;
}

// ── Shots ─────────────────────────────────────────────────────
export function saveShots(shots: ShotLog[]): void {
  writeLocal(KEYS.shots, shots);
}

export async function addShot(shot: ShotLog): Promise<ShotLog[]> {
  const profileId = await getProfileId();
  const current = getShots();

  if (profileId) {
    const { data, error } = await db()
      .from("shots")
      .insert(mapShotToDB(shot, profileId))
      .select()
      .single();

    if (!error && data) {
      const newShot = mapShotFromDB(data);
      const updated = [...current, newShot];
      writeLocal(KEYS.shots, updated);
      return updated;
    }
  }

  const updated = [...current, shot];
  writeLocal(KEYS.shots, updated);
  return updated;
}

// ── Settings ──────────────────────────────────────────────────
export function saveSettings(settings: AppSettings): void {
  writeLocal(KEYS.settings, settings);
}

export function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): AppSettings {
  const current = getSettings();
  const updated = { ...current, [key]: value };
  saveSettings(updated);

  // Fire-and-forget Supabase sync for supported fields
  const fieldMap: Partial<Record<keyof AppSettings, string>> = {
    units: "units",
    dropUnit: "drop_unit",
    tempUnit: "temp_unit",
    defaultZero: "default_zero_range",
    targetSize: "target_size_inches",
    notifications: "notifications_enabled",
    hapticFeedback: "haptic_enabled",
  };

  const dbField = fieldMap[key];
  if (dbField) {
    getProfileId().then((profileId) => {
      if (profileId) {
        db()
          .from("profiles")
          .update({ [dbField]: value })
          .eq("id", profileId)
          .then(() => {});
      }
    });
  }

  return updated;
}

// ── Reset ─────────────────────────────────────────────────────
export function clearAllData(): void {
  if (!isClient()) return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
