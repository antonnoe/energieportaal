import { describe, it, expect } from 'vitest';
import { calculate } from './calculations';

describe('calculate', () => {
  it('returns default values for empty input', () => {
    const result = calculate({});
    // Default: 100 m², isolatie matig (150 kWh/m²), gas
    expect(result.jaarverbruikKwh).toBe(15000);
    expect(result.dpeLabel).toBe('D'); // isolatieFactor 150 → 90 ≤ 150 < 230 → D
    expect(result.co2Kg).toBe(Math.round(15000 * 0.205));
    expect(result.kostenEur).toBe(Math.round(15000 * 0.12));
  });

  it('calculates correctly for uitstekende isolatie and warmtepomp', () => {
    const result = calculate({ oppervlakte: 80, isolatie: 'uitstekend', verwarming: 'warmtepomp' });
    expect(result.jaarverbruikKwh).toBe(80 * 50);
    expect(result.dpeLabel).toBe('B'); // isolatieFactor 50 → 50 is not < 50, is < 90 → B
    expect(result.co2Kg).toBe(Math.round(4000 * 0.055));
    expect(result.kostenEur).toBe(Math.round(4000 * 0.08));
  });

  it('returns label D for slechte isolatie', () => {
    const result = calculate({ oppervlakte: 100, isolatie: 'slecht', verwarming: 'gas' });
    expect(result.dpeLabel).toBe('D'); // isolatieFactor 200 → 150 ≤ 200 < 230 → D
    expect(result.jaarverbruikKwh).toBe(20000);
  });

  it('returns label C for goede isolatie', () => {
    const result = calculate({ oppervlakte: 100, isolatie: 'goed', verwarming: 'gas' });
    expect(result.dpeLabel).toBe('C');
    expect(result.jaarverbruikKwh).toBe(10000);
  });

  it('falls back to defaults for unknown isolatie and verwarming', () => {
    const result = calculate({ oppervlakte: 50, isolatie: 'onbekend', verwarming: 'onbekend' });
    // Falls back to 150 (matig) and gas factors
    expect(result.jaarverbruikKwh).toBe(50 * 150);
    expect(result.co2Kg).toBe(Math.round(7500 * 0.205));
  });

  it('uses string oppervlakte correctly', () => {
    const result = calculate({ oppervlakte: '200', isolatie: 'goed', verwarming: 'elektrisch' });
    expect(result.jaarverbruikKwh).toBe(200 * 100);
    expect(result.kostenEur).toBe(Math.round(20000 * 0.25));
  });
});
