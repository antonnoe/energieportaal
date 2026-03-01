/**
 * compute.test.ts — Unit tests voor de hoofdberekening.
 * Test met bekende invoer → verwachte kWh, kosten, DPE.
 */

import { describe, it, expect } from 'vitest';
import {
  calcUA,
  calcHvent,
  calcHDDCorrected,
  calcWarmtevraag,
  calcDHWThermisch,
  calcZwembadKwh,
  calcKoelingKwh,
  compute,
  createDefaultInput,
} from './compute.ts';

// ─── calcUA ──────────────────────────────────────────────────────────────────

describe('calcUA', () => {
  it('berekent UA correct voor bekende waarden', () => {
    const result = calcUA({
      oppervlakMuur: 180,
      oppervlakDak: 72,
      oppervlakVloer: 72,
      oppervlakRaam: 14,
      uMuur: 2.5,
      uDak: 3.5,
      uVloer: 1.5,
      uRaam: 5.8,
    });

    // 180×2.5 + 72×3.5 + 72×1.5 + 14×5.8 = 450 + 252 + 108 + 81.2 = 891.2
    expect(result.total).toBeCloseTo(891.2, 1);
    expect(result.muur).toBeCloseTo(450, 1);
    expect(result.dak).toBeCloseTo(252, 1);
    expect(result.vloer).toBeCloseTo(108, 1);
    expect(result.raam).toBeCloseTo(81.2, 1);
  });

  it('geeft 0 als alle oppervlakken 0 zijn', () => {
    const result = calcUA({
      oppervlakMuur: 0, oppervlakDak: 0, oppervlakVloer: 0, oppervlakRaam: 0,
      uMuur: 2.5, uDak: 3.5, uVloer: 1.5, uRaam: 5.8,
    });
    expect(result.total).toBe(0);
  });
});

// ─── calcHvent ───────────────────────────────────────────────────────────────

describe('calcHvent', () => {
  it('berekent ventilatie zonder WTW', () => {
    // 0.34 × 300 × 0.9 = 91.8
    const result = calcHvent(300, 0.9, false, 0);
    expect(result.hventVoorHRV).toBeCloseTo(91.8, 1);
    expect(result.hventEff).toBeCloseTo(91.8, 1);
  });

  it('berekent ventilatie met WTW (75%)', () => {
    // 0.34 × 300 × 0.9 = 91.8, met WTW: 91.8 × (1 - 0.75) = 22.95
    const result = calcHvent(300, 0.9, true, 0.75);
    expect(result.hventVoorHRV).toBeCloseTo(91.8, 1);
    expect(result.hventEff).toBeCloseTo(22.95, 1);
  });

  it('begrenst WTW-rendement op 0–1', () => {
    const result = calcHvent(300, 0.9, true, 1.5);
    expect(result.hventEff).toBeCloseTo(0, 1);
  });
});

// ─── calcHDDCorrected ────────────────────────────────────────────────────────

describe('calcHDDCorrected', () => {
  it('corrigeert HDD bij stooktemperatuur 20°C, Tref 12°C', () => {
    // 1400 × max(0, (20 - 12) / (18 - 12)) = 1400 × 8/6 = 1866.67
    const result = calcHDDCorrected(1400, 20, 12);
    expect(result).toBeCloseTo(1866.67, 0);
  });

  it('corrigeert HDD bij stooktemperatuur 16°C, Tref 12°C', () => {
    // 1400 × max(0, (16 - 12) / (18 - 12)) = 1400 × 4/6 = 933.33
    const result = calcHDDCorrected(1400, 16, 12);
    expect(result).toBeCloseTo(933.33, 0);
  });

  it('geeft 0 als setpoint ≤ Tref', () => {
    const result = calcHDDCorrected(1400, 10, 12);
    expect(result).toBe(0);
  });

  it('behandelt Tref = 18 correct (geen deling door 0)', () => {
    const result = calcHDDCorrected(1400, 20, 18);
    expect(result).toBe(1400); // denom ≤ 0, geeft hddBasis terug
  });
});

// ─── calcWarmtevraag ─────────────────────────────────────────────────────────

