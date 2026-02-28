import { describe, it, expect } from 'vitest';
import {
  calcUA,
  calcQvent,
  dpeFromKwhM2,
  calculateExpert,
  expertInputFromState,
  U_MUR,
  U_DAK,
  U_RAAM,
  KLIMAATZONES,
} from './heatLoss';
import type { ExpertInput } from './heatLoss';

const BASE_INPUT: ExpertInput = {
  oppervlakte: 100,
  bouwjaar: 1980,
  verwarming: 'gas',
  muurOppervlak: 120,
  dakOppervlak: 80,
  vloerOppervlak: 80,
  raamOppervlak: 15,
  muurIsolatie: 'matig',
  dakIsolatie: 'matig',
  vloerIsolatie: 'geen',
  raamType: 'dubbel',
  ventilatieType: 'naturel',
  hrvEfficientie: 0,
  verwarmingScop: 0,
  stookgrens: 18,
  klimaatzone: 'H1b',
  dhwPersonen: 2,
  basisElektriciteit: 2500,
  heeftEV: false,
  evKmPerJaar: 0,
  heeftPV: false,
  pvVermogen: 3,
  pvZelfverbruik: 0.3,
  exportTarief: 0.06,
};

describe('calcUA', () => {
  it('computes transmission heat-loss coefficient correctly', () => {
    const ua = calcUA({
      muurOppervlak: 120,
      dakOppervlak: 80,
      vloerOppervlak: 80,
      raamOppervlak: 15,
      muurIsolatie: 'matig',
      dakIsolatie: 'matig',
      vloerIsolatie: 'geen',
      raamType: 'dubbel',
    });
    const expected =
      120 * U_MUR.matig +
      80 * U_DAK.matig +
      80 * 0.80 + // vloer geen
      15 * U_RAAM.dubbel;
    expect(ua).toBeCloseTo(expected, 5);
  });

  it('falls back to defaults for unknown isolatie values', () => {
    const ua = calcUA({
      muurOppervlak: 100,
      dakOppervlak: 60,
      vloerOppervlak: 60,
      raamOppervlak: 10,
      muurIsolatie: 'onbekend',
      dakIsolatie: 'onbekend',
      vloerIsolatie: 'onbekend',
      raamType: 'onbekend',
    });
    // falls back to matig / matig / geen / dubbel
    expect(ua).toBeGreaterThan(0);
  });
});

describe('calcQvent', () => {
  it('computes ventilation heat-loss for natural ventilation', () => {
    const qvent = calcQvent(100, 2.5, 'naturel', 0);
    // volume = 250, ACH = 0.7, no HRV → 0.335 * 0.7 * 250
    expect(qvent).toBeCloseTo(0.335 * 0.7 * 250, 3);
  });

  it('HRV reduces ventilation heat loss', () => {
    const qventNoHrv = calcQvent(100, 2.5, 'naturel', 0);
    const qventHrv = calcQvent(100, 2.5, 'hrv', 0.75);
    expect(qventHrv).toBeLessThan(qventNoHrv);
  });

  it('clamps HRV efficiency to [0, 1]', () => {
    const qventClamped = calcQvent(100, 2.5, 'hrv', 1.5);
    expect(qventClamped).toBeCloseTo(0, 3); // efficiency ≥ 1 → near zero loss
  });
});

describe('dpeFromKwhM2', () => {
  it.each([
    [30, 'A'],
    [70, 'B'],
    [120, 'C'],
    [180, 'D'],
    [280, 'E'],
    [380, 'F'],
    [500, 'G'],
  ])('kwhPerM2=%i → label %s', (kwh, label) => {
    expect(dpeFromKwhM2(kwh)).toBe(label);
  });
});

