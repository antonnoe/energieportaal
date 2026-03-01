/**
 * types.ts — Centrale TypeScript types voor de rekenmotor.
 * Alle invoer- en resultaatobjecten voor het EnergiePortaal.
 */

// ─── Klimaatzone ──────────────────────────────────────────────────────────────

export interface Zone {
  id: string;
  name: string;
  hdd: number;       // Heating Degree Days (basis 18 °C)
  cdd: number;       // Cooling Degree Days
  pv: number;        // PV-opbrengst kWh/kWp/jaar
  pool_temp: number;  // gemiddelde zwembadtemperatuur °C
  Tref: number;       // referentie buitentemperatuur °C
}

// ─── Woningtype (uit huizenmatrix) ────────────────────────────────────────────

export interface HuisType {
  id: string;
  naam: string;
  periode: string;
  uMuur: number;       // W/m²·K
  uDak: number;
  uVloer: number;
  uRaam: number;
  ach: number;         // luchtwisselingen per uur
  beschrijving: string;
  thermischeMassa: 'laag' | 'midden' | 'hoog';
  isolatiescore: number;  // 1–10
  vochtadvies: string;
  waarschuwingen: string[];
  oppervlakteRatios: {
    muurPerM2: number;   // m² muur per m² woonoppervlak
    dakPerM2: number;
    vloerPerM2: number;
    raamPerM2: number;
  };
  bron: string;
}

// ─── Verwarmingstype ──────────────────────────────────────────────────────────

export type VerwarmingType = 'gas' | 'stookolie' | 'warmtepomp' | 'elektrisch' | 'hout';

// ─── Subsidie types ───────────────────────────────────────────────────────────

export type UsageType = 'rp' | 'secondaire' | 'verhuur' | 'onbekend';
export type AgeType = 'ja' | 'nee' | 'onbekend';
export type StageType = 'voor' | 'offertes' | 'getekend' | 'gestart';
export type WorkType = 'envelop' | 'ventilatie' | 'verwarming' | 'combo' | 'onbekend';
export type MprPath = 'geste' | 'ampleur' | 'onbekend';
export type StoplichtStatus = 'green' | 'amber' | 'red';

export interface SubsidieIntake {
  usage: UsageType;
  ageGt2: AgeType;
  stage: StageType;
  workType: WorkType;
  mprPath: MprPath;
  heatlossDone: boolean;
}

export interface SubsidieCard {
  id: string;
  title: string;
  shortTitle: string;
  status: StoplichtStatus;
  reason: string;
  amount: string;
  url: string;
  eligible: boolean;
}

export interface SubsidieResult {
  cards: SubsidieCard[];
  actionPlan: string[];
}

// ─── Bron ─────────────────────────────────────────────────────────────────────

export interface Bron {
  id: string;
  titel: string;
  url: string;
  beschrijving: string;
}

// ─── Hoofdinvoer voor de rekenmotor ───────────────────────────────────────────

export interface PortaalInput {
  // ── Stap 1: Locatie ──
  postcode: string;
  departement: string;
  zoneId: string;

  // ── Stap 2: Woningtype ──
  huisTypeId: string;

  // ── Stap 3: Verfijning ──
  woonoppervlak: number;        // m²
  verdiepingen: number;
  plafondHoogte: number;        // m (standaard 2.5)

  uMuur: number;                // W/m²·K
  uDak: number;
  uVloer: number;
  uRaam: number;

  oppervlakMuur: number;        // m²
  oppervlakDak: number;
  oppervlakVloer: number;
  oppervlakRaam: number;

  ach: number;                  // luchtwisselingen/uur

  // ── Stap 4: Energie ──
  // Verwarming
  mainHeating: VerwarmingType;
  mainEfficiency: number;       // SCOP of η (0 = gebruik standaard)
  auxHeating: VerwarmingType | 'geen';
  auxFraction: number;          // 0–0.9
  auxEfficiency: number;        // 0 = gebruik standaard

  // Ventilatie
  hasHRV: boolean;              // WTW aanwezig
  hrvEfficiency: number;        // 0–1

  // Tapwater (DHW)
  personen: number;
  douchesPerDag: number;
  literPerDouche: number;
  dhwSystem: VerwarmingType;
  dhwEfficiency: number;        // 0 = gebruik standaard

  // Elektriciteit
  basisElektriciteit: number;   // kWh/jaar

  // Elektrische auto
  hasEV: boolean;
  evKmPerJaar: number;
  evVerbruik: number;           // kWh/km (standaard 0.20)

  // Zonnepanelen
  hasPV: boolean;
  pvVermogen: number;           // kWp
  pvZelfverbruik: number;       // fractie 0–1

