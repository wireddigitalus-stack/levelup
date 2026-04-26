// ============================================================
// SubsonicDNA — Centralized Mock Data
// This file is the single source of truth for all demo data.
// When Supabase is wired up, we replace these exports with
// real queries and the rest of the app stays unchanged.
// ============================================================

export interface RifleProfile {
  id: string;
  make: string;
  model: string;
  barrelLength: string;
  barrelTwist: string;
  tunerType: string;
}

export interface AmmoLot {
  id: string;
  brand: string;
  model: string;
  lotNumber: string;
  nickname?: string;
  purchaseDate: string;
  quantityRemaining: number;
  quantityPurchased: number;
  costPerBox: number;       // cost per box of 50
  boxesPurchased: number;
}

export interface Session {
  id: string;
  date: string;
  location: string;
  densityAltitude: number;
  temperature: number;
  humidity: number;
  windSpeed?: number;
  windDirection?: string;
  notes?: string;
}

export interface ShotLog {
  id: string;
  sessionId: string;
  rifleId: string;
  ammoId: string;
  isColdBore: boolean;
  tunerSetting: number;
  velocityFps: number;
  groupSizeMoa: number;
  poiVertical: number;
  poiHorizontal: number;
  vSpreadIn?: number;       // vertical spread in inches
  hSpreadIn?: number;       // horizontal spread in inches
  elevation?: number;       // elevation used (MOA or MILs)
  elevationUnit?: 'moa' | 'mil';
  windSpeed?: number;       // wind speed at time of shot (mph)
  windDirection?: string;   // clock-face e.g. "3 o'clock"
  roundNotes?: string;      // per-round observation ("Flier", "Wind Gust", etc.)
  timestamp: string;
  photoUrl?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
}

// ---------- User ----------
export const mockUser: UserProfile = {
  id: "usr_001",
  fullName: "Allen Hurley",
  email: "allen.hurley@subsonicdna.com",
};

// ---------- Rifles ----------
export const mockRifles: RifleProfile[] = [
  {
    id: "rifle_001",
    make: "Vudoo",
    model: "V22",
    barrelLength: '20"',
    barrelTwist: "1:16",
    tunerType: "Harrells",
  },
  {
    id: "rifle_002",
    make: "RimX",
    model: "Custom",
    barrelLength: '22"',
    barrelTwist: "1:16",
    tunerType: "EC Tuner",
  },
  {
    id: "rifle_003",
    make: "CZ",
    model: "457 MTR",
    barrelLength: '16"',
    barrelTwist: "1:16",
    tunerType: "None",
  },
];

// ---------- Ammo Inventory ----------
export const mockAmmo: AmmoLot[] = [
  {
    id: "ammo_001",
    brand: "Lapua",
    model: "Center-X",
    lotNumber: "12345",
    nickname: "CX Gold Batch",
    purchaseDate: "2025-11-15",
    quantityRemaining: 1250,
    quantityPurchased: 2500,
    costPerBox: 18.99,
    boxesPurchased: 50,
  },
  {
    id: "ammo_002",
    brand: "SK",
    model: "Rifle Match",
    lotNumber: "98765",
    nickname: "SK Backup",
    purchaseDate: "2025-12-01",
    quantityRemaining: 400,
    quantityPurchased: 500,
    costPerBox: 14.99,
    boxesPurchased: 10,
  },
  {
    id: "ammo_003",
    brand: "Eley",
    model: "Tenex",
    lotNumber: "44210",
    nickname: "Tenex Comp Lot",
    purchaseDate: "2026-01-20",
    quantityRemaining: 800,
    quantityPurchased: 1000,
    costPerBox: 24.99,
    boxesPurchased: 20,
  },
];

