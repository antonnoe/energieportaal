/**
 * savings.test.ts — Unit tests voor besparingsscenario's.
 */

import { describe, it, expect } from 'vitest';
import { berekenSavings } from './savings.ts';
import { compute, createDefaultInput } from './compute.ts';

describe('berekenSavings', () => {
  it('genereert maatregelen voor een slecht geïsoleerd huis', () => {
    const input = createDefaultInput();
    input.uMuur = 2.5;
    input.uDak = 3.5;
    input.uVloer = 1.5;
    input.uRaam = 5.8;
    input.ach = 0.9;
    input.mainHeating = 'gas';
    input.hasPV = false;
    input.hasHRV = false;

    const result = compute(input);
    const savings = berekenSavings(input, result);

    expect(savings.maatregelen.length).toBeGreaterThan(0);
    expect(savings.totaalBesparingKwh).toBeGreaterThan(0);
    expect(savings.totaalBesparingEur).toBeGreaterThan(0);
  });

  it('bevat dakisolatie als maatregel bij slecht dak', () => {
    const input = createDefaultInput();
    input.uDak = 3.5;

    const result = compute(input);
    const savings = berekenSavings(input, result);

    const dakIsolatie = savings.maatregelen.find((m) => m.id === 'dak-isolatie');
    expect(dakIsolatie).toBeDefined();
    expect(dakIsolatie!.besparingKwhJaar).toBeGreaterThan(0);
    expect(dakIsolatie!.terugverdientijdJaar).toBeGreaterThan(0);
  });

  it('stelt warmtepomp voor bij gasverwarming', () => {
    const input = createDefaultInput();
    input.mainHeating = 'gas';

    const result = compute(input);
    const savings = berekenSavings(input, result);

    const wp = savings.maatregelen.find((m) => m.id === 'warmtepomp');
    expect(wp).toBeDefined();
    expect(wp!.besparingKwhJaar).toBeGreaterThan(0);
  });

  it('stelt geen warmtepomp voor als die er al is', () => {
    const input = createDefaultInput();
    input.mainHeating = 'warmtepomp';
    input.mainEfficiency = 3.5;

    const result = compute(input);
    const savings = berekenSavings(input, result);

    const wp = savings.maatregelen.find((m) => m.id === 'warmtepomp');
    expect(wp).toBeUndefined();
  });

  it('stelt PV voor als er nog geen PV is', () => {
    const input = createDefaultInput();
    input.hasPV = false;

    const result = compute(input);
    const savings = berekenSavings(input, result);

    const pv = savings.maatregelen.find((m) => m.id === 'pv-panelen');
    expect(pv).toBeDefined();
  });

  it('stelt geen PV voor als er al PV is', () => {
    const input = createDefaultInput();
    input.hasPV = true;
    input.pvVermogen = 6;

    const result = compute(input);
    const savings = berekenSavings(input, result);

    const pv = savings.maatregelen.find((m) => m.id === 'pv-panelen');
    expect(pv).toBeUndefined();
  });

  it('maatregelen zijn gesorteerd op terugverdientijd', () => {
    const input = createDefaultInput();
    input.uMuur = 2.5;
    input.uDak = 3.5;
    input.uVloer = 1.5;
    input.uRaam = 5.8;

    const result = compute(input);
    const savings = berekenSavings(input, result);

    for (let i = 1; i < savings.maatregelen.length; i++) {
      expect(savings.maatregelen[i].terugverdientijdJaar)
        .toBeGreaterThanOrEqual(savings.maatregelen[i - 1].terugverdientijdJaar);
    }
  });

  it('DPE na maatregelen is beter dan huidige DPE', () => {
    const input = createDefaultInput();
    input.uMuur = 2.5;
    input.uDak = 3.5;
    input.uVloer = 1.5;
    input.uRaam = 5.8;

    const result = compute(input);
    const savings = berekenSavings(input, result);

    if (savings.maatregelen.length > 0) {
      expect(savings.dpeNaMaatregelen.kwhPerM2).toBeLessThan(result.dpe.kwhPerM2);
    }
  });

  it('genereert weinig maatregelen voor RT2012 woning', () => {
    const input = createDefaultInput();
    input.uMuur = 0.2;
    input.uDak = 0.15;
    input.uVloer = 0.2;
    input.uRaam = 1.2;
    input.ach = 0.3;
    input.mainHeating = 'warmtepomp';
    input.mainEfficiency = 3.5;
    input.hasHRV = true;
    input.hrvEfficiency = 0.80;
    input.hasPV = true;
    input.pvVermogen = 3;

    const result = compute(input);
    const savings = berekenSavings(input, result);

    // RT2012 met warmtepomp, WTW en PV: weinig verbeterpotentieel
    expect(savings.maatregelen.length).toBeLessThan(4);
  });
});
