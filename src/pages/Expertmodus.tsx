import { useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { calculate } from '../engine/calculations';
import { CoachPanel } from '../components/CoachPanel';
import { ResultWidget } from '../components/ResultWidget';

const MUUR_OPTIONS = [
  { value: 'geen', label: 'Geen isolatie' },
  { value: 'matig', label: 'Matige isolatie (< 8 cm)' },
  { value: 'goed', label: 'Goede isolatie (8–14 cm)' },
  { value: 'uitstekend', label: 'Uitstekend (> 14 cm)' },
];

const DAK_OPTIONS = [
  { value: 'geen', label: 'Geen isolatie' },
  { value: 'matig', label: 'Matig (< 12 cm)' },
  { value: 'goed', label: 'Goed (12–20 cm)' },
  { value: 'uitstekend', label: 'Uitstekend (> 20 cm)' },
];

const RAAM_OPTIONS = [
  { value: 'enkel', label: 'Enkel glas' },
  { value: 'dubbel', label: 'Dubbel glas' },
  { value: 'hr', label: 'HR++ / Triple glas' },
];

export function Expertmodus() {
  const { toolState, setField } = useToolState();

  const effectiveMuur = toolState.muurIsolatie || 'matig';
  const effectiveDak = toolState.dakIsolatie || 'matig';
  const effectiveRaam = toolState.raamType || 'dubbel';

  const expertResult = useMemo(
    () =>
      calculate({
        oppervlakte: toolState.oppervlakte,
        isolatie: toolState.isolatie,
        verwarming: toolState.verwarming,
        muurIsolatie: effectiveMuur,
        dakIsolatie: effectiveDak,
        raamType: effectiveRaam,
      }),
    [toolState.oppervlakte, toolState.isolatie, toolState.verwarming, effectiveMuur, effectiveDak, effectiveRaam]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold" style={{ color: '#800000' }}>
          🔬 Expertmodus — Warmteverlies-calculator
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gedetailleerde woningmodellering op basis van U-waarden voor een nauwkeurige
          warmteverliescalculatie (NEN-EN 12831).
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
        <strong>Tip:</strong> Vul eerst de basisgegevens in via het tabblad "Snel advies". De
        expertmodus verfijnt de berekening met U-waarden per bouwdeel.
      </div>

      {/* Extra fields */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h3 className="font-heading font-semibold text-sm text-gray-700">Bouwkundige details</h3>

        <SelectField
          id="muurIsolatie"
          label="Muurisolatie"
          value={effectiveMuur}
          options={MUUR_OPTIONS}
          onChange={(v) => setField('muurIsolatie', v)}
        />

        <SelectField
          id="dakIsolatie"
          label="Dakisolatie"
          value={effectiveDak}
          options={DAK_OPTIONS}
          onChange={(v) => setField('dakIsolatie', v)}
        />

        <SelectField
          id="raamType"
          label="Raamtype"
          value={effectiveRaam}
          options={RAAM_OPTIONS}
          onChange={(v) => setField('raamType', v)}
        />
      </div>

      {/* Warmteverlies detail panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-heading font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">
          Warmteverlies-analyse
        </h3>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="text-2xl font-bold font-heading px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: '#800000' }}
          >
            {(expertResult.warmteverliesW / 1000).toFixed(1)} kW
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Ontwerpwarmteverlies</p>
            <p className="text-xs text-gray-500">bij buitentemperatuur −10 °C / binnen 21 °C</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center text-sm">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="font-bold text-gray-800">
              {Math.round(expertResult.warmteverliesW / (Math.max(Number(toolState.oppervlakte) || 100, 1)))} W/m²
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Specifiek warmteverlies</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="font-bold text-gray-800">
              {expertResult.jaarverbruikKwh.toLocaleString('nl')} kWh
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Jaarverbruik (expert)</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Berekening gebaseerd op NEN-EN 12831 vereenvoudigd; 2 400 graaddagen (basis 17 °C);
          verhouding gevel/vloer 2,5; ramen 20% van vloeroppervlak.
        </p>
      </div>

      {/* Shared result */}
      <ResultWidget />

      <CoachPanel errors={[]} />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