// ---------- Sessions ----------
export const mockSessions: Session[] = [
  {
    id: "sess_001",
    date: "2026-04-20",
    location: "Volunteer Rifle Range, TN",
    densityAltitude: 1850,
    temperature: 68,
    humidity: 55,
    windSpeed: 4,
    windDirection: "9 o'clock",
    notes: "Overcast, mild. Center-X Lot 12345 vs SK 98765 head-to-head test on V22.",
  },
  {
    id: "sess_002",
    date: "2026-04-15",
    location: "Volunteer Rifle Range, TN",
    densityAltitude: 2100,
    temperature: 72,
    humidity: 48,
    windSpeed: 8,
    windDirection: "12 o'clock",
    notes: "Full tuner sweep on Center-X 12345. Wind picked up after 10am.",
  },
  {
    id: "sess_003",
    date: "2026-03-28",
    location: "Unaka Range, Erwin TN",
    densityAltitude: 3200,
    temperature: 52,
    humidity: 70,
    windSpeed: 2,
    windDirection: "6 o'clock",
    notes: "Cold morning session. Testing Eley Tenex 44210 for the first time. Rifle shot well cold.",
  },
];

// ---------- Shot Logs ----------
export const mockShots: ShotLog[] = [
  // Session 1 — Lapua Center-X, Vudoo V22
  { id: "shot_001", sessionId: "sess_001", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: true,  tunerSetting: 150, velocityFps: 1058, groupSizeMoa: 0.42, poiVertical: 1.2,  poiHorizontal: 0.3,  vSpreadIn: 0.45, hSpreadIn: 0.18, elevation: 12.5, elevationUnit: "moa", windSpeed: 4, windDirection: "9 o'clock", roundNotes: "Cold bore — settled after", timestamp: "2026-04-20T09:00:00" },
  { id: "shot_002", sessionId: "sess_001", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: false, tunerSetting: 150, velocityFps: 1062, groupSizeMoa: 0.38, poiVertical: -0.5, poiHorizontal: 0.1,  vSpreadIn: 0.38, hSpreadIn: 0.12, elevation: 12.5, elevationUnit: "moa", windSpeed: 4, windDirection: "9 o'clock", timestamp: "2026-04-20T09:05:00" },
  { id: "shot_003", sessionId: "sess_001", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: false, tunerSetting: 200, velocityFps: 1055, groupSizeMoa: 0.35, poiVertical: 0.8,  poiHorizontal: -0.2, vSpreadIn: 0.35, hSpreadIn: 0.15, elevation: 12.5, elevationUnit: "moa", windSpeed: 3, windDirection: "9 o'clock", timestamp: "2026-04-20T09:10:00" },
  { id: "shot_004", sessionId: "sess_001", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: false, tunerSetting: 200, velocityFps: 1060, groupSizeMoa: 0.32, poiVertical: 0.3,  poiHorizontal: 0.0,  vSpreadIn: 0.30, hSpreadIn: 0.10, elevation: 12.5, elevationUnit: "moa", windSpeed: 3, windDirection: "9 o'clock", timestamp: "2026-04-20T09:15:00" },
  { id: "shot_005", sessionId: "sess_001", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: false, tunerSetting: 300, velocityFps: 1048, groupSizeMoa: 0.80, poiVertical: 2.1,  poiHorizontal: 0.5,  vSpreadIn: 0.82, hSpreadIn: 0.35, elevation: 12.5, elevationUnit: "moa", windSpeed: 6, windDirection: "10 o'clock", roundNotes: "Wind gust", timestamp: "2026-04-20T09:20:00" },
  // Session 1 — SK Rifle Match, Vudoo V22
  { id: "shot_006", sessionId: "sess_001", rifleId: "rifle_001", ammoId: "ammo_002", isColdBore: false, tunerSetting: 150, velocityFps: 1072, groupSizeMoa: 0.55, poiVertical: 0.2,  poiHorizontal: 0.1,  vSpreadIn: 0.50, hSpreadIn: 0.30, elevation: 13.0, elevationUnit: "moa", windSpeed: 4, windDirection: "9 o'clock", timestamp: "2026-04-20T10:00:00" },
  { id: "shot_007", sessionId: "sess_001", rifleId: "rifle_001", ammoId: "ammo_002", isColdBore: false, tunerSetting: 150, velocityFps: 1068, groupSizeMoa: 0.48, poiVertical: -0.1, poiHorizontal: -0.1, vSpreadIn: 0.42, hSpreadIn: 0.28, elevation: 13.0, elevationUnit: "moa", windSpeed: 5, windDirection: "9 o'clock", timestamp: "2026-04-20T10:05:00" },
  { id: "shot_008", sessionId: "sess_001", rifleId: "rifle_001", ammoId: "ammo_002", isColdBore: false, tunerSetting: 200, velocityFps: 1075, groupSizeMoa: 0.40, poiVertical: 0.3,  poiHorizontal: 0.0,  vSpreadIn: 0.38, hSpreadIn: 0.20, elevation: 13.0, elevationUnit: "moa", windSpeed: 4, windDirection: "9 o'clock", timestamp: "2026-04-20T10:10:00" },
  { id: "shot_009", sessionId: "sess_001", rifleId: "rifle_001", ammoId: "ammo_002", isColdBore: false, tunerSetting: 200, velocityFps: 1070, groupSizeMoa: 0.36, poiVertical: -0.2, poiHorizontal: 0.2,  vSpreadIn: 0.32, hSpreadIn: 0.22, elevation: 13.0, elevationUnit: "moa", windSpeed: 5, windDirection: "10 o'clock", roundNotes: "Flier — pulled", timestamp: "2026-04-20T10:15:00" },
  // Session 2 — Lapua Center-X tuner sweep, Vudoo V22
  { id: "shot_010", sessionId: "sess_002", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: true,  tunerSetting: 50,  velocityFps: 1045, groupSizeMoa: 0.75, poiVertical: 1.5,  poiHorizontal: -0.4, vSpreadIn: 0.72, hSpreadIn: 0.25, elevation: 12.5, elevationUnit: "moa", windSpeed: 8, windDirection: "12 o'clock", roundNotes: "Cold bore", timestamp: "2026-04-15T08:30:00" },
  { id: "shot_011", sessionId: "sess_002", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: false, tunerSetting: 100, velocityFps: 1052, groupSizeMoa: 0.60, poiVertical: 0.6,  poiHorizontal: 0.2,  vSpreadIn: 0.55, hSpreadIn: 0.22, elevation: 12.5, elevationUnit: "moa", windSpeed: 7, windDirection: "12 o'clock", timestamp: "2026-04-15T08:40:00" },
  { id: "shot_012", sessionId: "sess_002", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: false, tunerSetting: 250, velocityFps: 1050, groupSizeMoa: 0.45, poiVertical: -0.3, poiHorizontal: -0.1, vSpreadIn: 0.40, hSpreadIn: 0.15, elevation: 12.5, elevationUnit: "moa", windSpeed: 6, windDirection: "1 o'clock", timestamp: "2026-04-15T08:50:00" },
  { id: "shot_013", sessionId: "sess_002", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: false, tunerSetting: 350, velocityFps: 1058, groupSizeMoa: 0.90, poiVertical: 2.5,  poiHorizontal: 0.6,  vSpreadIn: 0.95, hSpreadIn: 0.40, elevation: 12.5, elevationUnit: "moa", windSpeed: 10, windDirection: "3 o'clock", roundNotes: "Wind gust — bad group", timestamp: "2026-04-15T09:00:00" },
  { id: "shot_014", sessionId: "sess_002", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: false, tunerSetting: 400, velocityFps: 1054, groupSizeMoa: 0.65, poiVertical: 0.9,  poiHorizontal: -0.3, vSpreadIn: 0.60, hSpreadIn: 0.28, elevation: 12.5, elevationUnit: "moa", windSpeed: 8, windDirection: "2 o'clock", timestamp: "2026-04-15T09:10:00" },
  { id: "shot_015", sessionId: "sess_002", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: false, tunerSetting: 450, velocityFps: 1056, groupSizeMoa: 0.38, poiVertical: 0.1,  poiHorizontal: 0.0,  vSpreadIn: 0.35, hSpreadIn: 0.12, elevation: 12.5, elevationUnit: "moa", windSpeed: 5, windDirection: "12 o'clock", timestamp: "2026-04-15T09:20:00" },
  { id: "shot_016", sessionId: "sess_002", rifleId: "rifle_001", ammoId: "ammo_001", isColdBore: false, tunerSetting: 500, velocityFps: 1051, groupSizeMoa: 0.40, poiVertical: -0.4, poiHorizontal: 0.1,  vSpreadIn: 0.38, hSpreadIn: 0.14, elevation: 12.5, elevationUnit: "moa", windSpeed: 5, windDirection: "12 o'clock", timestamp: "2026-04-15T09:30:00" },
  // Session 3 — Eley Tenex, Vudoo V22
  { id: "shot_017", sessionId: "sess_003", rifleId: "rifle_001", ammoId: "ammo_003", isColdBore: true,  tunerSetting: 150, velocityFps: 1078, groupSizeMoa: 0.30, poiVertical: 0.4,  poiHorizontal: 0.1,  vSpreadIn: 0.28, hSpreadIn: 0.10, elevation: 14.0, elevationUnit: "moa", windSpeed: 2, windDirection: "6 o'clock", roundNotes: "Cold bore — excellent", timestamp: "2026-03-28T07:30:00" },
  { id: "shot_018", sessionId: "sess_003", rifleId: "rifle_001", ammoId: "ammo_003", isColdBore: false, tunerSetting: 150, velocityFps: 1082, groupSizeMoa: 0.28, poiVertical: -0.2, poiHorizontal: 0.0,  vSpreadIn: 0.25, hSpreadIn: 0.08, elevation: 14.0, elevationUnit: "moa", windSpeed: 2, windDirection: "6 o'clock", timestamp: "2026-03-28T07:35:00" },
  { id: "shot_019", sessionId: "sess_003", rifleId: "rifle_001", ammoId: "ammo_003", isColdBore: false, tunerSetting: 150, velocityFps: 1080, groupSizeMoa: 0.25, poiVertical: 0.1,  poiHorizontal: -0.1, vSpreadIn: 0.22, hSpreadIn: 0.10, elevation: 14.0, elevationUnit: "moa", windSpeed: 1, windDirection: "6 o'clock", timestamp: "2026-03-28T07:40:00" },
  { id: "shot_020", sessionId: "sess_003", rifleId: "rifle_001", ammoId: "ammo_003", isColdBore: false, tunerSetting: 200, velocityFps: 1076, groupSizeMoa: 0.32, poiVertical: 0.3,  poiHorizontal: 0.2,  vSpreadIn: 0.30, hSpreadIn: 0.18, elevation: 14.0, elevationUnit: "moa", windSpeed: 3, windDirection: "7 o'clock", timestamp: "2026-03-28T07:50:00" },
  { id: "shot_021", sessionId: "sess_003", rifleId: "rifle_001", ammoId: "ammo_003", isColdBore: false, tunerSetting: 200, velocityFps: 1079, groupSizeMoa: 0.27, poiVertical: -0.1, poiHorizontal: 0.0,  vSpreadIn: 0.24, hSpreadIn: 0.09, elevation: 14.0, elevationUnit: "moa", windSpeed: 2, windDirection: "6 o'clock", timestamp: "2026-03-28T07:55:00" },
];

