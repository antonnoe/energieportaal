/**
 * savings.ts — Besparingsscenario's en terugverdientijden.
 *
 * Berekent voor elke mogelijke maatregel:
 *  - Hoeveel kWh/jaar bespaard wordt
 *  - Hoeveel €/jaar bespaard wordt
 *  - De geschatte terugverdientijd
 *  - De DPE-impact (kWh/m² reductie)
 *  - Welke combinatie nodig is om één DPE-klasse te stijgen
 */

import type {
  PortaalInput,
  PortaalResult,
  Maatregel,
  SavingsResult,
} from './types.ts';
import { compute } from './compute.ts';
import { berekenDPE } from './dpe.ts';

// ─── Maatregel-definitie templates ───────────────────────────────────────────

interface MaatregelTemplate {
  id: string;
  naam: string;
  beschrijving: string;
  categorie: Maatregel['categorie'];
  kostenPerM2: { min: number; max: number };
  bron: string;
  apply: (input: PortaalInput) => PortaalInput | null;
  getOppervlak: (input: PortaalInput) => number;
}

const MAATREGEL_TEMPLATES: MaatregelTemplate[] = [
  {
    id: 'dak-isolatie',
    naam: 'Dakisolatie',
    beschrijving: 'Isoleer het dak met minerale wol of PIR-platen (R ≥ 6 m²·K/W).',
    categorie: 'isolatie',
    kostenPerM2: { min: 40, max: 80 },
    bron: 'https://infofrankrijk.com/de-isolatie-van-het-franse-huis/',
    apply: (input) => {
      if (input.uDak <= 0.2) return null; // al goed geïsoleerd
      return { ...input, uDak: 0.17 };
    },
    getOppervlak: (input) => input.oppervlakDak,
  },
  {
    id: 'muur-isolatie-binnen',
    naam: 'Muurisolatie (binnenzijde)',
    beschrijving: 'Isoleer de muren aan de binnenkant met gipsplaat + isolatie (R ≥ 3,7 m²·K/W).',
    categorie: 'isolatie',
    kostenPerM2: { min: 50, max: 100 },
    bron: 'https://infofrankrijk.com/de-isolatie-van-het-franse-huis/',
    apply: (input) => {
      if (input.uMuur <= 0.3) return null;
      return { ...input, uMuur: 0.27 };
    },
    getOppervlak: (input) => input.oppervlakMuur,
  },
  {
    id: 'muur-isolatie-buiten',
    naam: 'Muurisolatie (buitenzijde / ITE)',
    beschrijving: 'Isoleer de muren aan de buitenkant (ITE) — effectiever dan binnenisolatie, vermindert koudebruggen.',
    categorie: 'isolatie',
    kostenPerM2: { min: 120, max: 200 },
    bron: 'https://infofrankrijk.com/de-isolatie-van-het-franse-huis/',
    apply: (input) => {
      if (input.uMuur <= 0.25) return null;
      return { ...input, uMuur: 0.22 };
    },
    getOppervlak: (input) => input.oppervlakMuur,
  },
  {
    id: 'vloer-isolatie',
    naam: 'Vloerisolatie',
    beschrijving: 'Isoleer de vloer vanuit de kruipruimte of kelder (R ≥ 3 m²·K/W).',
    categorie: 'isolatie',
    kostenPerM2: { min: 30, max: 60 },
    bron: 'https://infofrankrijk.com/de-isolatie-van-het-franse-huis/',
    apply: (input) => {
      if (input.uVloer <= 0.3) return null;
      return { ...input, uVloer: 0.25 };
    },
    getOppervlak: (input) => input.oppervlakVloer,
  },
  {
    id: 'ramen-hr',
    naam: 'Ramen HR++ (dubbel glas)',
    beschrijving: 'Vervang enkel of oud dubbel glas door HR++ beglazing (U ≤ 1,3 W/m²·K).',
    categorie: 'isolatie',
    kostenPerM2: { min: 400, max: 800 },
    bron: 'https://infofrankrijk.com/de-isolatie-van-het-franse-huis/',
    apply: (input) => {
      if (input.uRaam <= 1.5) return null;
      return { ...input, uRaam: 1.2 };
    },
    getOppervlak: (input) => input.oppervlakRaam,
  },
  {
    id: 'warmtepomp',
    naam: 'Warmtepomp (lucht-water)',
    beschrijving: 'Vervang de huidige verwarming door een lucht-water warmtepomp (SCOP ≥ 3,5).',
    categorie: 'verwarming',
    kostenPerM2: { min: 80, max: 150 }, // per m² woonoppervlak
    bron: 'https://infofrankrijk.com/de-isolatie-van-het-franse-huis/',
    apply: (input) => {
      if (input.mainHeating === 'warmtepomp') return null;
      return {
        ...input,
        mainHeating: 'warmtepomp',
        mainEfficiency: 3.5,
        dhwSystem: 'warmtepomp',
        dhwEfficiency: 3.0,
      };
    },
    getOppervlak: (input) => input.woonoppervlak,
  },
  {
    id: 'wtw-ventilatie',
    naam: 'WTW-ventilatie (warmteterugwinning)',
    beschrijving: 'Installeer een mechanisch ventilatiesysteem met warmteterugwinning (rendement ≥ 75%).',
    categorie: 'ventilatie',
    kostenPerM2: { min: 40, max: 80 },
    bron: 'https://infofrankrijk.com/de-isolatie-van-het-franse-huis/',
    apply: (input) => {
      if (input.hasHRV && input.hrvEfficiency >= 0.7) return null;
      return { ...input, hasHRV: true, hrvEfficiency: 0.80 };
    },
    getOppervlak: (input) => input.woonoppervlak,
  },
  {
    id: 'pv-panelen',
    naam: 'Zonnepanelen (3 kWp)',
    beschrijving: 'Installeer 3 kWp zonnepanelen op het dak voor eigen stroomproductie.',
    categorie: 'hernieuwbaar',
    kostenPerM2: { min: 300, max: 500 }, // per kWp (niet per m²)
    bron: 'https://infofrankrijk.com/de-isolatie-van-het-franse-huis/',
    apply: (input) => {
      if (input.hasPV) return null;
      return { ...input, hasPV: true, pvVermogen: 3, pvZelfverbruik: 0.30 };
    },
    getOppervlak: () => 3, // kWp, niet m²
  },
];

