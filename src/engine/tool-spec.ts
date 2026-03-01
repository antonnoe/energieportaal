/**
 * tool-spec.ts — Centrale velddefinities, validatieregels en metadata.
 * Single source of truth voor de UI, de coach, en de engine.
 *
 * Gestructureerd per stap van de 5-stappen invoerflow:
 *   Stap 1: Locatie
 *   Stap 2: Woningtype
 *   Stap 3: Verfijning (isolatie, oppervlakken)
 *   Stap 4: Energie (verwarming, tapwater, apparaten, PV, EV, zwembad)
 *   Stap 5: Financieel (energieprijzen, stookgedrag, subsidie-parameters)
 */

import { ZONES } from './constants.ts';
import { HUIZEN_MATRIX } from '../data/huizen-matrix.ts';

// ─── Basistypen ──────────────────────────────────────────────────────────────

export type FieldType = 'number' | 'select' | 'text' | 'boolean';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  min?: number;
  max?: number;
  unit?: string;
  options?: FieldOption[];
  helpText?: string;
  defaultValue?: number | string | boolean;
  step?: number; // stap 1–5
}

export interface ValidationError {
  fieldId: string;
  message: string;
}

// ─── Stap 1: Locatie ─────────────────────────────────────────────────────────

export const stap1Fields: FieldDef[] = [
  {
    id: 'postcode',
    label: 'Postcode',
    type: 'text',
    required: true,
    helpText: 'Voer uw Franse postcode in (5 cijfers). Hieruit wordt automatisch de klimaatzone bepaald.',
    defaultValue: '',
    step: 1,
  },
  {
    id: 'zoneId',
    label: 'Klimaatzone',
    type: 'select',
    required: true,
    helpText: 'Wordt automatisch ingevuld op basis van uw postcode. U kunt dit handmatig aanpassen.',
    defaultValue: 'paris',
    options: ZONES.map((z) => ({ value: z.id, label: z.name })),
    step: 1,
  },
];

// ─── Stap 2: Woningtype ─────────────────────────────────────────────────────

export const stap2Fields: FieldDef[] = [
  {
    id: 'huisTypeId',
    label: 'Woningtype',
    type: 'select',
    required: true,
    helpText: 'Selecteer het type woning. Hierdoor worden automatisch typische U-waarden en oppervlakken ingevuld.',
    defaultValue: 'pavillon',
    options: HUIZEN_MATRIX.map((h) => ({ value: h.id, label: `${h.naam} (${h.periode})` })),
    step: 2,
  },
  {
    id: 'woonoppervlak',
    label: 'Woonoppervlakte',
    type: 'number',
    required: true,
    min: 10,
    max: 2000,
    unit: 'm²',
    helpText: 'Totale verwarmde woonoppervlakte.',
    defaultValue: 100,
    step: 2,
  },
  {
    id: 'verdiepingen',
    label: 'Aantal verdiepingen',
    type: 'number',
    required: true,
    min: 1,
    max: 5,
    helpText: 'Aantal woonlagen (niet meegerekend: kelder, zolder zonder verwarming).',
    defaultValue: 1,
    step: 2,
  },
];

// ─── Stap 3: Verfijning ─────────────────────────────────────────────────────

