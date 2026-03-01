/**
 * sources.ts — Bronverwijzingen voor het EnergiePortaal.
 * Elke berekening moet traceerbaar zijn naar een bron.
 */

import type { Bron } from '../engine/types.ts';

export const BRONNEN: Bron[] = [
  {
    id: 'isolatie',
    titel: 'De isolatie van het Franse huis',
    url: 'https://infofrankrijk.com/de-isolatie-van-het-franse-huis/',
    beschrijving: 'Uitgebreid overzicht van isolatiemethoden en -materialen voor Franse woningen.',
  },
  {
    id: 'mpr',
    titel: 'MaPrimeRénov\' — voorwaarden, werking en aandachtspunten',
    url: 'https://infofrankrijk.com/ma-prime-renov-in-frankrijk-voorwaarden-werking-en-aandachtspunten/',
    beschrijving: 'Alles over de Franse renovatiesubsidie MaPrimeRénov\'.',
  },
  {
    id: 'cee',
    titel: 'CEE en primes énergie — energiebesparingspremies uitgelegd',
    url: 'https://infofrankrijk.com/cee-en-primes-energie-energiebesparingspremies-in-frankrijk-uitgelegd/',
    beschrijving: 'Uitleg over de Certificats d\'Économies d\'Énergie en bijbehorende premies.',
  },
  {
    id: 'eco-ptz',
    titel: 'Éco-PTZ — renteloze lening voor energierenovatie',
    url: 'https://infofrankrijk.com/eco-ptz-renteloze-lening-voor-energierenovatie-in-frankrijk/',
    beschrijving: 'Voorwaarden en werking van de Éco-prêt à taux zéro.',
  },
  {
    id: 'tva',
    titel: 'TVA à 5,5% bij renovatie — wanneer geldt het lage BTW-tarief?',
    url: 'https://infofrankrijk.com/tva-a-55-bij-renovatie-in-frankrijk-wanneer-geldt-het-lage-btw-tarief/',
    beschrijving: 'Wanneer u recht heeft op het verlaagde BTW-tarief van 5,5% bij renovatiewerken.',
  },
  {
    id: 'lokaal',
    titel: 'Lokale subsidies voor energierenovatie in Frankrijk',
    url: 'https://infofrankrijk.com/lokale-subsidies-voor-energierenovatie-in-frankrijk-zo-vindt-u-wat-er-geldt/',
    beschrijving: 'Overzicht van lokale en regionale subsidies naast de nationale regelingen.',
  },
  {
    id: 'france-renov',
    titel: 'France Rénov\' — vind een adviseur',
    url: 'https://france-renov.gouv.fr/preparer-projet/trouver-conseiller',
    beschrijving: 'Zoek een gecertificeerde energieadviseur (Mon Accompagnateur Rénov\') bij u in de buurt.',
  },
  {
    id: 'rge',
    titel: 'RGE-annuaire — vind een gecertificeerde vakman',
    url: 'https://france-renov.gouv.fr/annuaire-rge',
    beschrijving: 'Zoek een RGE-gecertificeerde aannemer voor uw renovatieproject.',
  },
];

export function getBronById(id: string): Bron | undefined {
  return BRONNEN.find((b) => b.id === id);
}
