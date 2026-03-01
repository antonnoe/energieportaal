/**
 * tool-spec.test.ts — Unit tests voor velddefinities en validatie.
 */

import { describe, it, expect } from 'vitest';
import {
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
  it('returns no errors for valid stap2 input', () => {
    const values = { huisTypeId: 'pavillon', woonoppervlak: 100, verdiepingen: 1 };
    const errors = validateFields(stap2Fields, values);
    expect(errors).toHaveLength(0);
  });

  it('reports errors for missing required fields', () => {
    const errors = validateFields(stap2Fields, {});
    expect(errors.length).toBeGreaterThan(0);
    const fieldIds = errors.map((e) => e.fieldId);
    expect(fieldIds).toContain('huisTypeId');
    expect(fieldIds).toContain('woonoppervlak');
  });

  it('reports error when woonoppervlak is below minimum', () => {
    const values = { huisTypeId: 'pavillon', woonoppervlak: 5, verdiepingen: 1 };
    const errors = validateFields(stap2Fields, values);
    expect(errors.some((e) => e.fieldId === 'woonoppervlak')).toBe(true);
  });

  it('reports error when woonoppervlak is above maximum', () => {
    const values = { huisTypeId: 'pavillon', woonoppervlak: 5000, verdiepingen: 1 };
    const errors = validateFields(stap2Fields, values);
    expect(errors.some((e) => e.fieldId === 'woonoppervlak')).toBe(true);
  });

  it('reports error for non-numeric value in number field', () => {
    const values = { huisTypeId: 'pavillon', woonoppervlak: 'abc', verdiepingen: 1 };
    const errors = validateFields(stap2Fields, values);
    expect(errors.some((e) => e.fieldId === 'woonoppervlak')).toBe(true);
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
