import { describe, it, expect } from 'vitest';
import { validateFields, snelAdviesFields } from './tool-spec';

describe('validateFields', () => {
  it('returns no errors for valid input', () => {
    const values = { oppervlakte: 100, bouwjaar: 1990, isolatie: 'goed', verwarming: 'gas' };
    const errors = validateFields(snelAdviesFields, values);
    expect(errors).toHaveLength(0);
  });

  it('reports errors for missing required fields', () => {
    const errors = validateFields(snelAdviesFields, {});
    expect(errors.length).toBeGreaterThan(0);
    const fieldIds = errors.map((e) => e.fieldId);
    expect(fieldIds).toContain('oppervlakte');
    expect(fieldIds).toContain('bouwjaar');
    expect(fieldIds).toContain('isolatie');
    expect(fieldIds).toContain('verwarming');
  });

  it('reports error when oppervlakte is below minimum', () => {
    const values = { oppervlakte: 5, bouwjaar: 2000, isolatie: 'matig', verwarming: 'gas' };
    const errors = validateFields(snelAdviesFields, values);
    expect(errors.some((e) => e.fieldId === 'oppervlakte')).toBe(true);
  });

  it('reports error when oppervlakte is above maximum', () => {
    const values = { oppervlakte: 5000, bouwjaar: 2000, isolatie: 'matig', verwarming: 'gas' };
    const errors = validateFields(snelAdviesFields, values);
    expect(errors.some((e) => e.fieldId === 'oppervlakte')).toBe(true);
  });

  it('reports error for non-numeric value in number field', () => {
    const values = { oppervlakte: 'abc', bouwjaar: 2000, isolatie: 'goed', verwarming: 'gas' };
    const errors = validateFields(snelAdviesFields, values);
    expect(errors.some((e) => e.fieldId === 'oppervlakte')).toBe(true);
  });
});
