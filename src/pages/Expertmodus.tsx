import { useToolState } from '../context/ToolStateContext';
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold" style={{ color: '#800000' }}>
          🔬 Expertmodus
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gedetailleerde woningmodellering voor een nauwkeurigere berekening.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
        <strong>Tip:</strong> Vul eerst de basisgegevens in via het tabblad "Snel advies". De
        expertmodus verfijnt de berekening.
      </div>

      {/* Extra fields */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h3 className="font-heading font-semibold text-sm text-gray-700">Bouwkundige details</h3>

        <SelectField
          id="muurIsolatie"
          label="Muurisolatie"
          value={toolState.muurIsolatie}
          options={MUUR_OPTIONS}
          onChange={(v) => setField('muurIsolatie', v)}
        />

        <SelectField
          id="dakIsolatie"
          label="Dakisolatie"
          value={toolState.dakIsolatie}
          options={DAK_OPTIONS}
          onChange={(v) => setField('dakIsolatie', v)}
        />

        <SelectField
          id="raamType"
          label="Raamtype"
          value={toolState.raamType}
          options={RAAM_OPTIONS}
          onChange={(v) => setField('raamType', v)}
        />
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
