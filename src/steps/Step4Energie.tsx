import { useToolState } from '../context/ToolStateContext';
import type { ToolState } from '../context/ToolStateContext';
import { DEFAULT_EFFICIENCY } from '../engine/constants';
import { CoachWidget } from '../components/CoachWidget';

const VERWARMING_KNOPPEN = [
  { value: 'gas', label: 'Gas-ketel', eff: DEFAULT_EFFICIENCY.gas },
  { value: 'elektrisch', label: 'Elektrisch', eff: DEFAULT_EFFICIENCY.elektrisch },
  { value: 'stookolie', label: 'Fioul-ketel', eff: DEFAULT_EFFICIENCY.stookolie },
  { value: 'warmtepomp', label: 'Warmtepomp', eff: DEFAULT_EFFICIENCY.warmtepomp },
  { value: 'hout', label: 'Hout/pellet', eff: DEFAULT_EFFICIENCY.hout },
  { value: 'propaan', label: 'Propaan', eff: DEFAULT_EFFICIENCY.propaan },
];

const DHW_KNOPPEN = [
  { value: '_same', label: 'Zelfde als verwarming' },
  { value: 'elektrisch', label: 'Elektrische boiler' },
  { value: 'warmtepomp', label: 'Warmtepomp-boiler' },
  { value: 'gas', label: 'Gasboiler' },
];

const VERWARMING_OPTIES = [
  { value: 'gas', label: 'Gasketel' },
  { value: 'stookolie', label: 'Stookolie (mazout)' },
  { value: 'warmtepomp', label: 'Warmtepomp' },
  { value: 'elektrisch', label: 'Elektrisch (direct)' },
  { value: 'hout', label: 'Hout / Pellet' },
  { value: 'propaan', label: 'Propaan' },
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

function ButtonGroup({ options, selected, onSelect }: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onSelect(o.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            selected === o.value
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-300 hover:border-primary/50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Step4Energie() {
  const { toolState, setField } = useToolState();
  const sf = (key: keyof ToolState) => (v: string) => setField(key, v);

  const handleVerwarmingSelect = (value: string) => {
    setField('mainHeating', value);
    const knop = VERWARMING_KNOPPEN.find(k => k.value === value);
    if (knop) {
      setField('mainEfficiency', '0'); // Use default efficiency
    }
  };

  const handleDhwSelect = (value: string) => {
    if (value === '_same') {
      setField('dhwSystem', toolState.mainHeating);
      setField('dhwEfficiency', '0');
    } else {
      setField('dhwSystem', value);
      setField('dhwEfficiency', '0');
    }
  };

  const effLabel = (() => {
    const knop = VERWARMING_KNOPPEN.find(k => k.value === toolState.mainHeating);
    if (!knop) return '';
    return toolState.mainHeating === 'warmtepomp'
      ? `SCOP standaard: ${knop.eff}`
      : `Rendement standaard: ${knop.eff}`;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 4: Energie</h2>
        <p className="text-sm text-gray-500">Verwarmingssystemen, tapwater, ventilatie en optionele apparaten.</p>
      </div>

      {/* U1: Verwarming knoppen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-1"><SectionTitle>Hoofdverwarming</SectionTitle><CoachWidget veld="Hoofdverwarming" /></div>
        <ButtonGroup
          options={VERWARMING_KNOPPEN.map(k => ({ value: k.value, label: k.label }))}
          selected={toolState.mainHeating}
          onSelect={handleVerwarmingSelect}
        />
        <p className="text-xs text-gray-400">{effLabel} &mdash; 0 = standaard gebruiken</p>
        <NumField id="mainEfficiency" label="Rendement/SCOP (optioneel)" value={toolState.mainEfficiency} onChange={sf('mainEfficiency')} min={0} max={6} step={0.1} />

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
        <div className="flex items-center gap-1"><SectionTitle>Ventilatie</SectionTitle><CoachWidget veld="WTW" /></div>
        <Toggle id="hasHRV" label="WTW-ventilatie (VMC double flux)" value={toolState.hasHRV} onChange={sf('hasHRV')} helpText="Mechanische ventilatie met warmteterugwinning" />
        {toolState.hasHRV === 'ja' && (
          <NumField id="hrvEfficiency" label="WTW-rendement" value={toolState.hrvEfficiency} unit="%" onChange={sf('hrvEfficiency')} min={50} max={95} step={5} />
        )}
      </div>

      {/* U1: Tapwater knoppen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-1"><SectionTitle>Tapwater</SectionTitle><CoachWidget veld="Tapwater" /></div>
        <ButtonGroup
          options={DHW_KNOPPEN}
          selected={
            toolState.dhwSystem === toolState.mainHeating ? '_same' : toolState.dhwSystem
          }
          onSelect={handleDhwSelect}
        />
        {toolState.dhwSystem === 'hout' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
            <CoachWidget veld="DHW hout" waarschuwing="Warm water via houtverwarming is ongebruikelijk in Frankrijk. Bedoelde u een elektrische boiler of warmtepompboiler? Het kan wel bij een bouilleur/poêle bouilleur." />
            <span className="ml-1">Warm water via hout is ongebruikelijk. Bevestig uw keuze of kies een andere optie.</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <NumField id="personen" label="Personen" value={toolState.personen} onChange={sf('personen')} min={1} max={10} />
          <NumField id="douchesPerDag" label="Douches/dag/pp" value={toolState.douchesPerDag} onChange={sf('douchesPerDag')} min={0} max={3} step={0.5} />
          <NumField id="literPerDouche" label="Liter/douche" value={toolState.literPerDouche} unit="L" onChange={sf('literPerDouche')} min={20} max={100} step={5} />
        </div>
      </div>

      {/* Elektriciteit */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-1"><SectionTitle>Elektriciteit &amp; apparaten</SectionTitle><CoachWidget veld="Basiselektriciteit" /></div>
        <NumField id="basisElektriciteit" label="Basisverbruik" value={toolState.basisElektriciteit} unit="kWh/jaar" onChange={sf('basisElektriciteit')} min={0} max={20000} step={100} />
      </div>

      {/* Optionele systemen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SectionTitle>Optionele systemen</SectionTitle>
        <Toggle id="hasEV" label="Elektrische auto" value={toolState.hasEV} onChange={sf('hasEV')} helpText="Laadt u thuis een EV op?" />
        {toolState.hasEV === 'ja' && (
          <NumField id="evKmPerJaar" label="Kilometers/jaar" value={toolState.evKmPerJaar} unit="km" onChange={sf('evKmPerJaar')} min={0} max={100000} step={1000} />
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