describe('calculateExpert', () => {
  it('returns expected UA and qvent for base input', () => {
    const result = calculateExpert(BASE_INPUT);
    expect(result.uaWK).toBeGreaterThan(0);
    expect(result.qventWK).toBeGreaterThan(0);
  });

  it('verwarmingKwh decreases with better insulation', () => {
    const bad = calculateExpert({ ...BASE_INPUT, muurIsolatie: 'geen', dakIsolatie: 'geen' });
    const good = calculateExpert({ ...BASE_INPUT, muurIsolatie: 'uitstekend', dakIsolatie: 'uitstekend' });
    expect(good.verwarmingKwh).toBeLessThan(bad.verwarmingKwh);
  });

  it('PV production is 0 when heeftPV is false', () => {
    const result = calculateExpert({ ...BASE_INPUT, heeftPV: false });
    expect(result.pvProductieKwh).toBe(0);
    expect(result.pvBesparing).toBe(0);
  });

  it('PV production is positive when heeftPV is true', () => {
    const result = calculateExpert({ ...BASE_INPUT, heeftPV: true, pvVermogen: 4, pvZelfverbruik: 0.4 });
    const zone = KLIMAATZONES['H1b'];
    expect(result.pvProductieKwh).toBe(Math.round(4 * zone.pvYield));
    expect(result.pvBesparing).toBeGreaterThan(0);
  });

  it('EV adds electricity consumption', () => {
    const without = calculateExpert({ ...BASE_INPUT, heeftEV: false });
    const with_ = calculateExpert({ ...BASE_INPUT, heeftEV: true, evKmPerJaar: 10000 });
    expect(with_.evKwh).toBe(Math.round(10000 * 0.20));
    expect(with_.totaalKwh).toBeGreaterThan(without.totaalKwh);
  });

  it('dhwKwh scales with number of persons', () => {
    const r1 = calculateExpert({ ...BASE_INPUT, dhwPersonen: 1 });
    const r4 = calculateExpert({ ...BASE_INPUT, dhwPersonen: 4 });
    expect(r4.dhwKwh).toBeCloseTo(r1.dhwKwh * 4, 0);
  });

  it('warmtepomp produces lower CO₂ than gas', () => {
    const gas = calculateExpert({ ...BASE_INPUT, verwarming: 'gas' });
    const wp = calculateExpert({ ...BASE_INPUT, verwarming: 'warmtepomp', verwarmingScop: 3.5 });
    expect(wp.co2Kg).toBeLessThan(gas.co2Kg);
  });

  it('returns a valid DPE label', () => {
    const result = calculateExpert(BASE_INPUT);
    expect(['A', 'B', 'C', 'D', 'E', 'F', 'G']).toContain(result.dpeLabel);
  });

  it('falls back to H1b for unknown klimaatzone', () => {
    const r = calculateExpert({ ...BASE_INPUT, klimaatzone: 'unknown' });
    const h1b = calculateExpert({ ...BASE_INPUT, klimaatzone: 'H1b' });
    expect(r.verwarmingKwh).toBe(h1b.verwarmingKwh);
  });
});

describe('expertInputFromState', () => {
  it('returns sensible defaults for empty state', () => {
    const input = expertInputFromState({});
    expect(input.oppervlakte).toBe(100);
    expect(input.verwarming).toBe('gas');
    expect(input.klimaatzone).toBe('H1b');
    expect(input.dhwPersonen).toBe(2);
    expect(input.heeftEV).toBe(false);
    expect(input.heeftPV).toBe(false);
  });

  it('parses numeric fields from string state', () => {
    const input = expertInputFromState({ oppervlakte: '150', bouwjaar: '2000', dhwPersonen: '3' });
    expect(input.oppervlakte).toBe(150);
    expect(input.bouwjaar).toBe(2000);
    expect(input.dhwPersonen).toBe(3);
  });

  it('sets heeftEV and heeftPV correctly from "ja"/"nee"', () => {
    const input = expertInputFromState({ heeftEV: 'ja', heeftPV: 'ja' });
    expect(input.heeftEV).toBe(true);
    expect(input.heeftPV).toBe(true);

    const input2 = expertInputFromState({ heeftEV: 'nee', heeftPV: 'nee' });
    expect(input2.heeftEV).toBe(false);
    expect(input2.heeftPV).toBe(false);
  });
});
