// ============================================================
// SubsonicDNA — Rimfire Ballistics Engine
// Simplified .22LR trajectory model using segmented G1 drag.
// This is NOT a full AB Quantum solver — it's purpose-built
// for rimfire lot testing: drop tables, hit probability,
// and environmental sensitivity analysis.
// ============================================================

const GRAVITY = 32.174;         // ft/s²
const SPEED_OF_SOUND = 1125;    // ft/s at sea level, 59°F
const STEP_SIZE = 1;            // 1-yard increments

// Default .22LR match ammo ballistic coefficients (G1)
const BC_TABLE: Record<string, number> = {
  "Lapua Center-X":   0.143,
  "Eley Tenex":       0.148,
  "SK Rifle Match":   0.140,
  "CCI Standard":     0.130,
  "RWS R50":          0.145,
  "Wolf Match Target":0.135,
};

const DEFAULT_BC = 0.140;

/**
 * Get the G1 drag coefficient at a given Mach number.
 * Simplified piecewise model tuned for .22LR subsonic/transonic regime.
 */
function getG1Cd(mach: number): number {
  if (mach <= 0.0)  return 0.12;
  if (mach <= 0.50) return 0.1198 + 0.0012 * mach;
  if (mach <= 0.70) return 0.12 + 0.02 * (mach - 0.5);
  if (mach <= 0.80) return 0.124 + 0.04 * (mach - 0.7);
  if (mach <= 0.90) return 0.128 + 0.12 * (mach - 0.8);
  if (mach <= 0.95) return 0.14 + 0.30 * (mach - 0.9);
  if (mach <= 1.00) return 0.155 + 0.60 * (mach - 0.95);
  if (mach <= 1.05) return 0.185 + 1.20 * (mach - 1.0);
  if (mach <= 1.10) return 0.245 + 0.40 * (mach - 1.05);
  if (mach <= 1.20) return 0.265 + 0.10 * (mach - 1.1);
  return 0.275;
}

/**
 * Calculate velocity loss per yard based on G1 BC and current velocity.
 */
function velocityLossPerYard(velocity: number, bc: number): number {
  const mach = velocity / SPEED_OF_SOUND;
  const cd = getG1Cd(mach);
  // Retardation = Cd / BC * reference constant
  // This produces fps lost per yard of travel
  const retardation = (cd / bc) * 0.0045; // tuned empirical constant for .22LR
  return velocity * retardation;
}

export interface TrajectoryPoint {
  rangeYds: number;
  velocityFps: number;
  dropInches: number;
  dropMoa: number;
  dropMil: number;
  tofSeconds: number;
  energyFtLbs: number;
  isSuperSonic: boolean;
}

/**
 * Generate a full trajectory table for a .22LR round.
 * @param muzzleVelocity — fps from chronograph
 * @param bulletWeight — grains (default 40gr)
 * @param bc — G1 ballistic coefficient
 * @param zeroRange — yards (default 50)
 * @param maxRange — yards (default 300)
 */
export function calculateTrajectory(
  muzzleVelocity: number,
  bulletWeight: number = 40,
  bc: number = DEFAULT_BC,
  zeroRange: number = 50,
  maxRange: number = 300,
): TrajectoryPoint[] {
  const results: TrajectoryPoint[] = [];
  let velocity = muzzleVelocity;
  let tof = 0;
  let rawDrop = 0;       // total bullet drop from bore axis (inches)
  let height = 0;        // height relative to line of sight

  // First pass: calculate raw drop at zero range to find sight angle
  let tempVel = muzzleVelocity;
  let tempDrop = 0;
  let tempTof = 0;
  for (let d = 0; d < zeroRange; d++) {
    const loss = velocityLossPerYard(tempVel, bc);
    tempVel -= loss;
    const segmentTime = 3 / (tempVel + loss / 2); // time for 3 feet (1 yard)
    tempTof += segmentTime;
    tempDrop += 0.5 * GRAVITY * segmentTime * segmentTime + GRAVITY * (tempTof - segmentTime) * segmentTime;
  }
  const sightAngle = (tempDrop * 12) / (zeroRange * 3); // radians, converted to match inches

  // Second pass: full trajectory with sight line correction
  velocity = muzzleVelocity;
  tof = 0;
  rawDrop = 0;

  for (let d = 0; d <= maxRange; d++) {
    // Gravity drop accumulated
    const dropFromBore = rawDrop * 12; // convert to inches
    const sightLineHeight = sightAngle * (d * 3); // sight rises over distance
    const dropRelativeToSight = -(dropFromBore - sightLineHeight);

    const energy = (bulletWeight * velocity * velocity) / 450240;
    const mach = velocity / SPEED_OF_SOUND;

    if (d % 25 === 0 || d === zeroRange) {
      results.push({
        rangeYds: d,
        velocityFps: Math.round(velocity),
        dropInches: Math.round(dropRelativeToSight * 10) / 10,
        dropMoa: d > 0 ? Math.round((dropRelativeToSight / (d * 1.047)) * 10) / 10 : 0,
        dropMil: d > 0 ? Math.round((dropRelativeToSight / (d * 3.6)) * 10) / 10 : 0,
        tofSeconds: Math.round(tof * 1000) / 1000,
        energyFtLbs: Math.round(energy * 10) / 10,
        isSuperSonic: mach > 1.0,
      });
    }

    // Step forward one yard
    if (d < maxRange) {
      const loss = velocityLossPerYard(velocity, bc);
      velocity -= loss;
      const segmentTime = 3 / (velocity + loss / 2);
      tof += segmentTime;
      rawDrop += 0.5 * GRAVITY * segmentTime * segmentTime + GRAVITY * (tof - segmentTime) * segmentTime;
    }
  }

  return results;
}

