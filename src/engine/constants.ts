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
  propaan: 0.90,
};

// ─── Verwarmingssubtypes met specifiek rendement ─────────────────────────────

export const HEATING_SUBTYPES: Record<string, { label: string; eta: number }[]> = {
  hout: [
    { label: 'Open haard (foyer ouverte)', eta: 0.15 },
    { label: 'Gesloten haard / insert (foyer fermé)', eta: 0.65 },
    { label: 'Houtkachel (poêle à bois)', eta: 0.75 },
    { label: 'Pelletkachel (poêle à granulés)', eta: 0.90 },
  ],
  gas: [
    { label: 'Oude ketel (vóór 1990)', eta: 0.75 },
    { label: 'Standaardketel', eta: 0.85 },
    { label: 'HR-ketel (condensatie)', eta: 0.95 },
  ],
  stookolie: [
    { label: 'Oude ketel (vóór 1990)', eta: 0.70 },
    { label: 'Standaardketel', eta: 0.80 },
    { label: 'HR-ketel (condensatie)', eta: 0.90 },
  ],
};

// ─── CO₂-factoren (kgCO₂/kWh geleverde energie) ─────────────────────────────

export const CO2_FACTOR: Record<VerwarmingType, number> = {
  gas: 0.205,
  stookolie: 0.265,
  warmtepomp: 0.055,
  elektrisch: 0.055,
  hout: 0.030,
  propaan: 0.235,
};

// --- ENERGIEPRIJZEN --- Bron: CRE / DGEC / Markt --- maart 2026 -----------
// Alle prijzen in EUR/kWh (omgerekend via KWH_CONVERSION).
// Gebruiker kan altijd handmatig aanpassen in Stap 5.

export const DEFAULT_PRIJZEN: Record<VerwarmingType, number> = {
  gas: 0.1051,        // CRE Prix Repere chauffage, mars 2026 (EUR 1,05/m3)
  stookolie: 0.119,   // DGEC Pegase + FioulReduc.com barometer, mars 2026 (EUR 1,19/L / 10 kWh/L PCI)
  warmtepomp: 0.1940, // CRE TRV Base 6kVA TTC, maart 2026 (stabiel tot aug 2026)
  elektrisch: 0.1940, // CRE TRV Base 6kVA TTC, maart 2026 (stabiel tot aug 2026)
  hout: 0.047,        // ADEME Barometre chauffage bois 2025 (EUR 85/stere / 1800 kWh/stere PCI)
  propaan: 0.268,     // DGEC Pegase barometer GPL, Q1 2026 (EUR 1,90/L / 7,1 kWh/L PCI)
};

export const DEFAULT_EXPORT_TARIEF = 0.04; // EUR/kWh - S21 surplus <=9 kWc, Q1 2026

// ─── Prijsbronnen voor weergave in grondslagen ──────────────────────────────

export interface PrijsBron {
  label: string;
  prijsPerKwh: string;
  bron: string;
}

export const PRIJS_BRONNEN: Record<string, PrijsBron> = {
  elektriciteit: {
    label: 'Elektriciteit',
    prijsPerKwh: '0,1940 EUR/kWh TTC',
    bron: 'CRE TRV Base 6kVA, maart 2026 (stabiel tot aug 2026)',
  },
  gas: {
    label: 'Gas',
    prijsPerKwh: '0,1051 EUR/kWh PCI',
    bron: 'CRE Prix Repere chauffage, mars 2026',
  },
  stookolie: {
    label: 'Fioul (stookolie)',
    prijsPerKwh: '0,119 EUR/kWh (1,19 EUR/L)',
    bron: 'DGEC Pegase + FioulReduc.com barometer, mars 2026',
  },
  hout: {
    label: 'Hout',
    prijsPerKwh: '0,047 €/kWh (85 €/stère, 1.800 kWh/stère PCI)',
    bron: 'ADEME Baromètre chauffage bois 2025',
  },
  propaan: {
    label: 'Propaan',
    prijsPerKwh: '0,268 €/kWh (1,90 €/L, 7,1 kWh/L PCI)',
    bron: 'DGEC Pégase barometer GPL, Q1 2026',
  },
  pvExport: {
    label: 'PV-export',
    prijsPerKwh: '0,04 €/kWh',
    bron: 'S21 surplus ≤9 kWc, Q1 2026',
  },
};

