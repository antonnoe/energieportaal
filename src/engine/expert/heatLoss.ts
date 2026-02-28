/**
 * heatLoss.ts — Expert heat-loss + annual energy engine.
 * All functions are pure (no side-effects) and deterministic.
 *
 * Physical basis:
 *  - EN ISO 13790 simplified monthly method concept
 *  - UA = Σ(A × U)  [W/K]
 *  - Qvent = ρ·cp · ACH · V / 3600   [W/K]  (ρ·cp ≈ 0.335 Wh/(m³·K))
 *  - Annual heating demand = (UA + Qvent) × HDD × 24  [Wh] ÷ SCOP
 */

// ─── U-value tables (W/m²·K) ─────────────────────────────────────────────────

export const U_MUR: Record<string, number> = {
  geen: 1.5,
  matig: 0.5,
  goed: 0.25,
  uitstekend: 0.15,
};

export const U_DAK: Record<string, number> = {
  geen: 2.0,
  matig: 0.35,
  goed: 0.20,
  uitstekend: 0.12,
};

export const U_VLOER: Record<string, number> = {
  geen: 0.80,
  matig: 0.40,
  goed: 0.25,
  uitstekend: 0.15,
};

export const U_RAAM: Record<string, number> = {
  enkel: 5.8,
  dubbel: 2.8,
  hr: 1.1,
};

// ─── Climate zones — Heating Degree Days (base 18 °C) ────────────────────────

export const KLIMAATZONES: Record<string, { label: string; hdd: number; pvYield: number }> = {
  H1a: { label: 'H1a — Nord / Pas-de-Calais', hdd: 3100, pvYield: 950 },
  H1b: { label: 'H1b — Île-de-France / Paris', hdd: 2800, pvYield: 1100 },
  H1c: { label: 'H1c — Grand Est / Alsace', hdd: 3000, pvYield: 1050 },
  H2a: { label: 'H2a — Bretagne / Normandie', hdd: 2400, pvYield: 1050 },
  H2b: { label: 'H2b — Centre / Val de Loire', hdd: 2200, pvYield: 1150 },
  H2c: { label: 'H2c — Rhône-Alpes / Auvergne', hdd: 2500, pvYield: 1200 },
  H2d: { label: 'H2d — Nouvelle-Aquitaine', hdd: 1900, pvYield: 1300 },
  H3:  { label: 'H3 — PACA / Méditerranée', hdd: 1500, pvYield: 1500 },
};

// ─── Ventilation types ────────────────────────────────────────────────────────

export type VentilatieType = 'naturel' | 'mécanique' | 'hrv';

const VENTILATIE_ACH: Record<VentilatieType, number> = {
  naturel: 0.7,
  mécanique: 0.5,
  hrv: 0.5,
};

// ─── Heating system SCOP / efficiency ────────────────────────────────────────

export const SCOP: Record<string, number> = {
  gas: 0.90,
  stookolie: 0.85,
  warmtepomp: 3.5,
  elektrisch: 1.0,
  hout: 0.75,
};

// CO₂ factors (kgCO₂/kWh delivered fuel/electricity)
export const CO2_FACTOR: Record<string, number> = {
  gas: 0.205,
  stookolie: 0.265,
  warmtepomp: 0.055,  // electricity grid mix
  elektrisch: 0.055,
  hout: 0.030,
};

// Price per kWh delivered fuel/electricity (€)
export const PRIJS_KWH: Record<string, number> = {
  gas: 0.12,
  stookolie: 0.14,
  warmtepomp: 0.25,   // electricity tariff
  elektrisch: 0.25,
  hout: 0.06,
  elektriciteit: 0.25,
};

// ─── Input / Output types ─────────────────────────────────────────────────────

export interface ExpertInput {
  // Basic (from Snel advies)
  oppervlakte: number;    // m²  living area
  bouwjaar: number;
  verwarming: string;     // gas / stookolie / warmtepomp / elektrisch / hout

  // Envelope
  muurOppervlak: number;  // m²
  dakOppervlak: number;
  vloerOppervlak: number;
  raamOppervlak: number;
  muurIsolatie: string;   // geen / matig / goed / uitstekend
  dakIsolatie: string;
  vloerIsolatie: string;
  raamType: string;       // enkel / dubbel / hr

  // Ventilation
  ventilatieType: VentilatieType;
  hrvEfficientie: number; // 0–1  (only used when type=hrv)

  // Heating
  verwarmingScop: number; // override SCOP (0 = use default)
  stookgrens: number;     // °C, default 18

  // Climate
  klimaatzone: string;    // key of KLIMAATZONES

  // DHW
  dhwPersonen: number;    // persons

  // Electricity
  basisElektriciteit: number; // kWh/y

  // EV
  heeftEV: boolean;
  evKmPerJaar: number;

  // PV
  heeftPV: boolean;
  pvVermogen: number;     // kWp
  pvZelfverbruik: number; // fraction 0–1
  exportTarief: number;   // €/kWh
}

