import { useToolState } from '../context/ToolStateContext';
import type { ToolState } from '../context/ToolStateContext';
import { AIAdviseur } from '../components/AIAdviseur';

const PV_PRESETS = [
  { id: 'geen', label: 'Geen', kwp: 0 },
  { id: 'klein', label: 'Klein (3 kWp)', kwp: 3 },
  { id: 'middel', label: 'Middel (6 kWp)', kwp: 6 },
  { id: 'groot', label: 'Groot (9 kWp)', kwp: 9 },
  { id: 'eigen', label: 'Eigen waarde', kwp: -1 },
];

function NumField({ id, label, value, unit, onChange, min, max, step, helpText }: {
  id: string; label: string; value: string; unit?: string;
  onChange: (v: string) => void; min?: number; max?: number; step?: number; helpText?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1">{label}</label>
      <div className="relative">
        <input
          id={id} type="number" min={min} max={max} step={step ?? 0.01}
          value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>}
      </div>
      {helpText && <p className="text-xs text-gray-400 mt-0.5">{helpText}</p>}
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-heading text-sm font-bold text-gray-700 uppercase tracking-wide">{children}</h3>;
}

export function Step5Financieel() {
  const { toolState, setField } = useToolState();
  const sf = (key: keyof ToolState) => (v: string) => setField(key, v);

  const handlePvPreset = (id: string) => {
    const preset = PV_PRESETS.find(p => p.id === id);
    if (!preset) return;
    setField('pvPreset', id);
    if (preset.kwp === 0) {
      setField('hasPV', 'nee');
      setField('pvVermogen', '0');
    } else if (preset.kwp > 0) {
      setField('hasPV', 'ja');
      setField('pvVermogen', String(preset.kwp));
    } else {
      // eigen waarde — maak PV aan maar laat vermogen staan
      setField('hasPV', 'ja');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 5: Financieel</h2>
        <p className="text-sm text-gray-500">Stookgedrag, zonnepanelen, energieprijzen en subsidie-parameters.</p>
      </div>

      {/* Stookgedrag */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-1"><SectionTitle>Stookgedrag</SectionTitle><AIAdviseur veld="Temperatuur" /></div>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="setpoint" label="Temperatuur (aanwezig)" value={toolState.setpoint} unit="°C" onChange={sf('setpoint')} min={15} max={25} step={0.5} />
          <NumField id="awaySetpoint" label="Temperatuur (afwezig)" value={toolState.awaySetpoint} unit="°C" onChange={sf('awaySetpoint')} min={5} max={20} step={0.5} />
          <NumField id="daysPresent" label="Dagen aanwezig" value={toolState.daysPresent} unit="d/jr"
            onChange={(v) => {
              const present = Math.min(365, Math.max(0, Number(v) || 0));
              setField('daysPresent', String(present));
              // Auto-corrigeer afwezig als totaal > 365
              const away = Number(toolState.daysAway) || 0;
              if (present + away > 365) {
                setField('daysAway', String(365 - present));
              }
            }}
            min={0} max={365} step={5} />
          <NumField id="daysAway" label="Dagen afwezig" value={toolState.daysAway} unit="d/jr"
            onChange={(v) => {
              const away = Math.min(365, Math.max(0, Number(v) || 0));
              setField('daysAway', String(away));
              // Auto-corrigeer aanwezig als totaal > 365
              const present = Number(toolState.daysPresent) || 0;
              if (present + away > 365) {
                setField('daysPresent', String(365 - away));
              }
            }}
            min={0} max={365} step={5} />
        </div>
        {(() => {
          const totaal = Number(toolState.daysPresent) + Number(toolState.daysAway);
          if (totaal > 365) {
            return <p className="text-xs text-red-600">Dagen aanwezig + afwezig mogen niet meer dan 365 zijn ({totaal} dagen ingevuld)</p>;
          }
          if (totaal < 365) {
            const leegstand = 365 - totaal;
            const pct = Math.round((leegstand / 365) * 100);
            return <p className="text-xs text-amber-700">Leegstand: {leegstand} dagen/jaar ({pct}%) — geen verwarming gedurende leegstand</p>;
          }
          return null;
        })()}
      </div>

      {/* U1: Zonnepanelen knoppen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-1"><SectionTitle>Zonnepanelen</SectionTitle><AIAdviseur veld="Zonnepanelen" /></div>
        <div className="flex flex-wrap gap-1.5">
          {PV_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePvPreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                toolState.pvPreset === p.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {toolState.hasPV === 'ja' && (
          <div className="grid grid-cols-2 gap-3">
            {toolState.pvPreset === 'eigen' && (
              <NumField id="pvVermogen" label="Vermogen" value={toolState.pvVermogen} unit="kWp" onChange={sf('pvVermogen')} min={0.5} max={50} step={0.5} />
            )}
            <NumField id="pvZelfverbruik" label="Zelfverbruik" value={toolState.pvZelfverbruik} unit="%" onChange={sf('pvZelfverbruik')} min={0} max={100} step={5} />
          </div>
        )}
      </div>

      {/* Energieprijzen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-1"><SectionTitle>Energieprijzen</SectionTitle><AIAdviseur veld="Elektriciteit" /></div>
        <p className="text-xs text-gray-400">Standaardprijzen februari 2026. Pas aan naar uw eigen tarief.</p>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="prijsElektriciteit" label="Elektriciteit" value={toolState.prijsElektriciteit} unit="€/kWh" onChange={sf('prijsElektriciteit')} min={0.01} max={1} step={0.001} helpText="TRV Base 6kVA TTC" />
          <NumField id="prijsGas" label="Gas" value={toolState.prijsGas} unit="€/kWh" onChange={sf('prijsGas')} min={0.01} max={1} step={0.001} helpText="CRE Prix Repère" />
          <NumField id="prijsStookolie" label="Fioul (stookolie)" value={toolState.prijsStookolie} unit="€/kWh" onChange={sf('prijsStookolie')} min={0.01} max={1} step={0.001} helpText="DGEC gemiddelde" />
          <NumField id="prijsHout" label="Hout/pellet" value={toolState.prijsHout} unit="€/kWh" onChange={sf('prijsHout')} min={0.01} max={0.5} step={0.001} helpText="85 €/stère ÷ 1800 kWh" />
          <NumField id="prijsPropaan" label="Propaan" value={toolState.prijsPropaan} unit="€/kWh" onChange={sf('prijsPropaan')} min={0.01} max={1} step={0.001} helpText="1,90 €/L ÷ 7,1 kWh" />
          <NumField id="exportTarief" label="PV-export" value={toolState.exportTarief} unit="€/kWh" onChange={sf('exportTarief')} min={0} max={0.5} step={0.001} helpText="S21 surplus ≤9 kWc" />
        </div>
      </div>

      {/* Subsidie intake */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-1"><SectionTitle>Subsidie-parameters</SectionTitle><AIAdviseur veld="Subsidie" /></div>
        <p className="text-xs text-gray-400">Deze gegevens bepalen voor welke subsidies u in aanmerking komt.</p>
        <div className="grid grid-cols-2 gap-3">
          <SelectField id="subsidieUsage" label="Gebruik woning" value={toolState.subsidieUsage} onChange={sf('subsidieUsage')} options={[
            { value: 'rp', label: 'Hoofdverblijfplaats' },
            { value: 'secondaire', label: 'Tweede woning' },
            { value: 'verhuur', label: 'Verhuur' },
            { value: 'onbekend', label: 'Weet ik niet' },
          ]} />
          <SelectField id="subsidieAgeGt2" label="Woning ouder dan 2 jaar?" value={toolState.subsidieAgeGt2} onChange={sf('subsidieAgeGt2')} options={[
            { value: 'ja', label: 'Ja' },
            { value: 'nee', label: 'Nee' },
            { value: 'onbekend', label: 'Weet ik niet' },
          ]} />
          <SelectField id="subsidieStage" label="Fase van het project" value={toolState.subsidieStage} onChange={sf('subsidieStage')} options={[
            { value: 'voor', label: 'Nog niet begonnen' },
            { value: 'offertes', label: 'Offertes aanvragen' },
            { value: 'getekend', label: 'Contract getekend' },
            { value: 'gestart', label: 'Werken gestart' },
          ]} />
          <SelectField id="subsidieWorkType" label="Type werkzaamheden" value={toolState.subsidieWorkType} onChange={sf('subsidieWorkType')} options={[
            { value: 'envelop', label: 'Isolatie (envelop)' },
            { value: 'ventilatie', label: 'Ventilatie' },
            { value: 'verwarming', label: 'Verwarming' },
            { value: 'combo', label: 'Combinatie van werken' },
            { value: 'onbekend', label: 'Weet ik nog niet' },
          ]} />
        </div>
        <SelectField id="subsidieMprPath" label="MPR-traject voorkeur" value={toolState.subsidieMprPath} onChange={sf('subsidieMprPath')} options={[
          { value: 'geste', label: 'Geste (enkele actie)' },
          { value: 'ampleur', label: 'Ampleur (ingrijpende renovatie)' },
          { value: 'onbekend', label: 'Weet ik nog niet' },
        ]} />
        <SelectField id="subsidieHeatlossDone" label="Warmteverliesberekening gedaan?" value={toolState.subsidieHeatlossDone} onChange={sf('subsidieHeatlossDone')} options={[
          { value: 'ja', label: 'Ja' },
          { value: 'nee', label: 'Nee' },
        ]} />
      </div>
    </div>
  );
}
