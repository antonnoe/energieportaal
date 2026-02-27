/**
 * calculations.ts — Minimal calculation functions powered by toolState.
 * These are deterministic, pure functions: no side effects.
 */

export interface CalculationInput {
  oppervlakte?: number | string;
  bouwjaar?: number | string;
  isolatie?: string;
  verwarming?: string;
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

function dpeFromKwhM2(kwhPerM2: number): string {
  if (kwhPerM2 < 50) return 'A';
  if (kwhPerM2 < 90) return 'B';
  if (kwhPerM2 < 150) return 'C';
  if (kwhPerM2 < 230) return 'D';
  if (kwhPerM2 < 330) return 'E';
  if (kwhPerM2 < 450) return 'F';
  return 'G';
}

export function calculate(input: CalculationInput): CalculationResult {
  const oppervlakte = Number(input.oppervlakte) || 100;
  const isolatieFactor = ISOLATIE_FACTOR[input.isolatie ?? 'matig'] ?? 150;
  const co2Factor = VERWARMING_CO2_FACTOR[input.verwarming ?? 'gas'] ?? 0.205;
  const prijsKwh = VERWARMING_PRIJS_KWH[input.verwarming ?? 'gas'] ?? 0.12;

  const jaarverbruikKwh = oppervlakte * isolatieFactor;
  const kwhPerM2 = isolatieFactor; // simplified: factor IS kWh/m²
  const dpeLabel = dpeFromKwhM2(kwhPerM2);
  const co2Kg = jaarverbruikKwh * co2Factor;
  const kostenEur = jaarverbruikKwh * prijsKwh;

  return {
    jaarverbruikKwh: Math.round(jaarverbruikKwh),
    dpeLabel,
    co2Kg: Math.round(co2Kg),
    kostenEur: Math.round(kostenEur),
  };
}