export interface ExpertResult {
  /** Transmission heat-loss coefficient UA [W/K] */
  uaWK: number;
  /** Ventilation heat-loss coefficient [W/K] */
  qventWK: number;
  /** Annual space-heating final energy [kWh/y] */
  verwarmingKwh: number;
  /** Annual DHW energy [kWh/y] */
  dhwKwh: number;
  /** Annual base electricity [kWh/y] */
  elektriciteitKwh: number;
  /** Annual EV electricity [kWh/y] */
  evKwh: number;
  /** Total household final energy demand [kWh/y] */
  totaalKwh: number;
  /** Annual PV production [kWh/y] */
  pvProductieKwh: number;
  /** PV self-consumption [kWh/y] */
  pvZelfverbruikKwh: number;
  /** PV export [kWh/y] */
  pvExportKwh: number;
  /** Net electricity from grid [kWh/y] */
  netGridKwh: number;
  /** Annual CO₂ [kg/y] */
  co2Kg: number;
  /** Annual energy cost [€/y] */
  kostenEur: number;
  /** Annual PV savings + export revenue [€/y] */
  pvBesparing: number;
  /** Net annual cost [€/y] */
  netKostenEur: number;
  /** kWh/m² primary energy (for DPE estimation) */
  kwhPerM2: number;
  /** DPE label */
  dpeLabel: string;
  /** Debug breakdown */
  debug: Record<string, number>;
}

// ─── Pure calculation functions ───────────────────────────────────────────────

export function calcUA(input: Pick<ExpertInput,
  'muurOppervlak' | 'dakOppervlak' | 'vloerOppervlak' | 'raamOppervlak' |
  'muurIsolatie' | 'dakIsolatie' | 'vloerIsolatie' | 'raamType'>
): number {
  const uMur = U_MUR[input.muurIsolatie] ?? U_MUR.matig;
  const uDak = U_DAK[input.dakIsolatie] ?? U_DAK.matig;
  const uVloer = U_VLOER[input.vloerIsolatie] ?? U_VLOER.geen;
  const uRaam = U_RAAM[input.raamType] ?? U_RAAM.dubbel;

  return (
    input.muurOppervlak * uMur +
    input.dakOppervlak * uDak +
    input.vloerOppervlak * uVloer +
    input.raamOppervlak * uRaam
  );
}

export function calcQvent(
  oppervlakte: number,
  hoogte: number,
  ventilatieType: VentilatieType,
  hrvEfficientie: number
): number {
  const volume = oppervlakte * hoogte;
  const ach = VENTILATIE_ACH[ventilatieType] ?? 0.5;
  const etaHrv = ventilatieType === 'hrv' ? Math.min(1, Math.max(0, hrvEfficientie)) : 0;
  // Qvent [W/K] = 0.335 * ACH * V * (1 - η_hrv)
  return 0.335 * ach * volume * (1 - etaHrv);
}

export function dpeFromKwhM2(kwhPerM2: number): string {
  if (kwhPerM2 < 50)  return 'A';
  if (kwhPerM2 < 90)  return 'B';
  if (kwhPerM2 < 150) return 'C';
  if (kwhPerM2 < 230) return 'D';
  if (kwhPerM2 < 330) return 'E';
  if (kwhPerM2 < 450) return 'F';
  return 'G';
}

