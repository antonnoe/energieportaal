/**
 * tool-spec.test.ts — Unit tests voor velddefinities en validatie.
 */

import { describe, it, expect } from 'vitest';
import {
  snelAdviesFields,
  stap1Fields,
  stap2Fields,
  stap3Fields,
  stap4Fields,
  stap5Fields,
  allStepFields,
  validateFields,
  validateStep,
} from './tool-spec.ts';

describe('Velddefinities', () => {
  it('snelAdviesFields bevat 5 velden', () => {
    expect(snelAdviesFields).toHaveLength(5);
  });

  it('stap1 t/m stap5 bestaan en hebben velden', () => {
    expect(stap1Fields.length).toBeGreaterThan(0);
    expect(stap2Fields.length).toBeGreaterThan(0);
    expect(stap3Fields.length).toBeGreaterThan(0);
    expect(stap4Fields.length).toBeGreaterThan(0);
    expect(stap5Fields.length).toBeGreaterThan(0);
  });

  it('allStepFields bevat 5 stappen', () => {
    expect(allStepFields).toHaveLength(5);
  });

  it('elk veld heeft een uniek id', () => {
    const allIds = allStepFields.flat().map((f) => f.id);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('verplichte velden hebben een defaultValue (behalve postcode)', () => {
    for (const step of allStepFields) {
      for (const field of step) {
        if (field.required && field.id !== 'postcode') {
          expect(field.defaultValue, `${field.id} mist defaultValue`).toBeDefined();
        }
      }
    }
  });
});

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

describe('validateStep', () => {
  it('valideert stap 2 correct', () => {
    const errors = validateStep(2, {
      huisTypeId: 'pavillon',
      woonoppervlak: 100,
      verdiepingen: 1,
    });
    expect(errors).toHaveLength(0);
  });

  it('geeft fouten voor lege stap 2', () => {
    const errors = validateStep(2, {});
    expect(errors.length).toBeGreaterThan(0);
  });

  it('geeft lege array voor onbekende stap', () => {
    const errors = validateStep(99, {});
    expect(errors).toHaveLength(0);
  });
});
