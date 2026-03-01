import { useToolState } from '../context/ToolStateContext';
import type { ToolState } from '../context/ToolStateContext';

const VERWARMING_OPTIES = [
  { value: 'gas', label: 'Gasketel' },
  { value: 'stookolie', label: 'Stookolie (mazout)' },
  { value: 'warmtepomp', label: 'Warmtepomp' },
  { value: 'elektrisch', label: 'Elektrisch (direct)' },
  { value: 'hout', label: 'Hout / Pellet' },
];

function NumField({ id, label, value, unit, onChange, min, max, step }: {
  id: string; label: string; value: string; unit?: string;
  onChange: (v: string) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1">{label}</label>
      <div className="relative">
        <input
          id={id} type="number" min={min} max={max} step={step ?? 1}
          value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}

function SelectField({ id, label, value, options, onChange }: {
  id: string; label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1">{label}</label>
      <select
        id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ id, label, value, onChange, helpText }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; helpText?: string;
}) {
  const checked = value === 'ja';
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <label htmlFor={id} className="text-sm font-semibold cursor-pointer">{label}</label>
        {helpText && <p className="text-xs text-gray-400">{helpText}</p>}
      </div>
      <button
        id={id} type="button" role="switch" aria-checked={checked}
        onClick={() => onChange(checked ? 'nee' : 'ja')}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-heading text-sm font-bold text-gray-700 uppercase tracking-wide">{children}</h3>;
}

export function Step4Energie() {
  const { toolState, setField } = useToolState();
  const sf = (key: keyof ToolState) => (v: string) => setField(key, v);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 4: Energie</h2>
        <p className="text-sm text-gray-500">Verwarmingssystemen, tapwater, ventilatie en optionele apparaten.</p>
      </div>

      {/* Verwarming */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SectionTitle>Verwarming</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <SelectField id="mainHeating" label="Hoofdverwarming" value={toolState.mainHeating} options={VERWARMING_OPTIES} onChange={sf('mainHeating')} />
          <NumField id="mainEfficiency" label="Rendement/SCOP" value={toolState.mainEfficiency} onChange={sf('mainEfficiency')} min={0} max={6} step={0.1} />
        </div>
        <p className="text-xs text-gray-400">SCOP: warmtepomp ~3.5 · Gasketel ~0.90 · 0 = standaard gebruiken</p>

        <SelectField
          id="auxHeating" label="Bijverwarming"
          value={toolState.auxHeating}
          options={[{ value: 'geen', label: 'Geen bijverwarming' }, ...VERWARMING_OPTIES]}
          onChange={sf('auxHeating')}
        />
        {toolState.auxHeating !== 'geen' && (
          <NumField id="auxFraction" label="Aandeel bijverwarming" value={toolState.auxFraction} unit="%" onChange={sf('auxFraction')} min={0} max={90} step={5} />
        )}
      </div>

      {/* Ventilatie */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SectionTitle>Ventilatie</SectionTitle>
        <Toggle id="hasHRV" label="WTW-ventilatie (VMC double flux)" value={toolState.hasHRV} onChange={sf('hasHRV')} helpText="Mechanische ventilatie met warmteterugwinning" />
        {toolState.hasHRV === 'ja' && (
          <NumField id="hrvEfficiency" label="WTW-rendement" value={toolState.hrvEfficiency} unit="%" onChange={sf('hrvEfficiency')} min={50} max={95} step={5} />
        )}
      </div>

      {/* Tapwater */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SectionTitle>Tapwater</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <NumField id="personen" label="Personen" value={toolState.personen} onChange={sf('personen')} min={1} max={10} />
          <NumField id="douchesPerDag" label="Douches/dag/pp" value={toolState.douchesPerDag} onChange={sf('douchesPerDag')} min={0} max={3} step={0.5} />
          <NumField id="literPerDouche" label="Liter/douche" value={toolState.literPerDouche} unit="L" onChange={sf('literPerDouche')} min={20} max={100} step={5} />
        </div>
        <SelectField id="dhwSystem" label="Tapwater-systeem" value={toolState.dhwSystem} options={VERWARMING_OPTIES} onChange={sf('dhwSystem')} />
      </div>

      {/* Elektriciteit */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SectionTitle>Elektriciteit & apparaten</SectionTitle>
        <NumField id="basisElektriciteit" label="Basisverbruik" value={toolState.basisElektriciteit} unit="kWh/jaar" onChange={sf('basisElektriciteit')} min={0} max={20000} step={100} />
      </div>

      {/* Optionele systemen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SectionTitle>Optionele systemen</SectionTitle>
        <Toggle id="hasEV" label="Elektrische auto" value={toolState.hasEV} onChange={sf('hasEV')} helpText="Laadt u thuis een EV op?" />
        {toolState.hasEV === 'ja' && (
          <NumField id="evKmPerJaar" label="Kilometers/jaar" value={toolState.evKmPerJaar} unit="km" onChange={sf('evKmPerJaar')} min={0} max={100000} step={1000} />
        )}

        <Toggle id="hasPV" label="Zonnepanelen" value={toolState.hasPV} onChange={sf('hasPV')} helpText="Heeft u PV-panelen (of plant u ze)?" />
        {toolState.hasPV === 'ja' && (
          <div className="grid grid-cols-2 gap-3">
            <NumField id="pvVermogen" label="Vermogen" value={toolState.pvVermogen} unit="kWp" onChange={sf('pvVermogen')} min={0.5} max={50} step={0.5} />
            <NumField id="pvZelfverbruik" label="Zelfverbruik" value={toolState.pvZelfverbruik} unit="%" onChange={sf('pvZelfverbruik')} min={0} max={100} step={5} />
          </div>
        )}

        <Toggle id="hasZwembad" label="Zwembad (verwarmd)" value={toolState.hasZwembad} onChange={sf('hasZwembad')} />
        {toolState.hasZwembad === 'ja' && (
          <div className="grid grid-cols-2 gap-3">
            <NumField id="zwembadOppervlak" label="Oppervlak" value={toolState.zwembadOppervlak} unit="m²" onChange={sf('zwembadOppervlak')} min={1} max={200} step={1} />
            <NumField id="zwembadMaanden" label="Maanden actief" value={toolState.zwembadMaanden} onChange={sf('zwembadMaanden')} min={1} max={12} />
          </div>
        )}

        <Toggle id="hasKoeling" label="Airconditioning" value={toolState.hasKoeling} onChange={sf('hasKoeling')} />
      </div>
    </div>
  );
}