// ─── Conversie naar kWh (PCI) ───────────────────────────────────────────────

export const KWH_CONVERSION: Record<string, number> = {
  elec: 1,
  gas: 10,        // 1 m³ ≈ 10 kWh
  fioul: 10,      // 1 L ≈ 10 kWh
  pellet: 4.8,    // 1 kg ≈ 4,8 kWh
  wood: 1800,     // 1 stère ≈ 1800 kWh
  propaan: 7.1,   // 1 L ≈ 7,1 kWh
};

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

// ─── Isolatieniveaus per bouwdeel ────────────────────────────────────────────

export interface IsolatieNiveau {
  id: string;
  label: string;
  uWaarde: (huisTypeId: string) => number;
}

export const ISOLATIE_MUUR: IsolatieNiveau[] = [
  { id: 'geen', label: 'Geen isolatie', uWaarde: (ht) => {
    const oud = ['longere','colombage','pierre','pavillon','appartement-oud'];
    return oud.includes(ht) ? 2.5 : 1.5;
  }},
  { id: 'basis', label: 'Basis (5–8 cm)', uWaarde: () => 0.6 },
  { id: 'goed', label: 'Goed (10–15 cm)', uWaarde: () => 0.3 },
  { id: 'uitstekend', label: 'Uitstekend (>15 cm)', uWaarde: () => 0.18 },
];

export const ISOLATIE_DAK: IsolatieNiveau[] = [
  { id: 'geen', label: 'Geen isolatie', uWaarde: (ht) => {
    const oud = ['longere','pavillon'];
    return oud.includes(ht) ? 3.0 : 2.0;
  }},
  { id: 'basis', label: 'Basis (10 cm)', uWaarde: () => 0.4 },
  { id: 'goed', label: 'Goed (20 cm)', uWaarde: () => 0.2 },
  { id: 'uitstekend', label: 'Uitstekend (>25 cm)', uWaarde: () => 0.14 },
];

export const ISOLATIE_VLOER: IsolatieNiveau[] = [
  { id: 'geen', label: 'Geen isolatie', uWaarde: () => 1.2 },
  { id: 'basis', label: 'Basis (5 cm)', uWaarde: () => 0.5 },
  { id: 'goed', label: 'Goed (10 cm)', uWaarde: () => 0.3 },
  { id: 'uitstekend', label: 'Uitstekend (>12 cm)', uWaarde: () => 0.2 },
];

export const ISOLATIE_RAAM: { id: string; label: string; uWaarde: number }[] = [
  { id: 'enkel', label: 'Enkel glas', uWaarde: 5.8 },
  { id: 'dubbel', label: 'Dubbel glas', uWaarde: 2.9 },
  { id: 'hr-plus', label: 'HR+', uWaarde: 1.8 },
  { id: 'hr-plusplus', label: 'HR++', uWaarde: 1.2 },
  { id: 'triple', label: 'Triple', uWaarde: 0.7 },
];

// ─── PV-oriëntatie correctiefactoren ─────────────────────────────────────────

export const PV_ORIENTATION_FACTOR: { id: string; label: string; factor: number }[] = [
  { id: 'zuid', label: 'Zuid', factor: 1.00 },
  { id: 'zuidoost', label: 'Zuid-oost / Zuid-west', factor: 0.95 },
  { id: 'oostwest', label: 'Oost / West', factor: 0.85 },
  { id: 'noordoost', label: 'Noord-oost / Noord-west', factor: 0.70 },
  { id: 'noord', label: 'Noord', factor: 0.55 },
  { id: 'plat', label: 'Plat dak', factor: 0.90 },
];

export const PV_TILT_FACTOR: { id: string; label: string; factor: number }[] = [
  { id: 'optimaal', label: 'Optimaal (30–35°)', factor: 1.00 },
  { id: 'steil', label: 'Steil (> 45°)', factor: 0.90 },
  { id: 'vlak', label: 'Vlak (< 15°)', factor: 0.90 },
];
