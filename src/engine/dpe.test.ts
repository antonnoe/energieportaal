/**
 * dpe.test.ts — Unit tests voor DPE-classificatie.
 * Test alle grenswaarden: 70, 110, 180, 250, 330, 420.
 */

import { describe, it, expect } from 'vitest';
import {
  getDPELetter,
  getDPEKleur,
  kwhTotVolgendeBetereKlasse,
  kwhTotLagereKlasse,
  getVerhuurverbod,
  berekenDPE,
} from './dpe.ts';

describe('getDPELetter', () => {
  it('geeft A voor ≤ 70 kWh/m²', () => {
    expect(getDPELetter(0)).toBe('A');
    expect(getDPELetter(50)).toBe('A');
    expect(getDPELetter(70)).toBe('A');
  });

  it('geeft B voor 71–110 kWh/m²', () => {
    expect(getDPELetter(71)).toBe('B');
    expect(getDPELetter(100)).toBe('B');
    expect(getDPELetter(110)).toBe('B');
  });

  it('geeft C voor 111–180 kWh/m²', () => {
    expect(getDPELetter(111)).toBe('C');
    expect(getDPELetter(150)).toBe('C');
    expect(getDPELetter(180)).toBe('C');
  });

  it('geeft D voor 181–250 kWh/m²', () => {
    expect(getDPELetter(181)).toBe('D');
    expect(getDPELetter(220)).toBe('D');
    expect(getDPELetter(250)).toBe('D');
  });

  it('geeft E voor 251–330 kWh/m²', () => {
    expect(getDPELetter(251)).toBe('E');
    expect(getDPELetter(300)).toBe('E');
    expect(getDPELetter(330)).toBe('E');
  });

  it('geeft F voor 331–420 kWh/m²', () => {
    expect(getDPELetter(331)).toBe('F');
    expect(getDPELetter(400)).toBe('F');
    expect(getDPELetter(420)).toBe('F');
  });

  it('geeft G voor > 420 kWh/m²', () => {
    expect(getDPELetter(421)).toBe('G');
    expect(getDPELetter(600)).toBe('G');
    expect(getDPELetter(1000)).toBe('G');
  });
});

describe('getDPEKleur', () => {
  it('geeft de juiste kleur per letter', () => {
    expect(getDPEKleur('A')).toBe('#319834');
    expect(getDPEKleur('B')).toBe('#33cc31');
    expect(getDPEKleur('C')).toBe('#cbfc32');
    expect(getDPEKleur('D')).toBe('#fbfe06');
    expect(getDPEKleur('E')).toBe('#fbcc05');
    expect(getDPEKleur('F')).toBe('#f66c02');
    expect(getDPEKleur('G')).toBe('#fc0205');
  });

  it('geeft rood voor onbekende letter', () => {
    expect(getDPEKleur('X')).toBe('#fc0205');
  });
});

describe('kwhTotVolgendeBetereKlasse', () => {
  it('geeft 0 voor A-klasse', () => {
    expect(kwhTotVolgendeBetereKlasse(50)).toBe(0);
  });

  it('berekent afstand naar betere klasse', () => {
    // Bij 300 kWh/m² (E), grens van D is 250 → 300 - 250 = 50
    expect(kwhTotVolgendeBetereKlasse(300)).toBe(50);
  });

  it('berekent afstand bij exact op grens', () => {
    // Bij 330 kWh/m² (E), grens van D is 250 → 330 - 250 = 80
    expect(kwhTotVolgendeBetereKlasse(330)).toBe(80);
  });

  it('werkt voor G-klasse', () => {
    // Bij 500 kWh/m² (G), grens van F is 420 → 500 - 420 = 80
    expect(kwhTotVolgendeBetereKlasse(500)).toBe(80);
  });
});

describe('kwhTotLagereKlasse', () => {
  it('geeft Infinity voor G-klasse', () => {
    expect(kwhTotLagereKlasse(500)).toBe(Infinity);
  });

  it('berekent afstand naar lagere klasse', () => {
    // Bij 200 kWh/m² (D), grens van D is 250 → 250 - 200 = 50
    expect(kwhTotLagereKlasse(200)).toBe(50);
  });

  it('werkt voor A-klasse', () => {
    // Bij 50 kWh/m² (A), grens van A is 70 → 70 - 50 = 20
    expect(kwhTotLagereKlasse(50)).toBe(20);
  });
});

describe('getVerhuurverbod', () => {
  it('geeft verhuurverbod voor G (sinds 2025)', () => {
    const verbod = getVerhuurverbod('G');
    expect(verbod).not.toBeNull();
    expect(verbod!.sindsJaar).toBe(2025);
    expect(verbod!.verboden).toBe(true);
  });

  it('geeft toekomstig verbod voor F (2028)', () => {
    const verbod = getVerhuurverbod('F');
    expect(verbod).not.toBeNull();
    expect(verbod!.sindsJaar).toBe(2028);
  });

  it('geeft toekomstig verbod voor E (2034)', () => {
    const verbod = getVerhuurverbod('E');
    expect(verbod).not.toBeNull();
    expect(verbod!.sindsJaar).toBe(2034);
  });

  it('geeft null voor D en beter', () => {
    expect(getVerhuurverbod('D')).toBeNull();
    expect(getVerhuurverbod('C')).toBeNull();
    expect(getVerhuurverbod('B')).toBeNull();
    expect(getVerhuurverbod('A')).toBeNull();
  });
});

describe('berekenDPE', () => {
  it('geeft een volledig DPE-resultaat', () => {
    const dpe = berekenDPE(325);
    expect(dpe.letter).toBe('E');
    expect(dpe.kwhPerM2).toBe(325);
    expect(dpe.kleur).toBe('#fbcc05');
    expect(dpe.maxKwhVoorKlasse).toBe(330);
    expect(dpe.kwhTotVolgendeKlasse).toBe(75); // 325 - 250 = 75
    expect(dpe.kwhTotLagereKlasse).toBe(5);    // 330 - 325 = 5
    expect(dpe.verhuurverbod).not.toBeNull();
    expect(dpe.verhuurverbod!.sindsJaar).toBe(2034);
  });

  it('rondt kWh/m² correct af', () => {
    const dpe = berekenDPE(199.7);
    expect(dpe.kwhPerM2).toBe(200);
    expect(dpe.letter).toBe('D');
  });
});
