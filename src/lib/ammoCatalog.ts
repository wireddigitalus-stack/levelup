// Match-grade .22LR Ammo Catalog
// Comprehensive database of competition rimfire ammunition

export interface AmmoSpec {
  brand: string;
  model: string;
  grainWeight: number;
  bulletType: string;
  origin: string;
  tier: "elite" | "match" | "target" | "practice";
  defaultPricePerBox: number; // approximate MSRP per box
  defaultRoundsPerBox: number;
}

export const AMMO_BRANDS = [
  { name: "RWS", origin: "🇩🇪 Germany", flag: "🇩🇪" },
  { name: "SK", origin: "🇩🇪 Germany", flag: "🇩🇪" },
  { name: "Lapua", origin: "🇫🇮 Finland", flag: "🇫🇮" },
  { name: "Eley", origin: "🇬🇧 UK", flag: "🇬🇧" },
  { name: "CCI", origin: "🇺🇸 USA", flag: "🇺🇸" },
  { name: "Federal", origin: "🇺🇸 USA", flag: "🇺🇸" },
  { name: "Norma", origin: "🇸🇪 Sweden", flag: "🇸🇪" },
  { name: "Wolf", origin: "🇩🇪 Germany", flag: "🇩🇪" },
  { name: "Aguila", origin: "🇲🇽 Mexico", flag: "🇲🇽" },
  { name: "Winchester", origin: "🇺🇸 USA", flag: "🇺🇸" },
  { name: "Other", origin: "", flag: "🔧" },
] as const;

