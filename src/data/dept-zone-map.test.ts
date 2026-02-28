/**
 * dept-zone-map.test.ts — Unit tests voor département → zone mapping.
 */

import { describe, it, expect } from 'vitest';
import {
  DEPT_ZONE_MAP,
  getZoneIdFromPostcode,
  getDepartementFromPostcode,
} from './dept-zone-map.ts';

describe('DEPT_ZONE_MAP', () => {
  it('bevat alle belangrijke departementen', () => {
    expect(Object.keys(DEPT_ZONE_MAP).length).toBeGreaterThanOrEqual(90);
  });

  it('mapt Parijs (75) naar paris', () => {
    expect(DEPT_ZONE_MAP['75']).toBe('paris');
  });

  it('mapt Marseille (13) naar med', () => {
    expect(DEPT_ZONE_MAP['13']).toBe('med');
  });

  it('mapt Strasbourg (67) naar est', () => {
    expect(DEPT_ZONE_MAP['67']).toBe('est');
  });

  it('mapt Bordeaux (33) naar ouest', () => {
    expect(DEPT_ZONE_MAP['33']).toBe('ouest');
  });

  it('mapt Lyon (69) naar centre', () => {
    expect(DEPT_ZONE_MAP['69']).toBe('centre');
  });

  it('mapt Grenoble (38) naar mont', () => {
    expect(DEPT_ZONE_MAP['38']).toBe('mont');
  });
});

describe('getZoneIdFromPostcode', () => {
  it('mapt postcode 75001 (Parijs) naar paris', () => {
    expect(getZoneIdFromPostcode('75001')).toBe('paris');
  });

  it('mapt postcode 13001 (Marseille) naar med', () => {
    expect(getZoneIdFromPostcode('13001')).toBe('med');
  });

  it('mapt postcode 33000 (Bordeaux) naar ouest', () => {
    expect(getZoneIdFromPostcode('33000')).toBe('ouest');
  });

  it('mapt Corsica (20000) naar med via 2A', () => {
    expect(getZoneIdFromPostcode('20000')).toBe('med');
  });

  it('mapt Corsica (20200) naar med via 2B', () => {
    expect(getZoneIdFromPostcode('20200')).toBe('med');
  });

  it('mapt DOM-TOM (97400) naar med', () => {
    expect(getZoneIdFromPostcode('97400')).toBe('med');
  });

  it('fallback naar paris bij onbekende postcode', () => {
    expect(getZoneIdFromPostcode('99999')).toBe('paris');
  });

  it('fallback naar paris bij lege string', () => {
    expect(getZoneIdFromPostcode('')).toBe('paris');
  });
});

describe('getDepartementFromPostcode', () => {
  it('haalt 75 uit postcode 75001', () => {
    expect(getDepartementFromPostcode('75001')).toBe('75');
  });

  it('haalt 2A uit Corsica 20000', () => {
    expect(getDepartementFromPostcode('20000')).toBe('2A');
  });

  it('haalt 2B uit Corsica 20200', () => {
    expect(getDepartementFromPostcode('20200')).toBe('2B');
  });

  it('geeft lege string bij lege input', () => {
    expect(getDepartementFromPostcode('')).toBe('');
  });
});