  // Zwembad
  hasZwembad: boolean;
  zwembadOppervlak: number;     // m²
  zwembadMaanden: number;       // maanden actief

  // Koeling
  hasKoeling: boolean;
  koelingEER: number;           // standaard 3.0

  // ── Stap 5: Financieel ──
  // Stookgedrag
  setpoint: number;             // °C (standaard 20)
  awaySetpoint: number;         // °C (standaard 16)
  daysPresent: number;          // dagen/jaar aanwezig
  daysAway: number;             // dagen/jaar afwezig

  // Energieprijzen (€/kWh)
  prijsGas: number;
  prijsStookolie: number;
  prijsElektriciteit: number;
  prijsHout: number;
  exportTarief: number;         // PV-export €/kWh

  // Subsidie
  subsidieIntake: SubsidieIntake;
}

// ─── DPE-resultaat ────────────────────────────────────────────────────────────

export interface DPEResultaat {
  letter: string;               // A–G
  kwhPerM2: number;             // kWh/m²/jaar
  kleur: string;                // hex kleur
  maxKwhVoorKlasse: number;     // bovengrens van huidige klasse
  kwhTotVolgendeKlasse: number; // hoeveel besparen om 1 stap omhoog
  kwhTotLagereKlasse: number;   // hoeveel meer tot 1 stap omlaag
  verhuurverbod: VerhuurverbodInfo | null;
}

export interface VerhuurverbodInfo {
  verboden: boolean;
  sindsJaar: number;
  beschrijving: string;
}

// ─── Hoofdresultaat van de rekenmotor ─────────────────────────────────────────

export interface PortaalResult {
  // Warmteverlies
  uaWK: number;                 // transmissie UA [W/K]
  hventWK: number;              // ventilatie [W/K]
  hventEffWK: number;           // ventilatie na WTW [W/K]
  hTotaalWK: number;            // totaal H [W/K]

  // HDD
  hddPresent: number;
  hddAway: number;

  // Energieverbruik per categorie (kWh/jaar)
  warmtevraagThermisch: number; // thermische warmtevraag
  verwarmingHoofd: number;      // hoofd-verwarming na SCOP/η
  verwarmingBij: number;        // bijverwarming na SCOP/η
  verwarmingTotaal: number;     // hoofd + bij
  dhwThermisch: number;         // thermische tapwatervraag
  dhwInput: number;             // tapwater na rendement
  elektriciteitBasis: number;
  evKwh: number;
  zwembadKwh: number;
  koelingKwh: number;
  totaalVerbruikKwh: number;

  // PV
  pvProductieKwh: number;
  pvZelfverbruikKwh: number;
  pvExportKwh: number;
  netGridKwh: number;

  // DPE
  dpe: DPEResultaat;

  // CO₂
  co2Kg: number;

  // Kosten (€/jaar)
  kostenVerwarming: number;
  kostenDhw: number;
  kostenElektriciteit: number;
  kostenTotaal: number;
  pvBesparing: number;
  nettoKosten: number;

  // Debug — elke tussenstap
  debug: DebugInfo;
}

export interface DebugInfo {
  zone: Zone;
  huisType: string;

  // U-waarden × oppervlakken
  uaMuur: number;
  uaDak: number;
  uaVloer: number;
  uaRaam: number;

  // Volume & ventilatie
  volume: number;
  achGebruikt: number;
  hventVoorHRV: number;

  // HDD-berekening
  setpoint: number;
  awaySetpoint: number;
  Tref: number;
  hddBasis: number;
  hddCorrPresent: number;
  hddCorrAway: number;
  fracPresent: number;
  fracAway: number;

  // Verwarming
  mainFrac: number;
  mainEff: number;
  auxFrac: number;
  auxEff: number;

  // DHW
  dhwLitersPerDag: number;
  dhwDeltaT: number;
  dhwEff: number;

  // PV
  pvYieldZone: number;

  // Prijzen
  prijzen: Record<string, number>;
}

// ─── Maatregel / besparing ────────────────────────────────────────────────────

export type MaatregelCategorie = 'isolatie' | 'verwarming' | 'ventilatie' | 'hernieuwbaar';

export interface Maatregel {
  id: string;
  naam: string;
  beschrijving: string;
  categorie: MaatregelCategorie;
  kostenSchatting: { min: number; max: number };  // €
  besparingKwhJaar: number;
  besparingEurJaar: number;
  terugverdientijdJaar: number;
  dpeReductieKwhM2: number;                       // kWh/m² reductie
  co2ReductieKg: number;
  bron: string;
}

export interface SavingsResult {
  maatregelen: Maatregel[];
  totaalBesparingKwh: number;
  totaalBesparingEur: number;
  dpeNaMaatregelen: DPEResultaat;
  maatregelenVoorVolgendeDPE: Maatregel[];
}
