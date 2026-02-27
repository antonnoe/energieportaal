import { useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { snelAdviesFields, validateFields } from '../engine/tool-spec';
import { calculate } from '../engine/calculations';
import { CoachPanel } from '../components/CoachPanel';
import { ResultWidget } from '../components/ResultWidget';
import { PdfExportButton } from '../components/PdfExport';

export function SnelAdvies() {
  const { toolState, setField } = useToolState();

  const errors = useMemo(
    () => validateFields(snelAdviesFields, toolState as unknown as Record<string, unknown>),
    [toolState]
  );

  const result = useMemo(
    () => calculate({ oppervlakte: toolState.oppervlakte, isolatie: toolState.isolatie, verwarming: toolState.verwarming }),
    [toolState.oppervlakte, toolState.isolatie, toolState.verwarming]
  );

  const helpTexts = Object.fromEntries(
    snelAdviesFields.filter((f) => f.helpText).map((f) => [f.id, f.helpText!])
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold" style={{ color: '#800000' }}>
          ⚡ Snel advies
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Vul de basisgegevens in en krijg direct een indicatieve energieschatting.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        {snelAdviesFields.map((field) => {
          const error = errors.find((e) => e.fieldId === field.id);
          return (
            <div key={field.id}>
              <label
                htmlFor={field.id}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.label}
                {field.unit && <span className="text-gray-400 ml-1">({field.unit})</span>}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  id={field.id}
                  value={(toolState as unknown as Record<string, string>)[field.id] ?? ''}
                  onChange={(e) => setField(field.id as keyof typeof toolState, e.target.value)}
                  className={[
                    'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]',
                    error ? 'border-red-400 bg-red-50' : 'border-gray-300',
                  ].join(' ')}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.id}
                  type={field.type}
                  value={(toolState as unknown as Record<string, string>)[field.id] ?? ''}
                  onChange={(e) => setField(field.id as keyof typeof toolState, e.target.value)}
                  min={field.min}
                  max={field.max}
                  className={[
                    'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]',
                    error ? 'border-red-400 bg-red-50' : 'border-gray-300',
                  ].join(' ')}
                />
              )}

              {error && (
                <p className="text-xs text-red-600 mt-1">⚠️ {error.message}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Result */}
      <ResultWidget />

      {/* PDF export */}
      <div className="flex justify-end">
        <PdfExportButton toolState={toolState} result={result} />
      </div>

      {/* Coach */}
      <CoachPanel errors={errors} helpTexts={helpTexts} />
    </div>
  );
}
