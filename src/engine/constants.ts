/**
 * constants.ts — Centrale constanten voor de rekenmotor.
 * Zones, brandstofprijzen, rendementen, CO₂-factoren, DPE-drempels.
 */

import type { Zone, VerwarmingType } from './types.ts';

// ─── Klimaatzones (uit CLAUDE.md) ────────────────────────────────────────────

export const ZONES: Zone[] = [
  { id: 'med',    name: 'Méditerranée (zacht)',           hdd: 1400, cdd: 700,  pv: 1450, pool_temp: 22, Tref: 12 },
  { id: 'ouest',  name: 'Zuid-West / Atlantisch',          hdd: 1900, cdd: 350,  pv: 1250, pool_temp: 20, Tref: 10 },
  { id: 'paris',  name: 'Noord / Parijs (Île-de-France)',  hdd: 2200, cdd: 250,  pv: 1150, pool_temp: 19, Tref: 7  },
  { id: 'centre', name: 'Centraal / Bourgogne',            hdd: 2500, cdd: 200,  pv: 1200, pool_temp: 19, Tref: 6  },
  { id: 'est',    name: 'Oost / Elzas-Lotharingen',        hdd: 2800, cdd: 150,  pv: 1150, pool_temp: 18, Tref: 5  },
  { id: 'mont',   name: 'Bergen (koel)',                    hdd: 3400, cdd:  50,  pv: 1100, pool_temp: 17, Tref: 2  },
];

export function getZoneById(id: string): Zone {
  return ZONES.find((z) => z.id === id) ?? ZONES[2]; // default: paris
}

// ─── Standaard rendementen / SCOP per verwarmingstype ─────────────────────────

export const DEFAULT_EFFICIENCY: Record<VerwarmingType, number> = {
  gas: 0.90,
  stookolie: 0.85,
  warmtepomp: 3.5,
  elektrisch: 1.0,
  hout: 0.75,
};

// ─── CO₂-factoren (kgCO₂/kWh geleverde energie) ─────────────────────────────

export const CO2_FACTOR: Record<VerwarmingType, number> = {
  gas: 0.205,
  stookolie: 0.265,
  warmtepomp: 0.055,
  elektrisch: 0.055,
  hout: 0.030,
};

// ─── Standaard energieprijzen (€/kWh) — februari 2026 ───────────────────────
//
// Bron: tarieven Frankrijk feb 2026
//   elektra:  0.2516 €/kWh (TRV)
//   gas:      0.1051 €/kWh (PCI)
//   fioul:    1.18 €/L ÷ 10 kWh/L = 0.118 €/kWh
//   pellet:   0.385 €/kg ÷ 4.8 kWh/kg = 0.080 €/kWh
//   hout:     85 €/stère ÷ 1500 kWh/stère = 0.057 €/kWh
//   propaan:  1.90 €/L ÷ 6.5 kWh/L = 0.29 €/kWh (niet apart gemodelleerd)

export const DEFAULT_PRIJZEN: Record<VerwarmingType, number> = {
  gas: 0.1051,
  stookolie: 0.118,
  warmtepomp: 0.2516,
  elektrisch: 0.2516,
  hout: 0.057,
};

export const DEFAULT_EXPORT_TARIEF = 0.13; // €/kWh PV-export (OA EDF tarif S1 2026)

// ─── DPE-drempelwaarden en kleuren (officieel Frans schema) ──────────────────

export interface DPEKlasse {
  letter: string;
  maxKwhM2: number; // bovengrens (G = Infinity)
  kleur: string;
}

export const DPE_KLASSEN: DPEKlasse[] = [
  { letter: 'A', maxKwhM2: 70,       kleur: '#319834' },
  { letter: 'B', maxKwhM2: 110,      kleur: '#33cc31' },
  { letter: 'C', maxKwhM2: 180,      kleur: '#cbfc32' },
  { letter: 'D', maxKwhM2: 250,      kleur: '#fbfe06' },
  { letter: 'E', maxKwhM2: 330,      kleur: '#fbcc05' },
  { letter: 'F', maxKwhM2: 420,      kleur: '#f66c02' },
  { letter: 'G', maxKwhM2: Infinity,  kleur: '#fc0205' },
];

// ─── Verhuurverboden ─────────────────────────────────────────────────────────

export const VERHUURVERBODEN: Record<string, { sindsJaar: number; beschrijving: string }> = {
  G: { sindsJaar: 2025, beschrijving: 'Sinds 1 januari 2025 is het verboden om woningen met DPE-label G te verhuren.' },
  F: { sindsJaar: 2028, beschrijving: 'Vanaf 1 januari 2028 wordt het verboden om woningen met DPE-label F te verhuren.' },
  E: { sindsJaar: 2034, beschrijving: 'Vanaf 1 januari 2034 wordt het verboden om woningen met DPE-label E te verhuren.' },
};

// ─── Fysische constanten ─────────────────────────────────────────────────────

/** Volumetrische warmtecapaciteit lucht: 0.34 Wh/(m³·K) */
export const RHO_CP_LUCHT = 0.34;

/** Specifieke warmte water: 4.186 kJ/(kg·K) = 1.163 Wh/(kg·K) */
export const CP_WATER = 4.186;

/** EV gemiddeld verbruik kWh/km */
export const EV_VERBRUIK_DEFAULT = 0.20;

/** Zwembad warmteverlies W/m² per °C temperatuurverschil (onverwarmd, open) */
export const ZWEMBAD_VERLIES_PER_M2 = 15;

// ─── Standaard invoerwaarden ─────────────────────────────────────────────────

export const DEFAULTS = {
  plafondHoogte: 2.5,
  setpoint: 20,
  awaySetpoint: 16,
  daysPresent: 300,
  daysAway: 65,
  personen: 2,
  douchesPerDag: 1,
  literPerDouche: 50,
  basisElektriciteit: 2500,
  evKmPerJaar: 15000,
  evVerbruik: 0.20,
  pvVermogen: 3,
  pvZelfverbruik: 0.30,
  zwembadMaanden: 5,
  koelingEER: 3.0,
  auxFraction: 0,
} as const;