// ---------- Derived / Helper Functions ----------

/** Calculate Standard Deviation of velocities for a given ammo lot */
export function calculateSD(ammoId: string): number {
  const velocities = mockShots
    .filter((s) => s.ammoId === ammoId)
    .map((s) => s.velocityFps);
  if (velocities.length < 2) return 0;
  const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const variance =
    velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    (velocities.length - 1);
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

/** Calculate Extreme Spread of velocities for a given ammo lot */
export function calculateES(ammoId: string): number {
  const velocities = mockShots
    .filter((s) => s.ammoId === ammoId)
    .map((s) => s.velocityFps);
  if (velocities.length < 2) return 0;
  return Math.max(...velocities) - Math.min(...velocities);
}

/** Average group size for a rifle+ammo combo */
export function calculateAvgGroup(rifleId: string, ammoId: string): number {
  const groups = mockShots
    .filter((s) => s.rifleId === rifleId && s.ammoId === ammoId)
    .map((s) => s.groupSizeMoa);
  if (groups.length === 0) return 0;
  return Math.round((groups.reduce((a, b) => a + b, 0) / groups.length) * 100) / 100;
}

/** Average vertical spread for an ammo lot */
export function calculateAvgVertical(ammoId: string): number {
  const verts = mockShots
    .filter((s) => s.ammoId === ammoId)
    .map((s) => Math.abs(s.poiVertical));
  if (verts.length === 0) return 0;
  return Math.round((verts.reduce((a, b) => a + b, 0) / verts.length) * 100) / 100;
}

/**
 * Grade a rifle+ammo pairing on A+ through D scale.
 * Factors: SD, ES, average group size, vertical consistency.
 */
export function gradePairing(rifleId: string, ammoId: string): { grade: string; color: string; score: number } {
  const sd = calculateSD(ammoId);
  const es = calculateES(ammoId);
  const avgGroup = calculateAvgGroup(rifleId, ammoId);
  const avgVert = calculateAvgVertical(ammoId);
  const shotCount = getShotCount(ammoId);

  if (shotCount < 3) return { grade: "N/A", color: "#8E8E93", score: 0 };

  // Score 0-100 based on weighted factors
  let score = 100;
  // SD penalty (ideal < 5)
  score -= Math.min(sd * 3, 30);
  // ES penalty (ideal < 15)
  score -= Math.min(es * 0.8, 25);
  // Group penalty (ideal < 0.35 MOA)
  score -= Math.min(avgGroup * 30, 25);
  // Vertical penalty (ideal < 0.5")
  score -= Math.min(avgVert * 10, 20);

  score = Math.max(0, Math.round(score));

  if (score >= 90) return { grade: "A+", color: "#32D74B", score };
  if (score >= 80) return { grade: "A",  color: "#32D74B", score };
  if (score >= 70) return { grade: "B+", color: "#FFD60A", score };
  if (score >= 60) return { grade: "B",  color: "#FFD60A", score };
  if (score >= 50) return { grade: "C",  color: "#FF9F0A", score };
  return { grade: "D", color: "#FF453A", score };
}

/** Get tuner scatter data (setting vs group size) for a given rifle + ammo combo */
export function getTunerScatterData(rifleId: string, ammoId: string) {
  return mockShots
    .filter((s) => s.rifleId === rifleId && s.ammoId === ammoId)
    .map((s) => ({
      setting: s.tunerSetting,
      group: s.groupSizeMoa,
    }));
}

/** Get vertical spread data for a given ammo lot */
export function getVerticalSpreadData(ammoId: string) {
  return mockShots
    .filter((s) => s.ammoId === ammoId)
    .map((s, i) => ({
      id: i + 1,
      yOffset: s.poiVertical,
    }));
}

/** Get shot count for an ammo lot */
export function getShotCount(ammoId: string): number {
  return mockShots.filter((s) => s.ammoId === ammoId).length;
}

/** Get shots for a specific session */
export function getSessionShots(sessionId: string): ShotLog[] {
  return mockShots.filter((s) => s.sessionId === sessionId);
}

/** Get total investment for an ammo lot */
export function getLotInvestment(lot: AmmoLot): number {
  return Math.round(lot.costPerBox * lot.boxesPurchased * 100) / 100;
}

/** Get cost per round for an ammo lot */
export function getCostPerRound(lot: AmmoLot): number {
  return Math.round((lot.costPerBox / 50) * 1000) / 1000;
}