export function calculateExpert(input: ExpertInput): ExpertResult {
  const zone = KLIMAATZONES[input.klimaatzone] ?? KLIMAATZONES['H1b'];
  const hdd = zone.hdd;

  // Envelope heat loss
  const uaWK = calcUA(input);

  // Ventilation heat loss (assume 2.5 m ceiling height)
  const qventWK = calcQvent(input.oppervlakte, 2.5, input.ventilatieType, input.hrvEfficientie);

  const totalHLW = uaWK + qventWK; // W/K

  // Annual heating demand (final energy) [kWh/y]
  const scop = input.verwarmingScop > 0
    ? input.verwarmingScop
    : (SCOP[input.verwarming] ?? 0.9);
  // Heating load [kWh thermal] = (UA + Qvent) [W/K] × HDD × 24h / 1000
  const verwarmingThermisch = (totalHLW * hdd * 24) / 1000;
  const verwarmingKwh = verwarmingThermisch / scop;

  // DHW [kWh/y] — 50 L/person/day at ΔT=35 K, ρ=1 kg/L, cp=1.16 Wh/(kg·K)
  const dhwKwh = input.dhwPersonen * 50 * 365 * 1.16 * 35 / 1000;

  // Base electricity
  const elektriciteitKwh = input.basisElektriciteit;

  // EV (average consumption 0.20 kWh/km)
  const evKwh = input.heeftEV ? input.evKmPerJaar * 0.20 : 0;

  // Total demand
  const totaalKwh = verwarmingKwh + dhwKwh + elektriciteitKwh + evKwh;

  // PV production
  const pvProductieKwh = input.heeftPV ? input.pvVermogen * zone.pvYield : 0;
  const pvZelfverbruikKwh = pvProductieKwh * Math.min(1, input.pvZelfverbruik);
  const pvExportKwh = pvProductieKwh - pvZelfverbruikKwh;
  const netGridKwh = Math.max(0, totaalKwh - pvZelfverbruikKwh);

  // CO₂ — simplified: split by fuel type
  const co2Verwarming = verwarmingKwh * (CO2_FACTOR[input.verwarming] ?? 0.205);
  const co2Elektriciteit = (elektriciteitKwh + evKwh) * 0.055;
  const co2Grid = netGridKwh * 0.055;
  const co2Kg = Math.round(
    (input.verwarming === 'warmtepomp' || input.verwarming === 'elektrisch')
      ? co2Grid + dhwKwh * (CO2_FACTOR[input.verwarming] ?? 0.055)
      : co2Verwarming + co2Elektriciteit
  );

  // Costs
  const prijsVerwarming = PRIJS_KWH[input.verwarming] ?? 0.12;
  const kostenVerwarming = verwarmingKwh * prijsVerwarming;
  const kostenDhw = dhwKwh * prijsVerwarming;
  const kostenElektriciteit = (elektriciteitKwh + evKwh) * PRIJS_KWH.elektriciteit;
  const kostenEur = Math.round(kostenVerwarming + kostenDhw + kostenElektriciteit);

  // PV savings
  const pvBesparing = Math.round(
    pvZelfverbruikKwh * PRIJS_KWH.elektriciteit +
    pvExportKwh * input.exportTarief
  );
  const netKostenEur = Math.max(0, kostenEur - pvBesparing);

  // DPE estimate (primary energy kWh/m²·y — simplified PE factor)
  const peFactor = input.verwarming === 'elektrisch' || input.verwarming === 'warmtepomp' ? 2.3 : 1.0;
  const kwhPerM2 = (verwarmingKwh * peFactor) / Math.max(1, input.oppervlakte);
  const dpeLabel = dpeFromKwhM2(kwhPerM2);

  return {
    uaWK: Math.round(uaWK * 10) / 10,
    qventWK: Math.round(qventWK * 10) / 10,
    verwarmingKwh: Math.round(verwarmingKwh),
    dhwKwh: Math.round(dhwKwh),
    elektriciteitKwh: Math.round(elektriciteitKwh),
    evKwh: Math.round(evKwh),
    totaalKwh: Math.round(totaalKwh),
    pvProductieKwh: Math.round(pvProductieKwh),
    pvZelfverbruikKwh: Math.round(pvZelfverbruikKwh),
    pvExportKwh: Math.round(pvExportKwh),
    netGridKwh: Math.round(netGridKwh),
    co2Kg,
    kostenEur,
    pvBesparing,
    netKostenEur,
    kwhPerM2: Math.round(kwhPerM2),
    dpeLabel,
    debug: {
      uaWK,
      qventWK,
      totalHLW,
      hdd,
      verwarmingThermisch: Math.round(verwarmingThermisch),
      scop,
    },
  };
}

/**
 * Derive a sensible ExpertInput from the ToolState strings.
 * Any field not set falls back to a reasonable default.
 */
export function expertInputFromState(state: Record<string, string>): ExpertInput {
  const oppervlakte = Number(state.oppervlakte) || 100;

  return {
    oppervlakte,
    bouwjaar: Number(state.bouwjaar) || 1980,
    verwarming: state.verwarming || 'gas',

    muurOppervlak: Number(state.muurOppervlak) || oppervlakte * 1.2,
    dakOppervlak:  Number(state.dakOppervlak)  || oppervlakte * 0.8,
    vloerOppervlak: Number(state.vloerOppervlak) || oppervlakte * 0.8,
    raamOppervlak: Number(state.raamOppervlak) || oppervlakte * 0.15,

    muurIsolatie:  state.muurIsolatie  || 'geen',
    dakIsolatie:   state.dakIsolatie   || 'geen',
    vloerIsolatie: state.vloerIsolatie || 'geen',
    raamType:      state.raamType      || 'enkel',

    ventilatieType: (state.ventilatieType as VentilatieType) || 'naturel',
    hrvEfficientie: Number(state.hrvEfficientie) / 100 || 0.75,

    verwarmingScop: Number(state.verwarmingScop) || 0,
    stookgrens: Number(state.stookgrens) || 18,

    klimaatzone: state.klimaatzone || 'H1b',

    dhwPersonen: Number(state.dhwPersonen) || 2,
    basisElektriciteit: Number(state.basisElektriciteit) || 2500,

    heeftEV: state.heeftEV === 'ja',
    evKmPerJaar: Number(state.evKmPerJaar) || 15000,

    heeftPV: state.heeftPV === 'ja',
    pvVermogen: Number(state.pvVermogen) || 3,
    pvZelfverbruik: Number(state.pvZelfverbruik) / 100 || 0.3,
    exportTarief: Number(state.exportTarief) || 0.06,
  };
}
