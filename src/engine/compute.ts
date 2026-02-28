/**
 * compute.ts — Hoofdberekening van het EnergiePortaal.
 *
 * Eén pure functie: invoer → volledig resultaatobject + debug.
 * Alle formules volgen de specificaties uit CLAUDE.md.
 *
 * Fysische basis:
 *   UA = Σ(A_i × U_i)                     — transmissieverlies [W/K]
 *   Hvent = 0.34 × volume × ACH            — ventilatieverlies [W/K]
 *   HventEff = Hvent × (1 - η_HRV)         — na warmteterugwinning
 *   H = UA + HventEff                       — totaal [W/K]
 *
 *   HDD_present = zone.hdd × max(0, (setpoint - Tref) / (18 - Tref))
 *   HDD_away    = zone.hdd × max(0, (awaySetpoint - Tref) / (18 - Tref))
 *
 *   heatDemand = H × ((HDD_present × daysPresent/365) + (HDD_away × daysAway/365)) × 24 / 1000
 *
 *   mainInput = heatDemand × mainFrac / mainEff
 *   auxInput  = heatDemand × auxFrac / auxEff
 *
 *   dhwThermal = (personen × douches/dag × liters × 365 × (40-12) × 4.186) / 3600
 *   dhwInput   = dhwThermal / dhwEff
 */

import type { PortaalInput, PortaalResult, DebugInfo, VerwarmingType } from './types.ts';
import {
  getZoneById,
  DEFAULT_EFFICIENCY,
  CO2_FACTOR,
  DEFAULT_PRIJZEN,
  RHO_CP_LUCHT,
  CP_WATER,
  ZWEMBAD_VERLIES_PER_M2,
  DEFAULTS,
} from './constants.ts';
import { berekenDPE } from './dpe.ts';

// ─── Deelberekeningen (exporteerbaar voor tests) ─────────────────────────────

/**
 * Transmissie warmteverliescoëfficiënt UA [W/K].
 * UA = Σ(A_i × U_i) voor muur, dak, vloer, ramen.
 */
export function calcUA(input: Pick<PortaalInput,
  'oppervlakMuur' | 'oppervlakDak' | 'oppervlakVloer' | 'oppervlakRaam' |
  'uMuur' | 'uDak' | 'uVloer' | 'uRaam'>
): { total: number; muur: number; dak: number; vloer: number; raam: number } {
  const muur = input.oppervlakMuur * input.uMuur;
  const dak = input.oppervlakDak * input.uDak;
  const vloer = input.oppervlakVloer * input.uVloer;
  const raam = input.oppervlakRaam * input.uRaam;
  return { total: muur + dak + vloer + raam, muur, dak, vloer, raam };
}

/**
 * Ventilatie warmteverliescoëfficiënt [W/K].
 * Hvent = 0.34 × volume × ACH
 * HventEff = Hvent × (1 - η_HRV) als WTW, anders Hvent
 */
export function calcHvent(
  volume: number,
  ach: number,
  hasHRV: boolean,
  hrvEfficiency: number
): { hventVoorHRV: number; hventEff: number } {
  const hventVoorHRV = RHO_CP_LUCHT * volume * ach;
  const eta = hasHRV ? Math.min(1, Math.max(0, hrvEfficiency)) : 0;
  const hventEff = hventVoorHRV * (1 - eta);
  return { hventVoorHRV, hventEff };
}

/**
 * Gecorrigeerde graaddagen op basis van stookgedrag.
 *
 * HDD_corr = zone.hdd × max(0, (setpoint - Tref) / (18 - Tref))
 */
export function calcHDDCorrected(
  hddBasis: number,
  setpoint: number,
  Tref: number
): number {
  const denom = 18 - Tref;
  if (denom <= 0) return hddBasis;
  return hddBasis * Math.max(0, (setpoint - Tref) / denom);
}

/**
 * Thermische warmtevraag [kWh/jaar].
 *
 * heatDemand = H × ((HDD_present × fracPresent) + (HDD_away × fracAway)) × 24 / 1000
 */
export function calcWarmtevraag(
  hTotaal: number,
  hddPresent: number,
  hddAway: number,
  daysPresent: number,
  daysAway: number
): number {
  const fracPresent = daysPresent / 365;
  const fracAway = daysAway / 365;
  return hTotaal * (hddPresent * fracPresent + hddAway * fracAway) * 24 / 1000;
}

