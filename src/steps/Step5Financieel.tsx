import { useToolState } from '../context/ToolStateContext';
import type { ToolState } from '../context/ToolStateContext';
import { CoachWidget } from '../components/CoachWidget';

function NumField({ id, label, value, unit, onChange, min, max, step, helpText }: {
  id: string; label: string; value: string; unit?: string;
  onChange: (v: string) => void; min?: number; max?: number; step?: number; helpText?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold mb-1 flex items-center">{label}<CoachWidget fieldId={id} /></label>
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
      <label htmlFor={id} className="text-sm font-semibold mb-1 flex items-center">{label}<CoachWidget fieldId={id} /></label>
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 5: Financieel</h2>
        <p className="text-sm text-gray-500">Stookgedrag, energieprijzen en subsidie-parameters.</p>
      </div>

      {/* Stookgedrag */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SectionTitle>Stookgedrag</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="setpoint" label="Temperatuur (aanwezig)" value={toolState.setpoint} unit="°C" onChange={sf('setpoint')} min={15} max={25} step={0.5} />
          <NumField id="awaySetpoint" label="Temperatuur (afwezig)" value={toolState.awaySetpoint} unit="°C" onChange={sf('awaySetpoint')} min={5} max={20} step={0.5} />
          <NumField id="daysPresent" label="Dagen aanwezig" value={toolState.daysPresent} unit="d/jr" onChange={sf('daysPresent')} min={0} max={365} step={5} />
          <NumField id="daysAway" label="Dagen afwezig" value={toolState.daysAway} unit="d/jr" onChange={sf('daysAway')} min={0} max={365} step={5} />
        </div>
      </div>

      {/* Energieprijzen */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SectionTitle>Energieprijzen</SectionTitle>
        <p className="text-xs text-gray-400">Standaardprijzen voor Frankrijk (februari 2026). Pas aan naar uw eigen tarief.</p>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="prijsGas" label="Gas" value={toolState.prijsGas} unit="€/kWh" onChange={sf('prijsGas')} min={0.01} max={1} step={0.01} />
          <NumField id="prijsElektriciteit" label="Elektriciteit" value={toolState.prijsElektriciteit} unit="€/kWh" onChange={sf('prijsElektriciteit')} min={0.01} max={1} step={0.01} />
          <NumField id="prijsStookolie" label="Stookolie" value={toolState.prijsStookolie} unit="€/kWh" onChange={sf('prijsStookolie')} min={0.01} max={1} step={0.01} />
          <NumField id="prijsHout" label="Hout/pellet" value={toolState.prijsHout} unit="€/kWh" onChange={sf('prijsHout')} min={0.01} max={0.5} step={0.01} />
        </div>
        <NumField id="exportTarief" label="PV-exporttarief" value={toolState.exportTarief} unit="€/kWh" onChange={sf('exportTarief')} min={0} max={0.5} step={0.01} helpText="Vergoeding voor teruglevering zonnestroom" />
      </div>

      {/* Subsidie intake */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <SectionTitle>Subsidie-parameters</SectionTitle>
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