export const stap3Fields: FieldDef[] = [
  {
    id: 'uMuur',
    label: 'U-waarde muren',
    type: 'number',
    required: true,
    min: 0.1,
    max: 5.0,
    unit: 'W/m²·K',
    helpText: 'Warmtedoorgangscoëfficiënt van de buitenmuren. Hoe lager, hoe beter geïsoleerd.',
    defaultValue: 2.8,
    step: 3,
  },
  {
    id: 'uDak',
    label: 'U-waarde dak',
    type: 'number',
    required: true,
    min: 0.1,
    max: 5.0,
    unit: 'W/m²·K',
    helpText: 'Warmtedoorgangscoëfficiënt van het dak. Bij goed geïsoleerd dak ~0.2.',
    defaultValue: 3.0,
    step: 3,
  },
  {
    id: 'uVloer',
    label: 'U-waarde vloer',
    type: 'number',
    required: true,
    min: 0.1,
    max: 3.0,
    unit: 'W/m²·K',
    helpText: 'Warmtedoorgangscoëfficiënt van de begane grondvloer.',
    defaultValue: 1.2,
    step: 3,
  },
  {
    id: 'uRaam',
    label: 'U-waarde ramen',
    type: 'number',
    required: true,
    min: 0.5,
    max: 6.0,
    unit: 'W/m²·K',
    helpText: 'Enkel glas ≈ 5.8, oud dubbel glas ≈ 2.8, HR++ ≈ 1.2.',
    defaultValue: 4.0,
    step: 3,
  },
  {
    id: 'oppervlakMuur',
    label: 'Oppervlak muren',
    type: 'number',
    required: true,
    min: 0,
    max: 2000,
    unit: 'm²',
    helpText: 'Totaal buitenmuuroppervlak (excl. ramen en deuren).',
    defaultValue: 120,
    step: 3,
  },
  {
    id: 'oppervlakDak',
    label: 'Oppervlak dak',
    type: 'number',
    required: true,
    min: 0,
    max: 2000,
    unit: 'm²',
    helpText: 'Oppervlak van het dak boven verwarmde ruimte. Bij appartement: 0.',
    defaultValue: 80,
    step: 3,
  },
  {
    id: 'oppervlakVloer',
    label: 'Oppervlak vloer',
    type: 'number',
    required: true,
    min: 0,
    max: 2000,
    unit: 'm²',
    helpText: 'Oppervlak van de begane grondvloer. Bij appartement: 0.',
    defaultValue: 80,
    step: 3,
  },
  {
    id: 'oppervlakRaam',
    label: 'Oppervlak ramen',
    type: 'number',
    required: true,
    min: 0,
    max: 500,
    unit: 'm²',
    helpText: 'Totaal glasoppervlak van alle ramen en deuren.',
    defaultValue: 15,
    step: 3,
  },
  {
    id: 'ach',
    label: 'Luchtwisseling (ACH)',
    type: 'number',
    required: true,
    min: 0.1,
    max: 2.0,
    unit: '/uur',
    helpText: 'Aantal luchtwisselingen per uur. Oud huis ≈ 0.8, nieuwbouw ≈ 0.3.',
    defaultValue: 0.8,
    step: 3,
  },
  {
    id: 'plafondHoogte',
    label: 'Plafondhoogte',
    type: 'number',
    required: false,
    min: 2.0,
    max: 5.0,
    unit: 'm',
    helpText: 'Gemiddelde plafondhoogte. Standaard 2,5 m.',
    defaultValue: 2.5,
    step: 3,
  },
];

// ─── Stap 4: Energie ─────────────────────────────────────────────────────────

const verwarmingOptions: FieldOption[] = [
  { value: 'gas', label: 'Gasketel' },
  { value: 'stookolie', label: 'Stookolie (mazout)' },
  { value: 'warmtepomp', label: 'Warmtepomp' },
  { value: 'elektrisch', label: 'Elektrisch (direct)' },
  { value: 'hout', label: 'Hout / Pellet' },
];