/**
 * Get the BC for a known ammo brand/model, or return default.
 */
export function getBCForAmmo(brand: string, model: string): number {
  const key = `${brand} ${model}`;
  return BC_TABLE[key] || DEFAULT_BC;
}

/**
 * Calculate hit probability for a given target size at distance.
 * Uses the shooter's actual SD/ES and group data.
 * 
 * @param sd — velocity standard deviation (fps)
 * @param es — extreme spread (fps)
 * @param avgGroupMoa — average group size in MOA
 * @param rangeYds — distance to target
 * @param targetSizeInches — target diameter (e.g., 1" for a precision target)
 * @param muzzleVelocity — average MV
 */
export function calculateHitProbability(
  sd: number,
  es: number,
  avgGroupMoa: number,
  rangeYds: number,
  targetSizeInches: number,
  muzzleVelocity: number = 1060,
): { probability: number; verticalDispersionInches: number; totalDispersionInches: number } {
  if (rangeYds <= 0) return { probability: 100, verticalDispersionInches: 0, totalDispersionInches: 0 };

  // 1. Mechanical dispersion from group size (constant in MOA)
  const mechanicalDispersionInches = (avgGroupMoa * rangeYds) / 100; // MOA to inches at range

  // 2. Velocity-induced vertical dispersion
  // For .22LR, each fps of MV variation causes ~X inches of vertical at distance
  // Rule of thumb: 1 fps MV change ≈ 0.15" vertical change at 100 yds, scaling quadratically
  const verticalSensitivity = 0.15 * Math.pow(rangeYds / 100, 1.8);
  const verticalDispersionInches = sd * verticalSensitivity;

  // 3. Combined dispersion (RSS — root sum of squares)
  const totalSigma = Math.sqrt(
    Math.pow(mechanicalDispersionInches / 2, 2) +
    Math.pow(verticalDispersionInches / 2, 2)
  );

  // 4. Hit probability using Rayleigh distribution
  // P(hit) = 1 - exp(-r² / 2σ²) where r = target radius
  const targetRadius = targetSizeInches / 2;
  const probability = (1 - Math.exp(-(targetRadius * targetRadius) / (2 * totalSigma * totalSigma))) * 100;

  return {
    probability: Math.min(99.9, Math.max(0.1, Math.round(probability * 10) / 10)),
    verticalDispersionInches: Math.round(verticalDispersionInches * 100) / 100,
    totalDispersionInches: Math.round(totalSigma * 2 * 100) / 100, // 1-sigma circle diameter
  };
}

/**
 * Calculate confidence at multiple distances for a quick overview.
 */
export function getConfidenceProfile(
  sd: number,
  avgGroupMoa: number,
  muzzleVelocity: number,
  targetSizeInches: number = 1.0,
): { range: number; probability: number; dispersion: number }[] {
  const distances = [25, 50, 75, 100, 150, 200, 250, 300];
  return distances.map((range) => {
    const { probability, totalDispersionInches } = calculateHitProbability(
      sd, 0, avgGroupMoa, range, targetSizeInches, muzzleVelocity
    );
    return {
      range,
      probability: Math.round(probability),
      dispersion: totalDispersionInches,
    };
  });
}

/**
 * Estimate transonic range — where bullet drops below Mach 1.0
 */
export function getTransonicRange(
  muzzleVelocity: number,
  bc: number = DEFAULT_BC,
): number {
  let velocity = muzzleVelocity;
  for (let d = 0; d <= 500; d++) {
    if (velocity / SPEED_OF_SOUND < 1.0) return d;
    const loss = velocityLossPerYard(velocity, bc);
    velocity -= loss;
  }
  return 500;
}

/**
 * Temperature sensitivity: estimate MV change per degree F.
 * For .22LR rimfire, typical sensitivity is ~1.5 fps per °F.
 */
export function estimateTempSensitivity(
  sessions: { temperature: number; avgVelocity: number }[]
): { fpsPerDegree: number; baselineTemp: number; baselineVelocity: number } | null {
  if (sessions.length < 2) return null;

  // Simple linear regression
  const n = sessions.length;
  const sumX = sessions.reduce((s, d) => s + d.temperature, 0);
  const sumY = sessions.reduce((s, d) => s + d.avgVelocity, 0);
  const sumXY = sessions.reduce((s, d) => s + d.temperature * d.avgVelocity, 0);
  const sumX2 = sessions.reduce((s, d) => s + d.temperature * d.temperature, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const baselineTemp = sumX / n;

  return {
    fpsPerDegree: Math.round(slope * 100) / 100,
    baselineTemp: Math.round(baselineTemp),
    baselineVelocity: Math.round(intercept + slope * baselineTemp),
  };
}
