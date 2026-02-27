/**
 * tool-spec.ts — Central field definitions, validation rules, and metadata.
 * This single source of truth is consumable by both the UI and the coach.
 */

export type FieldType = 'number' | 'select' | 'text';

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
  defaultValue?: number | string;
}

export interface ValidationError {
  fieldId: string;
  message: string;
}

/** All field definitions for the quick-advice (Snel advies) flow */
export const snelAdviesFields: FieldDef[] = [
  {
    id: 'oppervlakte',
    label: 'Woonoppervlakte',
    type: 'number',
    required: true,
    min: 10,
    max: 1000,
    unit: 'm²',
    helpText: 'Totale verwarmde woonoppervlakte in vierkante meter.',
    defaultValue: 100,
  },
  {
    id: 'bouwjaar',
    label: 'Bouwjaar',
    type: 'number',
    required: true,
    min: 1800,
    max: new Date().getFullYear(),
    unit: 'jaar',
    helpText: 'Het jaar waarin de woning gebouwd is.',
    defaultValue: 1980,
  },
  {
    id: 'isolatie',
    label: 'Isolatieniveau',
    type: 'select',
    required: true,
    helpText: 'Selecteer het huidige isolatieniveau van de woning.',
    defaultValue: 'matig',
    options: [
      { value: 'slecht', label: 'Slecht (< 1980, geen isolatie)' },
      { value: 'matig', label: 'Matig (deels geïsoleerd)' },
      { value: 'goed', label: 'Goed (volledig geïsoleerd)' },
      { value: 'uitstekend', label: 'Uitstekend (passiefhuis)' },
    ],
  },
  {
    id: 'verwarming',
    label: 'Verwarmingssysteem',
    type: 'select',
    required: true,
    helpText: 'Het primaire verwarmingssysteem in de woning.',
    defaultValue: 'gas',
    options: [
      { value: 'gas', label: 'Gasketel' },
      { value: 'stookolie', label: 'Stookolie' },
      { value: 'warmtepomp', label: 'Warmtepomp' },
      { value: 'elektrisch', label: 'Elektrisch (direct)' },
      { value: 'hout', label: 'Hout/Pellet' },
    ],
  },
];

/** Validate a partial toolState against the field definitions */
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

    if (field.type === 'number' && raw !== undefined && raw !== '') {
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