export const stap4Fields: FieldDef[] = [
  // Hoofdverwarming
  {
    id: 'mainHeating',
    label: 'Hoofdverwarming',
    type: 'select',
    required: true,
    helpText: 'Het primaire verwarmingssysteem.',
    defaultValue: 'gas',
    options: verwarmingOptions,
    step: 4,
  },
  {
    id: 'mainEfficiency',
    label: 'Rendement/SCOP hoofdverwarming',
    type: 'number',
    required: false,
    min: 0.5,
    max: 6.0,
    helpText: 'Gasketel ≈ 0.90, warmtepomp ≈ 3.5. Laat leeg voor standaard.',
    defaultValue: 0,
    step: 4,
  },
  // Bijverwarming
  {
    id: 'auxHeating',
    label: 'Bijverwarming',
    type: 'select',
    required: false,
    helpText: 'Eventueel tweede verwarmingssysteem (bijv. houtkachel).',
    defaultValue: 'geen',
    options: [{ value: 'geen', label: 'Geen bijverwarming' }, ...verwarmingOptions],
    step: 4,
  },
  {
    id: 'auxFraction',
    label: 'Aandeel bijverwarming',
    type: 'number',
    required: false,
    min: 0,
    max: 90,
    unit: '%',
    helpText: 'Hoeveel % van de warmtevraag levert de bijverwarming? (0–90%)',
    defaultValue: 0,
    step: 4,
  },
  // Ventilatie
  {
    id: 'hasHRV',
    label: 'WTW-ventilatie aanwezig',
    type: 'boolean',
    required: false,
    helpText: 'Heeft u een mechanisch ventilatiesysteem met warmteterugwinning (VMC double flux)?',
    defaultValue: false,
    step: 4,
  },
  {
    id: 'hrvEfficiency',
    label: 'WTW-rendement',
    type: 'number',
    required: false,
    min: 0,
    max: 95,
    unit: '%',
    helpText: 'Rendement van het warmteterugwinningssysteem (typisch 70–90%).',
    defaultValue: 75,
    step: 4,
  },
  // Tapwater
  {
    id: 'personen',
    label: 'Aantal personen',
    type: 'number',
    required: true,
    min: 1,
    max: 10,
    helpText: 'Aantal bewoners (voor tapwaterberekening).',
    defaultValue: 2,
    step: 4,
  },
  {
    id: 'douchesPerDag',
    label: 'Douches per persoon per dag',
    type: 'number',
    required: false,
    min: 0,
    max: 3,
    helpText: 'Gemiddeld aantal douches per persoon per dag.',
    defaultValue: 1,
    step: 4,
  },
  {
    id: 'dhwSystem',
    label: 'Tapwater-systeem',
    type: 'select',
    required: true,
    helpText: 'Hoe wordt het tapwater verwarmd?',
    defaultValue: 'gas',
    options: verwarmingOptions,
    step: 4,
  },
  // Elektriciteit
  {
    id: 'basisElektriciteit',
    label: 'Basiselektriciteit',
    type: 'number',
    required: false,
    min: 0,
    max: 20000,
    unit: 'kWh/jaar',
    helpText: 'Geschat jaarlijks elektriciteitsverbruik excl. verwarming (standaard 2.500 kWh).',
    defaultValue: 2500,
    step: 4,
  },
  // EV
  {
    id: 'hasEV',
    label: 'Elektrische auto',
    type: 'boolean',
    required: false,
    helpText: 'Laadt u thuis een elektrische auto op?',
    defaultValue: false,
    step: 4,
  },
  {
    id: 'evKmPerJaar',
    label: 'Kilometers per jaar (EV)',
    type: 'number',
    required: false,
    min: 0,
    max: 100000,
    unit: 'km',
    helpText: 'Geschat aantal kilometers per jaar met de EV.',
    defaultValue: 15000,
    step: 4,
  },
  // PV
  {
    id: 'hasPV',
    label: 'Zonnepanelen',
    type: 'boolean',
    required: false,
    helpText: 'Heeft u zonnepanelen (of plant u ze)?',
    defaultValue: false,
    step: 4,
  },
  {
    id: 'pvVermogen',
    label: 'PV-vermogen',
    type: 'number',
    required: false,
    min: 0,
    max: 50,
    unit: 'kWp',
    helpText: 'Totaal geïnstalleerd vermogen van de zonnepanelen.',
    defaultValue: 3,
    step: 4,
  },
  {
    id: 'pvZelfverbruik',
    label: 'PV-zelfverbruik',
    type: 'number',
    required: false,
    min: 0,
    max: 100,
    unit: '%',
    helpText: 'Percentage zonnestroom dat u zelf verbruikt (typisch 25–40%).',
    defaultValue: 30,
    step: 4,
  },
  // Zwembad
  {
    id: 'hasZwembad',
    label: 'Zwembad',
    type: 'boolean',
    required: false,
    helpText: 'Heeft u een (verwarmd) zwembad?',
    defaultValue: false,
    step: 4,
  },
  {
    id: 'zwembadOppervlak',
    label: 'Zwembad oppervlak',
    type: 'number',
    required: false,
    min: 0,
    max: 200,
    unit: 'm²',
    helpText: 'Wateroppervlak van het zwembad.',
    defaultValue: 32,
    step: 4,
  },
  // Koeling
  {
    id: 'hasKoeling',
    label: 'Airconditioning',
    type: 'boolean',
    required: false,
    helpText: 'Gebruikt u airconditioning in de zomer?',
    defaultValue: false,
    step: 4,
  },
];

// ─── Stap 5: Financieel ─────────────────────────────────────────────────────