describe('calcWarmtevraag', () => {
  it('berekent warmtevraag voor La Longère in Méditerranée', () => {
    // H = 1163 W/K (voorbeeld uit CLAUDE.md grondslagen)
    // HDD_present = 1867 (20°C, Tref=12)
    // HDD_away = 933 (16°C, Tref=12)
    // daysPresent=300, daysAway=65
    // warmtevraag = 1163 × ((1867 × 300/365) + (933 × 65/365)) × 24 / 1000
    const result = calcWarmtevraag(1163, 1867, 933, 300, 65);
    // = 1163 × (1867 × 0.822 + 933 × 0.178) × 24 / 1000
    // = 1163 × (1534.7 + 166.1) × 24 / 1000
    // = 1163 × 1700.8 × 24 / 1000
    // = 47,466 kWh
    expect(result).toBeGreaterThan(40000);
    expect(result).toBeLessThan(55000);
  });
});

// ─── calcDHWThermisch ────────────────────────────────────────────────────────

describe('calcDHWThermisch', () => {
  it('berekent DHW voor 2 personen, 1 douche/dag, 50L', () => {
    // (2 × 1 × 50 × 365 × 28 × 4.186) / 3600
    // = (2 × 1 × 50 × 365 × 28 × 4.186) / 3600
    // = 36,500 × 28 × 4.186 / 3600
    // = 1,022,000 × 4.186 / 3600
    // = 4,278,092 / 3600
    // = 1188.4 kWh
    const result = calcDHWThermisch(2, 1, 50);
    expect(result).toBeCloseTo(1188.4, 0);
  });

  it('schaalt lineair met aantal personen', () => {
    const voor2 = calcDHWThermisch(2, 1, 50);
    const voor4 = calcDHWThermisch(4, 1, 50);
    expect(voor4).toBeCloseTo(voor2 * 2, 0);
  });
});

// ─── calcZwembadKwh ──────────────────────────────────────────────────────────

describe('calcZwembadKwh', () => {
  it('geeft 0 als oppervlak 0', () => {
    expect(calcZwembadKwh(0, 5, 20)).toBe(0);
  });

  it('geeft 0 als maanden 0', () => {
    expect(calcZwembadKwh(32, 0, 20)).toBe(0);
  });

  it('berekent een realistisch verbruik voor 32m² zwembad', () => {
    const result = calcZwembadKwh(32, 5, 20);
    // Moet in de orde van duizenden kWh zijn
    expect(result).toBeGreaterThan(1000);
    expect(result).toBeLessThan(50000);
  });
});

// ─── calcKoelingKwh ──────────────────────────────────────────────────────────

describe('calcKoelingKwh', () => {
  it('geeft 0 als CDD 0', () => {
    expect(calcKoelingKwh(0, 100, 3.0)).toBe(0);
  });

  it('berekent realistisch koelingverbruik', () => {
    const result = calcKoelingKwh(700, 100, 3.0);
    expect(result).toBeGreaterThan(100);
    expect(result).toBeLessThan(10000);
  });
});

// ─── compute (integratie) ────────────────────────────────────────────────────