export const AMMO_CATALOG: AmmoSpec[] = [
  // RWS — German precision
  { brand: "RWS", model: "R50", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "elite", defaultPricePerBox: 18.99, defaultRoundsPerBox: 50 },
  { brand: "RWS", model: "R100", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "match", defaultPricePerBox: 12.99, defaultRoundsPerBox: 50 },
  { brand: "RWS", model: "Target Rifle", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "target", defaultPricePerBox: 8.99, defaultRoundsPerBox: 50 },
  { brand: "RWS", model: "Club", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "practice", defaultPricePerBox: 6.99, defaultRoundsPerBox: 50 },

  // SK — German (Lapua subsidiary, Schönebeck)
  { brand: "SK", model: "Long Range Match", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "elite", defaultPricePerBox: 14.99, defaultRoundsPerBox: 50 },
  { brand: "SK", model: "Rifle Match", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "match", defaultPricePerBox: 11.99, defaultRoundsPerBox: 50 },
  { brand: "SK", model: "Standard Plus", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "target", defaultPricePerBox: 7.99, defaultRoundsPerBox: 50 },
  { brand: "SK", model: "Pistol Match", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "match", defaultPricePerBox: 10.99, defaultRoundsPerBox: 50 },
  { brand: "SK", model: "Biathlon Sport", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "match", defaultPricePerBox: 12.99, defaultRoundsPerBox: 50 },
  { brand: "SK", model: "Flatnose Match", grainWeight: 40, bulletType: "LFN", origin: "Germany", tier: "match", defaultPricePerBox: 11.99, defaultRoundsPerBox: 50 },

  // Lapua — Finnish precision
  { brand: "Lapua", model: "X-Act", grainWeight: 40, bulletType: "LRN", origin: "Finland", tier: "elite", defaultPricePerBox: 22.99, defaultRoundsPerBox: 50 },
  { brand: "Lapua", model: "Midas+", grainWeight: 40, bulletType: "LRN", origin: "Finland", tier: "elite", defaultPricePerBox: 18.99, defaultRoundsPerBox: 50 },
  { brand: "Lapua", model: "Center-X", grainWeight: 40, bulletType: "LRN", origin: "Finland", tier: "match", defaultPricePerBox: 14.99, defaultRoundsPerBox: 50 },
  { brand: "Lapua", model: "Polar Biathlon", grainWeight: 40, bulletType: "LRN", origin: "Finland", tier: "elite", defaultPricePerBox: 19.99, defaultRoundsPerBox: 50 },
  { brand: "Lapua", model: "Scoremax", grainWeight: 48, bulletType: "LFN", origin: "Finland", tier: "elite", defaultPricePerBox: 21.99, defaultRoundsPerBox: 50 },

  // Eley — British excellence
  { brand: "Eley", model: "Tenex", grainWeight: 40, bulletType: "LFN", origin: "UK", tier: "elite", defaultPricePerBox: 24.99, defaultRoundsPerBox: 50 },
  { brand: "Eley", model: "Match", grainWeight: 40, bulletType: "LFN", origin: "UK", tier: "match", defaultPricePerBox: 14.99, defaultRoundsPerBox: 50 },
  { brand: "Eley", model: "Club", grainWeight: 40, bulletType: "LRN", origin: "UK", tier: "target", defaultPricePerBox: 8.99, defaultRoundsPerBox: 50 },
  { brand: "Eley", model: "Edge", grainWeight: 40, bulletType: "LFN", origin: "UK", tier: "match", defaultPricePerBox: 16.99, defaultRoundsPerBox: 50 },
  { brand: "Eley", model: "Contact", grainWeight: 42, bulletType: "HP", origin: "UK", tier: "match", defaultPricePerBox: 12.99, defaultRoundsPerBox: 50 },
  { brand: "Eley", model: "Team", grainWeight: 40, bulletType: "LFN", origin: "UK", tier: "match", defaultPricePerBox: 11.99, defaultRoundsPerBox: 50 },
  { brand: "Eley", model: "Force", grainWeight: 42, bulletType: "LRN", origin: "UK", tier: "target", defaultPricePerBox: 7.99, defaultRoundsPerBox: 50 },

  // CCI — American staple
  { brand: "CCI", model: "Green Tag", grainWeight: 40, bulletType: "LRN", origin: "USA", tier: "match", defaultPricePerBox: 11.99, defaultRoundsPerBox: 100 },
  { brand: "CCI", model: "Standard Velocity", grainWeight: 40, bulletType: "LRN", origin: "USA", tier: "target", defaultPricePerBox: 7.99, defaultRoundsPerBox: 50 },
  { brand: "CCI", model: "Blazer", grainWeight: 40, bulletType: "LRN", origin: "USA", tier: "practice", defaultPricePerBox: 3.99, defaultRoundsPerBox: 50 },
  { brand: "CCI", model: "Mini-Mag", grainWeight: 36, bulletType: "CPHP", origin: "USA", tier: "target", defaultPricePerBox: 8.99, defaultRoundsPerBox: 100 },
  { brand: "CCI", model: "Quiet-22", grainWeight: 40, bulletType: "LRN", origin: "USA", tier: "practice", defaultPricePerBox: 5.99, defaultRoundsPerBox: 50 },

  // Federal
  { brand: "Federal", model: "Gold Medal", grainWeight: 40, bulletType: "LRN", origin: "USA", tier: "match", defaultPricePerBox: 12.99, defaultRoundsPerBox: 50 },
  { brand: "Federal", model: "Ultra Match", grainWeight: 40, bulletType: "LRN", origin: "USA", tier: "elite", defaultPricePerBox: 16.99, defaultRoundsPerBox: 50 },
  { brand: "Federal", model: "Auto Match", grainWeight: 40, bulletType: "LRN", origin: "USA", tier: "target", defaultPricePerBox: 7.99, defaultRoundsPerBox: 325 },
  { brand: "Federal", model: "Champion", grainWeight: 36, bulletType: "CPHP", origin: "USA", tier: "practice", defaultPricePerBox: 4.99, defaultRoundsPerBox: 50 },

  // Norma
  { brand: "Norma", model: "Tac-22", grainWeight: 40, bulletType: "LRN", origin: "Sweden", tier: "target", defaultPricePerBox: 6.99, defaultRoundsPerBox: 50 },
  { brand: "Norma", model: "Match-22", grainWeight: 40, bulletType: "LRN", origin: "Sweden", tier: "match", defaultPricePerBox: 10.99, defaultRoundsPerBox: 50 },

  // Wolf (made at SK/Lapua factory)
  { brand: "Wolf", model: "Match Target", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "match", defaultPricePerBox: 9.99, defaultRoundsPerBox: 50 },
  { brand: "Wolf", model: "Match Extra", grainWeight: 40, bulletType: "LRN", origin: "Germany", tier: "match", defaultPricePerBox: 11.99, defaultRoundsPerBox: 50 },

  // Aguila
  { brand: "Aguila", model: "Match Rifle", grainWeight: 40, bulletType: "LRN", origin: "Mexico", tier: "match", defaultPricePerBox: 8.99, defaultRoundsPerBox: 50 },
  { brand: "Aguila", model: "Super Extra", grainWeight: 40, bulletType: "LRN", origin: "Mexico", tier: "target", defaultPricePerBox: 4.99, defaultRoundsPerBox: 50 },

  // Winchester
  { brand: "Winchester", model: "T22", grainWeight: 40, bulletType: "LRN", origin: "USA", tier: "target", defaultPricePerBox: 6.99, defaultRoundsPerBox: 50 },
  { brand: "Winchester", model: "Wildcat", grainWeight: 40, bulletType: "LRN", origin: "USA", tier: "practice", defaultPricePerBox: 3.99, defaultRoundsPerBox: 50 },
];

export function getModelsForBrand(brand: string): AmmoSpec[] {
  return AMMO_CATALOG.filter((a) => a.brand === brand);
}

export function getSpec(brand: string, model: string): AmmoSpec | undefined {
  return AMMO_CATALOG.find((a) => a.brand === brand && a.model === model);
}

export function getTierColor(tier: AmmoSpec["tier"]): string {
  switch (tier) {
    case "elite": return "text-yellow-400";
    case "match": return "text-green-400";
    case "target": return "text-blue-400";
    case "practice": return "text-textSecondary";
  }
}

export function getTierLabel(tier: AmmoSpec["tier"]): string {
  switch (tier) {
    case "elite": return "Elite";
    case "match": return "Match";
    case "target": return "Target";
    case "practice": return "Practice";
  }
}
