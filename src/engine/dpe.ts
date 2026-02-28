/**
 * dpe.ts — DPE-classificatie (Diagnostic de Performance Énergétique).
 *
 * Geeft niet alleen een letter, maar ook:
 * 1. De exacte kWh/m²/jaar waarde
 * 2. Hoeveel kWh/m² tot de volgende klasse (omhoog EN omlaag)
 * 3. Verhuurverbod-waarschuwing bij F/G/E
 */

import type { DPEResultaat, VerhuurverbodInfo } from './types.ts';
import { DPE_KLASSEN, VERHUURVERBODEN } from './constants.ts';

/**
 * Bepaal de DPE-letter op basis van kWh/m²/jaar.
 * Drempelwaarden volgens officieel Frans schema:
 *   A ≤ 70, B ≤ 110, C ≤ 180, D ≤ 250, E ≤ 330, F ≤ 420, G > 420
 */
export function getDPELetter(kwhPerM2: number): string {
  for (const klasse of DPE_KLASSEN) {
    if (kwhPerM2 <= klasse.maxKwhM2) {
      return klasse.letter;
    }
  }
  return 'G';
}

/**
 * Geeft de kleur voor een DPE-letter.
 */
export function getDPEKleur(letter: string): string {
  const klasse = DPE_KLASSEN.find((k) => k.letter === letter);
  return klasse?.kleur ?? '#fc0205';
}

/**
 * Geeft de bovengrens (max kWh/m²) van een DPE-klasse.
 */
export function getMaxKwhVoorKlasse(letter: string): number {
  const klasse = DPE_KLASSEN.find((k) => k.letter === letter);
  return klasse?.maxKwhM2 ?? Infinity;
}

/**
 * Bereken hoeveel kWh/m² bespaard moet worden om één klasse hoger te komen.
 * Geeft 0 als al op A.
 */
export function kwhTotVolgendeBetereKlasse(kwhPerM2: number): number {
  const huidigeLetter = getDPELetter(kwhPerM2);
  const huidigeIndex = DPE_KLASSEN.findIndex((k) => k.letter === huidigeLetter);

  if (huidigeIndex <= 0) return 0; // Al op A

  const betereKlasse = DPE_KLASSEN[huidigeIndex - 1];
  return Math.max(0, kwhPerM2 - betereKlasse.maxKwhM2);
}

/**
 * Bereken hoeveel kWh/m² erbij moet komen om één klasse lager te vallen.
 * Geeft Infinity als al op G.
 */
export function kwhTotLagereKlasse(kwhPerM2: number): number {
  const huidigeLetter = getDPELetter(kwhPerM2);
  const huidigeIndex = DPE_KLASSEN.findIndex((k) => k.letter === huidigeLetter);

  if (huidigeIndex >= DPE_KLASSEN.length - 1) return Infinity; // Al op G

  const huidigeKlasse = DPE_KLASSEN[huidigeIndex];
  return Math.max(0, huidigeKlasse.maxKwhM2 - kwhPerM2);
}

/**
 * Check verhuurverbod voor een DPE-letter.
 */
export function getVerhuurverbod(letter: string): VerhuurverbodInfo | null {
  const verbod = VERHUURVERBODEN[letter];
  if (!verbod) return null;

  const huidigJaar = new Date().getFullYear();
  return {
    verboden: huidigJaar >= verbod.sindsJaar,
    sindsJaar: verbod.sindsJaar,
    beschrijving: verbod.beschrijving,
  };
}

/**
 * Volledige DPE-analyse: letter + kWh/m² + afstanden + verhuurverbod.
 */
export function berekenDPE(kwhPerM2: number): DPEResultaat {
  const letter = getDPELetter(kwhPerM2);
  const kleur = getDPEKleur(letter);
  const maxKwhVoorKlasse = getMaxKwhVoorKlasse(letter);

  return {
    letter,
    kwhPerM2: Math.round(kwhPerM2),
    kleur,
    maxKwhVoorKlasse,
    kwhTotVolgendeKlasse: Math.round(kwhTotVolgendeBetereKlasse(kwhPerM2)),
    kwhTotLagereKlasse: Math.round(kwhTotLagereKlasse(kwhPerM2)),
    verhuurverbod: getVerhuurverbod(letter),
  };
}