describe('compute', () => {
  it('berekent een volledig resultaat met standaardinvoer', () => {
    const input = createDefaultInput();
    const result = compute(input);

    expect(result.uaWK).toBeGreaterThan(0);
    expect(result.hventWK).toBeGreaterThan(0);
    expect(result.hTotaalWK).toBeGreaterThan(0);
    expect(result.verwarmingTotaal).toBeGreaterThan(0);
    expect(result.dhwInput).toBeGreaterThan(0);
    expect(result.totaalVerbruikKwh).toBeGreaterThan(0);
    expect(result.kostenTotaal).toBeGreaterThan(0);
    expect(result.co2Kg).toBeGreaterThan(0);
    expect(result.dpe.letter).toMatch(/^[A-G]$/);
  });

  it('berekent correct voor La Longère in Méditerranée', () => {
    const input = createDefaultInput();
    input.zoneId = 'med';
    input.woonoppervlak = 120;
    input.verdiepingen = 1;
    input.plafondHoogte = 2.5;
    input.uMuur = 2.5;
    input.uDak = 3.5;
    input.uVloer = 1.5;
    input.uRaam = 5.8;
    input.oppervlakMuur = 180;
    input.oppervlakDak = 72;
    input.oppervlakVloer = 72;
    input.oppervlakRaam = 14;
    input.ach = 0.9;
    input.mainHeating = 'gas';
    input.mainEfficiency = 0.90;
    input.setpoint = 20;
    input.awaySetpoint = 16;
    input.daysPresent = 300;
    input.daysAway = 65;

    const result = compute(input);

    // UA ≈ 891.2
    expect(result.uaWK).toBeCloseTo(891.2, 0);

    // Volume = 120 × 1 × 2.5 = 300 m³
    // Hvent = 0.34 × 300 × 0.9 = 91.8 W/K
    expect(result.hventWK).toBeCloseTo(91.8, 0);

    // H totaal ≈ 891.2 + 91.8 = 983
    expect(result.hTotaalWK).toBeCloseTo(983, 0);

    // DPE E label (hoog verbruik door slechte isolatie)
    expect(result.dpe.letter).toMatch(/[D-G]/);

    // Warmtevraag > 30.000 kWh
    expect(result.warmtevraagThermisch).toBeGreaterThan(30000);
  });

  it('RT2012 woning heeft betere DPE dan La Longère', () => {
    const inputSlecht = createDefaultInput();
    inputSlecht.zoneId = 'paris';
    inputSlecht.uMuur = 2.5;
    inputSlecht.uDak = 3.5;
    inputSlecht.uVloer = 1.5;
    inputSlecht.uRaam = 5.8;
    inputSlecht.ach = 0.9;

    const inputGoed = createDefaultInput();
    inputGoed.zoneId = 'paris';
    inputGoed.uMuur = 0.2;
    inputGoed.uDak = 0.15;
    inputGoed.uVloer = 0.2;
    inputGoed.uRaam = 1.2;
    inputGoed.ach = 0.3;

    const resultSlecht = compute(inputSlecht);
    const resultGoed = compute(inputGoed);

    expect(resultGoed.dpe.kwhPerM2).toBeLessThan(resultSlecht.dpe.kwhPerM2);
    expect(resultGoed.kostenTotaal).toBeLessThan(resultSlecht.kostenTotaal);
  });

  it('warmtepomp geeft lagere kosten dan gasketel bij zelfde woning', () => {
    const inputGas = createDefaultInput();
    inputGas.mainHeating = 'gas';
    inputGas.mainEfficiency = 0.90;
    inputGas.dhwSystem = 'gas';

    const inputWP = createDefaultInput();
    inputWP.mainHeating = 'warmtepomp';
    inputWP.mainEfficiency = 3.5;
    inputWP.dhwSystem = 'warmtepomp';
    inputWP.dhwEfficiency = 3.0;

    const resultGas = compute(inputGas);
    const resultWP = compute(inputWP);

    // Warmtepomp zou goedkoper moeten zijn dankzij hogere SCOP
    expect(resultWP.verwarmingTotaal).toBeLessThan(resultGas.verwarmingTotaal);
  });

  it('PV vermindert nettokosten', () => {
    const inputZonderPV = createDefaultInput();
    inputZonderPV.hasPV = false;

    const inputMetPV = createDefaultInput();
    inputMetPV.hasPV = true;
    inputMetPV.pvVermogen = 6;
    inputMetPV.pvZelfverbruik = 0.30;
    inputMetPV.zoneId = 'med'; // hoge PV-opbrengst

    const resultZonder = compute(inputZonderPV);
    const resultMet = compute(inputMetPV);

    expect(resultMet.pvProductieKwh).toBeGreaterThan(0);
    expect(resultMet.pvBesparing).toBeGreaterThan(0);
    expect(resultMet.nettoKosten).toBeLessThan(resultZonder.kostenTotaal);
  });

  it('EV voegt elektriciteitsverbruik toe', () => {
    const inputZonder = createDefaultInput();
    inputZonder.hasEV = false;

    const inputMet = createDefaultInput();
    inputMet.hasEV = true;
    inputMet.evKmPerJaar = 15000;
    inputMet.evVerbruik = 0.20;

    const resultZonder = compute(inputZonder);
    const resultMet = compute(inputMet);

    expect(resultMet.evKwh).toBe(3000); // 15000 × 0.20
    expect(resultMet.totaalVerbruikKwh).toBeGreaterThan(resultZonder.totaalVerbruikKwh);
  });

  it('bevat een volledig debug-object', () => {
    const result = compute(createDefaultInput());

    expect(result.debug.zone).toBeDefined();
    expect(result.debug.zone.id).toBe('paris');
    expect(result.debug.volume).toBeGreaterThan(0);
    expect(result.debug.mainEff).toBeGreaterThan(0);
    expect(result.debug.hddBasis).toBeGreaterThan(0);
    expect(result.debug.prijzen).toBeDefined();
  });
});