export const stap5Fields: FieldDef[] = [
  {
    id: 'setpoint',
    label: 'Stooktemperatuur (aanwezig)',
    type: 'number',
    required: false,
    min: 15,
    max: 25,
    unit: '°C',
    helpText: 'Gewenste binnentemperatuur wanneer u thuis bent.',
    defaultValue: 20,
    step: 5,
  },
  {
    id: 'awaySetpoint',
    label: 'Stooktemperatuur (afwezig)',
    type: 'number',
    required: false,
    min: 5,
    max: 20,
    unit: '°C',
    helpText: 'Temperatuur wanneer u langere tijd afwezig bent (vorstbeveiliging).',
    defaultValue: 16,
    step: 5,
  },
  {
    id: 'daysPresent',
    label: 'Dagen aanwezig',
    type: 'number',
    required: false,
    min: 0,
    max: 365,
    unit: 'dagen/jaar',
    helpText: 'Aantal dagen per jaar dat u daadwerkelijk in de woning verblijft.',
    defaultValue: 300,
    step: 5,
  },
  {
    id: 'daysAway',
    label: 'Dagen afwezig',
    type: 'number',
    required: false,
    min: 0,
    max: 365,
    unit: 'dagen/jaar',
    helpText: 'Aantal dagen per jaar dat de woning onbewoond is (wordt automatisch berekend).',
    defaultValue: 65,
    step: 5,
  },
  // Energieprijzen
  {
    id: 'prijsGas',
    label: 'Gasprijs',
    type: 'number',
    required: false,
    min: 0.01,
    max: 1.0,
    unit: '€/kWh',
    helpText: 'Gas (PCI feb 2026): 0,1051 €/kWh.',
    defaultValue: 0.1051,
    step: 5,
  },
  {
    id: 'prijsElektriciteit',
    label: 'Elektriciteitsprijs',
    type: 'number',
    required: false,
    min: 0.01,
    max: 1.0,
    unit: '€/kWh',
    helpText: 'Elektriciteit (TRV feb 2026): 0,2516 €/kWh.',
    defaultValue: 0.2516,
    step: 5,
  },
  {
    id: 'prijsStookolie',
    label: 'Stookolieprijs',
    type: 'number',
    required: false,
    min: 0.01,
    max: 1.0,
    unit: '€/kWh',
    helpText: 'Stookolie (fioul): 1,18 €/L ÷ 10 kWh/L = 0,118 €/kWh.',
    defaultValue: 0.118,
    step: 5,
  },
  {
    id: 'prijsHout',
    label: 'Houtprijs',
    type: 'number',
    required: false,
    min: 0.01,
    max: 0.5,
    unit: '€/kWh',
    helpText: 'Hout: 85 €/stère ÷ 1500 kWh = 0,057 €/kWh. Pellet: 0,080 €/kWh.',
    defaultValue: 0.057,
    step: 5,
  },
  {
    id: 'exportTarief',
    label: 'PV-exporttarief',
    type: 'number',
    required: false,
    min: 0,
    max: 0.5,
    unit: '€/kWh',
    helpText: 'Tarief voor teruglevering zonnestroom (OA EDF S1 2026).',
    defaultValue: 0.13,
    step: 5,
  },
];

// ─── Alle stappen samen ──────────────────────────────────────────────────────

export const allStepFields: FieldDef[][] = [
  stap1Fields,
  stap2Fields,
  stap3Fields,
  stap4Fields,
  stap5Fields,
];

// ─── Validatie ───────────────────────────────────────────────────────────────

/** Valideer een set waarden tegen de velddefinities */
export function validateFields(
  fields: FieldDef[],
  values: Record<string, unknown>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    const raw = values[field.id];

    if (field.required && (raw === undefined || raw === null || raw === '')) {
      errors.push({ fieldId: field.id, message: `${field.label} is verplicht.` });
      continue;
    }

    if (field.type === 'number' && raw !== undefined && raw !== '' && raw !== null) {
      const num = Number(raw);
      if (isNaN(num)) {
        errors.push({ fieldId: field.id, message: `${field.label} moet een getal zijn.` });
      } else if (field.min !== undefined && num < field.min) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} moet minimaal ${field.min} ${field.unit ?? ''} zijn.`,
        });
      } else if (field.max !== undefined && num > field.max) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} mag maximaal ${field.max} ${field.unit ?? ''} zijn.`,
        });
      }
    }
  }

  return errors;
}

/** Valideer een specifieke stap (1–5) */
export function validateStep(
  step: number,
  values: Record<string, unknown>
): ValidationError[] {
  const fields = allStepFields[step - 1];
  if (!fields) return [];
  return validateFields(fields, values);
}