/**
 * Tapwater thermische vraag [kWh/jaar].
 *
 * dhwThermal = (personen × douches/dag × liters × 365 × ΔT × 4.186) / 3600
 * ΔT = 40 - 12 = 28 °C (verwarming van 12°C naar 40°C)
 */
export function calcDHWThermisch(
  personen: number,
  douchesPerDag: number,
  literPerDouche: number
): number {
  const deltaT = 40 - 12; // koud water (12°C) → warm (40°C)
  return (personen * douchesPerDag * literPerDouche * 365 * deltaT * CP_WATER) / 3600;
}

/**
 * Zwembad energieverbruik [kWh/seizoen].
 * Schatting op basis van oppervlak, temperatuurverschil en maanden actief.
 */
export function calcZwembadKwh(
  oppervlak: number,
  maanden: number,
  poolTemp: number
): number {
  if (oppervlak <= 0 || maanden <= 0) return 0;
  const gemBuitenTemp = poolTemp - 5; // grove schatting omgevingstemperatuur
  const deltaT = Math.max(0, 28 - gemBuitenTemp); // zwembad op ~28°C
  const uren = maanden * 30 * 24;
  return (ZWEMBAD_VERLIES_PER_M2 * oppervlak * deltaT * uren) / 1000;
}

/**
 * Koeling energieverbruik [kWh/jaar].
 * Schatting op basis van CDD en woonoppervlak.
 */
export function calcKoelingKwh(
  cdd: number,
  woonoppervlak: number,
  eer: number
): number {
  if (cdd <= 0) return 0;
  // Benaderingsformule: koellast ≈ 30 W/m² × CDD-uren / EER
  const koelUren = cdd * 8; // geschat aantal actieve koeluren
  return (30 * woonoppervlak * koelUren) / (eer * 1000);
}

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

function getEfficiency(type: VerwarmingType, override: number): number {
  if (override > 0) return override;
  return DEFAULT_EFFICIENCY[type] ?? 1.0;
}

function getPrijsPerKwh(
  type: VerwarmingType,
  prijzen: { gas: number; stookolie: number; elektriciteit: number; hout: number }
): number {
  switch (type) {
    case 'gas': return prijzen.gas;
    case 'stookolie': return prijzen.stookolie;
    case 'warmtepomp': return prijzen.elektriciteit;
    case 'elektrisch': return prijzen.elektriciteit;
    case 'hout': return prijzen.hout;
  }
}

// ─── Hoofdberekening ─────────────────────────────────────────────────────────

/**
 * Eén pure functie: invoer → volledig resultaatobject.
 * Bevat debug-object met ELKE tussenstap.
 */
