/**
 * calculations.ts — Minimal calculation functions powered by toolState.
 * These are deterministic, pure functions: no side effects.
 */

export interface CalculationInput {
  oppervlakte?: number | string;
  bouwjaar?: number | string;
  isolatie?: string;
  verwarming?: string;
  /** Expert mode: wall insulation level */
  muurIsolatie?: string;
  /** Expert mode: roof insulation level */
  dakIsolatie?: string;
  /** Expert mode: window glazing type */
  raamType?: string;
}

export interface CalculationResult {
  /** Estimated annual energy consumption in kWh */
  jaarverbruikKwh: number;
  /** DPE label estimate (A–G) */
  dpeLabel: string;
  /** CO₂ emission estimate in kg/year */
  co2Kg: number;
  /** Estimated annual energy cost in EUR */
  kostenEur: number;
  /** Design heat load in W (warmteverlies) */
  warmteverliesW: number;
  /** True when result is based on expert U-value model */
  isExpertCalc: boolean;
}

const ISOLATIE_FACTOR: Record<string, number> = {
  slecht: 200,
  matig: 150,
  goed: 100,
  uitstekend: 50,
};

const VERWARMING_CO2_FACTOR: Record<string, number> = {
  gas: 0.205,
  stookolie: 0.265,
  warmtepomp: 0.055,
  elektrisch: 0.055,
  hout: 0.03,
};

const VERWARMING_PRIJS_KWH: Record<string, number> = {
  gas: 0.12,
  stookolie: 0.14,
  warmtepomp: 0.08,
  elektrisch: 0.25,
  hout: 0.06,
};

/** U-values [W/(m²·K)] per muur insulation level */
const MUUR_U: Record<string, number> = {
  geen: 1.5,
  matig: 0.6,
  goed: 0.3,
  uitstekend: 0.15,
};

/** U-values [W/(m²·K)] per dak insulation level */
const DAK_U: Record<string, number> = {
  geen: 1.2,
  matig: 0.5,
  goed: 0.25,
  uitstekend: 0.10,
};

/** U-values [W/(m²·K)] per raamtype */
const RAAM_U: Record<string, number> = {
  enkel: 5.0,
  dubbel: 2.8,
  hr: 1.1,
};

/**
 * France heating season: ~2 400 degree-days (base 17 °C).
 * Design outdoor temperature: −10 °C → ΔT_design = 31 K.
 */
const DEGREE_HOURS = 2400 * 24; // K·h / year
const DELTA_T_DESIGN = 31; // K

function dpeFromKwhM2(kwhPerM2: number): string {
  if (kwhPerM2 < 50) return 'A';
  if (kwhPerM2 < 90) return 'B';
  if (kwhPerM2 < 150) return 'C';
  if (kwhPerM2 < 230) return 'D';
  if (kwhPerM2 < 330) return 'E';
  if (kwhPerM2 < 450) return 'F';
  return 'G';
}

/**
 * Expert calculation using U-value physics.
 * Uses wall (2.5× floor area ratio), roof (1:1), windows (20% of floor),
 * plus a simplified ventilation term of 0.5 W/(K·m²).
 */
function calculateExpert(input: CalculationInput): CalculationResult {
  const oppervlakte = Number(input.oppervlakte) || 100;
  const co2Factor = VERWARMING_CO2_FACTOR[input.verwarming ?? 'gas'] ?? 0.205;
  const prijsKwh = VERWARMING_PRIJS_KWH[input.verwarming ?? 'gas'] ?? 0.12;

  const H_muur = (MUUR_U[input.muurIsolatie ?? 'matig'] ?? MUUR_U.matig) * 2.5;
  const H_dak = (DAK_U[input.dakIsolatie ?? 'matig'] ?? DAK_U.matig) * 1.0;
  const H_raam = (RAAM_U[input.raamType ?? 'dubbel'] ?? RAAM_U.dubbel) * 0.2;
  const H_vent = 0.5; // simplified ventilation W/(K·m²)
  const H_total = oppervlakte * (H_muur + H_dak + H_raam + H_vent); // W/K

  const warmteverliesW = Math.round(H_total * DELTA_T_DESIGN);
  const jaarverbruikKwh = Math.round((H_total * DEGREE_HOURS) / 1000);
  const kwhPerM2 = jaarverbruikKwh / oppervlakte;

  return {
    jaarverbruikKwh,
    dpeLabel: dpeFromKwhM2(kwhPerM2),
    co2Kg: Math.round(jaarverbruikKwh * co2Factor),
    kostenEur: Math.round(jaarverbruikKwh * prijsKwh),
    warmteverliesW,
    isExpertCalc: true,
  };
}

export function calculate(input: CalculationInput): CalculationResult {
  // Normalise empty strings to undefined so callers don't need to
  const muurIsolatie = input.muurIsolatie || undefined;
  const dakIsolatie = input.dakIsolatie || undefined;
  const raamType = input.raamType || undefined;

  // Switch to expert U-value model when expert fields have been filled in
  if (muurIsolatie && dakIsolatie && raamType) {
    return calculateExpert({ ...input, muurIsolatie, dakIsolatie, raamType });
  }

  const oppervlakte = Number(input.oppervlakte) || 100;
  const isolatieFactor = ISOLATIE_FACTOR[input.isolatie ?? 'matig'] ?? 150;
  const co2Factor = VERWARMING_CO2_FACTOR[input.verwarming ?? 'gas'] ?? 0.205;
  const prijsKwh = VERWARMING_PRIJS_KWH[input.verwarming ?? 'gas'] ?? 0.12;

  const jaarverbruikKwh = oppervlakte * isolatieFactor;
  const kwhPerM2 = isolatieFactor; // simplified: factor IS kWh/m²
  const dpeLabel = dpeFromKwhM2(kwhPerM2);
  const co2Kg = jaarverbruikKwh * co2Factor;
  const kostenEur = jaarverbruikKwh * prijsKwh;

  // Estimate design heat load from annual energy (assumes ~2 000 full-load hours)
  const warmteverliesW = Math.round((jaarverbruikKwh / 2000) * 1000);

  return {
    jaarverbruikKwh: Math.round(jaarverbruikKwh),
    dpeLabel,
    co2Kg: Math.round(co2Kg),
    kostenEur: Math.round(kostenEur),
    warmteverliesW,
    isExpertCalc: false,
  };
}