// ─── Besparingsberekening ────────────────────────────────────────────────────

/**
 * Bereken de besparing van een enkele maatregel.
 * Vergelijkt het huidige resultaat met een scenario waarin de maatregel is toegepast.
 */
function berekenMaatregel(
  input: PortaalInput,
  huidigResultaat: PortaalResult,
  template: MaatregelTemplate
): Maatregel | null {
  const gewijzigdeInput = template.apply(input);
  if (!gewijzigdeInput) return null; // maatregel niet toepasbaar

  const nieuwResultaat = compute(gewijzigdeInput);

  const besparingKwh = huidigResultaat.totaalVerbruikKwh - nieuwResultaat.totaalVerbruikKwh;
  // Vergelijk nettokosten (inclusief PV-besparing) in plaats van alleen kostenTotaal
  const besparingEur = huidigResultaat.nettoKosten - nieuwResultaat.nettoKosten;
  const co2Reductie = huidigResultaat.co2Kg - nieuwResultaat.co2Kg;
  const dpeReductie = huidigResultaat.dpe.kwhPerM2 - nieuwResultaat.dpe.kwhPerM2;

  if (besparingKwh <= 0 && besparingEur <= 0) return null;

  const oppervlak = template.getOppervlak(input);
  const kostenMin = template.kostenPerM2.min * oppervlak;
  const kostenMax = template.kostenPerM2.max * oppervlak;
  const gemKosten = (kostenMin + kostenMax) / 2;
  const terugverdientijd = besparingEur > 0 ? gemKosten / besparingEur : 999;

  return {
    id: template.id,
    naam: template.naam,
    beschrijving: template.beschrijving,
    categorie: template.categorie,
    kostenSchatting: { min: Math.round(kostenMin), max: Math.round(kostenMax) },
    besparingKwhJaar: Math.round(besparingKwh),
    besparingEurJaar: Math.round(besparingEur),
    terugverdientijdJaar: Math.round(terugverdientijd * 10) / 10,
    dpeReductieKwhM2: Math.round(dpeReductie),
    co2ReductieKg: Math.round(co2Reductie),
    bron: template.bron,
  };
}

/**
 * Bereken alle mogelijke besparingsmaatregelen en sorteer op kosteneffectiviteit.
 */
export function berekenSavings(
  input: PortaalInput,
  huidigResultaat: PortaalResult
): SavingsResult {
  const maatregelen: Maatregel[] = [];

  for (const template of MAATREGEL_TEMPLATES) {
    const maatregel = berekenMaatregel(input, huidigResultaat, template);
    if (maatregel) {
      maatregelen.push(maatregel);
    }
  }

  // Sorteer op terugverdientijd (korte terugverdientijd = meest kosteneffectief)
  maatregelen.sort((a, b) => a.terugverdientijdJaar - b.terugverdientijdJaar);

  // Totaal van alle maatregelen
  const totaalBesparingKwh = maatregelen.reduce((s, m) => s + m.besparingKwhJaar, 0);
  const totaalBesparingEur = maatregelen.reduce((s, m) => s + m.besparingEurJaar, 0);

  // Schat DPE na alle maatregelen (cumulatief)
  const nieuweKwhM2 = Math.max(0, huidigResultaat.dpe.kwhPerM2 -
    maatregelen.reduce((s, m) => s + m.dpeReductieKwhM2, 0));
  const dpeNaMaatregelen = berekenDPE(nieuweKwhM2);

  // Welke maatregelen zijn nodig om één DPE-klasse te stijgen?
  const kwhNodig = huidigResultaat.dpe.kwhTotVolgendeKlasse;
  const maatregelenVoorVolgendeDPE = vindMinimaleSetVoorDPE(maatregelen, kwhNodig);

  return {
    maatregelen,
    totaalBesparingKwh,
    totaalBesparingEur,
    dpeNaMaatregelen,
    maatregelenVoorVolgendeDPE,
  };
}

/**
 * Vind de minimale set maatregelen (gesorteerd op kWh/m² impact) die samen
 * voldoende kWh/m² besparen om één DPE-klasse te stijgen.
 */
function vindMinimaleSetVoorDPE(
  maatregelen: Maatregel[],
  kwhM2Nodig: number
): Maatregel[] {
  if (kwhM2Nodig <= 0) return [];

  // Sorteer op DPE-impact (grootste reductie eerst)
  const gesorteerd = [...maatregelen].sort(
    (a, b) => b.dpeReductieKwhM2 - a.dpeReductieKwhM2
  );

  const set: Maatregel[] = [];
  let opgebouwd = 0;

  for (const m of gesorteerd) {
    if (opgebouwd >= kwhM2Nodig) break;
    set.push(m);
    opgebouwd += m.dpeReductieKwhM2;
  }

  return set;
}