export function compute(input: PortaalInput): PortaalResult {
  const zone = getZoneById(input.zoneId);

  // ── Volume ──
  const volume = input.woonoppervlak * input.verdiepingen * input.plafondHoogte;

  // ── Transmissieverlies UA ──
  const ua = calcUA(input);

  // ── Ventilatieverlies ──
  const hvent = calcHvent(volume, input.ach, input.hasHRV, input.hrvEfficiency);

  // ── Totaal warmteverlies H ──
  const hTotaal = ua.total + hvent.hventEff;

  // ── HDD-correctie op basis van stookgedrag ──
  const hddPresent = calcHDDCorrected(zone.hdd, input.setpoint, zone.Tref);
  const hddAway = calcHDDCorrected(zone.hdd, input.awaySetpoint, zone.Tref);

  // ── Thermische warmtevraag ──
  const warmtevraagThermisch = calcWarmtevraag(
    hTotaal, hddPresent, hddAway, input.daysPresent, input.daysAway
  );

  // ── Verwarmingsenergie (na SCOP/rendement) ──
  const mainFrac = 1 - Math.min(0.9, Math.max(0, input.auxFraction));
  const auxFrac = Math.min(0.9, Math.max(0, input.auxFraction));

  const mainEff = getEfficiency(input.mainHeating, input.mainEfficiency);
  const auxEff = input.auxHeating !== 'geen'
    ? getEfficiency(input.auxHeating, input.auxEfficiency)
    : 1;

  const verwarmingHoofd = warmtevraagThermisch * mainFrac / mainEff;
  const verwarmingBij = input.auxHeating !== 'geen'
    ? warmtevraagThermisch * auxFrac / auxEff
    : 0;
  const verwarmingTotaal = verwarmingHoofd + verwarmingBij;

  // ── Tapwater (DHW) ──
  const dhwThermisch = calcDHWThermisch(
    input.personen, input.douchesPerDag, input.literPerDouche
  );
  const dhwEff = getEfficiency(input.dhwSystem, input.dhwEfficiency);
  const dhwInput = dhwThermisch / dhwEff;

  // ── Elektriciteit ──
  const elektriciteitBasis = input.basisElektriciteit;
  const evKwh = input.hasEV ? input.evKmPerJaar * input.evVerbruik : 0;

  // ── Zwembad ──
  const zwembadKwh = input.hasZwembad
    ? calcZwembadKwh(input.zwembadOppervlak, input.zwembadMaanden, zone.pool_temp)
    : 0;

  // ── Koeling ──
  const koelingKwh = input.hasKoeling
    ? calcKoelingKwh(zone.cdd, input.woonoppervlak, input.koelingEER)
    : 0;

  // ── Totaal verbruik ──
  const totaalVerbruikKwh = verwarmingTotaal + dhwInput + elektriciteitBasis + evKwh + zwembadKwh + koelingKwh;

  // ── PV ──
  const pvProductieKwh = input.hasPV ? input.pvVermogen * zone.pv : 0;
  const pvZelfverbruikKwh = pvProductieKwh * Math.min(1, input.pvZelfverbruik);
  const pvExportKwh = pvProductieKwh - pvZelfverbruikKwh;
  const netGridKwh = Math.max(0, totaalVerbruikKwh - pvZelfverbruikKwh);

  // ── DPE ──
  const kwhPerM2 = totaalVerbruikKwh / Math.max(1, input.woonoppervlak);
  const dpe = berekenDPE(kwhPerM2);

  // ── CO₂ ──
  const prijzen = {
    gas: input.prijsGas || DEFAULT_PRIJZEN.gas,
    stookolie: input.prijsStookolie || DEFAULT_PRIJZEN.stookolie,
    elektriciteit: input.prijsElektriciteit || DEFAULT_PRIJZEN.elektrisch,
    hout: input.prijsHout || DEFAULT_PRIJZEN.hout,
  };

  const co2Hoofdverwarming = verwarmingHoofd * (CO2_FACTOR[input.mainHeating] ?? 0.205);
  const co2Bijverwarming = input.auxHeating !== 'geen'
    ? verwarmingBij * (CO2_FACTOR[input.auxHeating] ?? 0.205)
    : 0;
  const co2Dhw = dhwInput * (CO2_FACTOR[input.dhwSystem] ?? 0.205);
  const co2Elektriciteit = (elektriciteitBasis + evKwh + koelingKwh + zwembadKwh) * CO2_FACTOR.elektrisch;
  const co2Kg = Math.round(co2Hoofdverwarming + co2Bijverwarming + co2Dhw + co2Elektriciteit);

  // ── Kosten ──
  const kostenVerwarming =
    verwarmingHoofd * getPrijsPerKwh(input.mainHeating, prijzen) +
    (input.auxHeating !== 'geen'
      ? verwarmingBij * getPrijsPerKwh(input.auxHeating, prijzen)
      : 0);

  const kostenDhw = dhwInput * getPrijsPerKwh(input.dhwSystem, prijzen);
  const kostenElektriciteit = (elektriciteitBasis + evKwh + koelingKwh + zwembadKwh) * prijzen.elektriciteit;
  const kostenTotaal = kostenVerwarming + kostenDhw + kostenElektriciteit;

  const pvBesparing =
    pvZelfverbruikKwh * prijzen.elektriciteit +
    pvExportKwh * (input.exportTarief || 0.06);
  const nettoKosten = Math.max(0, kostenTotaal - pvBesparing);

  // ── Debug ──
  const debug: DebugInfo = {
    zone,
    huisType: input.huisTypeId,
    uaMuur: ua.muur,
    uaDak: ua.dak,
    uaVloer: ua.vloer,
    uaRaam: ua.raam,
    volume,
    achGebruikt: input.ach,
    hventVoorHRV: hvent.hventVoorHRV,
    setpoint: input.setpoint,
    awaySetpoint: input.awaySetpoint,
    Tref: zone.Tref,
    hddBasis: zone.hdd,
    hddCorrPresent: hddPresent,
    hddCorrAway: hddAway,
    fracPresent: input.daysPresent / 365,
    fracAway: input.daysAway / 365,
    mainFrac,
    mainEff,
    auxFrac,
    auxEff,
    dhwLitersPerDag: input.personen * input.douchesPerDag * input.literPerDouche,
    dhwDeltaT: 28,
    dhwEff,
    pvYieldZone: zone.pv,
    prijzen,
  };

  return {
    uaWK: round1(ua.total),
    hventWK: round1(hvent.hventVoorHRV),
    hventEffWK: round1(hvent.hventEff),
    hTotaalWK: round1(hTotaal),
    hddPresent: Math.round(hddPresent),
    hddAway: Math.round(hddAway),
    warmtevraagThermisch: Math.round(warmtevraagThermisch),
    verwarmingHoofd: Math.round(verwarmingHoofd),
    verwarmingBij: Math.round(verwarmingBij),
    verwarmingTotaal: Math.round(verwarmingTotaal),
    dhwThermisch: Math.round(dhwThermisch),
    dhwInput: Math.round(dhwInput),
    elektriciteitBasis: Math.round(elektriciteitBasis),
    evKwh: Math.round(evKwh),
    zwembadKwh: Math.round(zwembadKwh),
    koelingKwh: Math.round(koelingKwh),
    totaalVerbruikKwh: Math.round(totaalVerbruikKwh),
    pvProductieKwh: Math.round(pvProductieKwh),
    pvZelfverbruikKwh: Math.round(pvZelfverbruikKwh),
    pvExportKwh: Math.round(pvExportKwh),
    netGridKwh: Math.round(netGridKwh),
    dpe,
    co2Kg,
    kostenVerwarming: Math.round(kostenVerwarming),
    kostenDhw: Math.round(kostenDhw),
    kostenElektriciteit: Math.round(kostenElektriciteit),
    kostenTotaal: Math.round(kostenTotaal),
    pvBesparing: Math.round(pvBesparing),
    nettoKosten: Math.round(nettoKosten),
    debug,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─── Standaardinvoer (voor als gebruiker nog niet alles ingevuld heeft) ──────

export function createDefaultInput(): PortaalInput {
  return {
    postcode: '',
    departement: '',
    zoneId: 'paris',
    huisTypeId: 'pavillon',
    woonoppervlak: 100,
    verdiepingen: 1,
    plafondHoogte: DEFAULTS.plafondHoogte,
    uMuur: 2.8,
    uDak: 3.0,
    uVloer: 1.2,
    uRaam: 4.0,
    oppervlakMuur: 120,
    oppervlakDak: 80,
    oppervlakVloer: 80,
    oppervlakRaam: 15,
    ach: 0.8,
    mainHeating: 'gas',
    mainEfficiency: 0,
    auxHeating: 'geen',
    auxFraction: 0,
    auxEfficiency: 0,
    hasHRV: false,
    hrvEfficiency: 0.75,
    personen: DEFAULTS.personen,
    douchesPerDag: DEFAULTS.douchesPerDag,
    literPerDouche: DEFAULTS.literPerDouche,
    dhwSystem: 'gas',
    dhwEfficiency: 0,
    basisElektriciteit: DEFAULTS.basisElektriciteit,
    hasEV: false,
    evKmPerJaar: DEFAULTS.evKmPerJaar,
    evVerbruik: DEFAULTS.evVerbruik,
    hasPV: false,
    pvVermogen: DEFAULTS.pvVermogen,
    pvZelfverbruik: DEFAULTS.pvZelfverbruik,
    hasZwembad: false,
    zwembadOppervlak: 32,
    zwembadMaanden: DEFAULTS.zwembadMaanden,
    hasKoeling: false,
    koelingEER: DEFAULTS.koelingEER,
    setpoint: DEFAULTS.setpoint,
    awaySetpoint: DEFAULTS.awaySetpoint,
    daysPresent: DEFAULTS.daysPresent,
    daysAway: DEFAULTS.daysAway,
    prijsGas: DEFAULT_PRIJZEN.gas,
    prijsStookolie: DEFAULT_PRIJZEN.stookolie,
    prijsElektriciteit: DEFAULT_PRIJZEN.elektrisch,
    prijsHout: DEFAULT_PRIJZEN.hout,
    exportTarief: 0.06,
    subsidieIntake: {
      usage: 'rp',
      ageGt2: 'ja',
      stage: 'voor',
      workType: 'onbekend',
      mprPath: 'onbekend',
      heatlossDone: false,
    },
  };
}
