import { useToolState } from '../context/ToolStateContext';
import { CoachPanel } from '../components/CoachPanel';
import { ExpertResultWidget } from '../components/ExpertResultWidget';
import { KLIMAATZONES } from '../engine/expert/heatLoss';

// ─── Option lists ─────────────────────────────────────────────────────────────

const ISOLATIE_OPTIONS = [
  { value: 'geen', label: 'Geen isolatie' },
  { value: 'matig', label: 'Matig (< 8 cm muur / < 12 cm dak)' },
  { value: 'goed', label: 'Goed (8–14 cm muur / 12–20 cm dak)' },
  { value: 'uitstekend', label: 'Uitstekend (> 14 cm muur / > 20 cm dak)' },
];

const RAAM_OPTIONS = [
  { value: 'enkel', label: 'Enkel glas (U ≈ 5,8 W/m²K)' },
  { value: 'dubbel', label: 'Dubbel glas (U ≈ 2,8 W/m²K)' },
  { value: 'hr', label: 'HR++ / Triple glas (U ≈ 1,1 W/m²K)' },
];

const VENTILATIE_OPTIONS = [
  { value: 'naturel', label: 'Natuurlijk (ramen/ventilatieopeningen)' },
  { value: 'mécanique', label: 'Mechanische ventilatie (VMC)' },
  { value: 'hrv', label: 'WTW / HRV (warmteterugwinning)' },
];

const VERWARMING_OPTIONS = [
  { value: 'gas', label: 'Gasketel' },
  { value: 'stookolie', label: 'Stookolie' },
  { value: 'warmtepomp', label: 'Warmtepomp' },
  { value: 'elektrisch', label: 'Elektrisch (direct)' },
  { value: 'hout', label: 'Hout / Pellet' },
];

const KLIMAAT_OPTIONS = Object.entries(KLIMAATZONES).map(([k, v]) => ({
  value: k,
  label: v.label,
}));

// ─── Reusable field components ────────────────────────────────────────────────

function SelectField({
  id, label, value, options, helpText, onChange,
}: {
  id: string; label: string; value: string;
  options: { value: string; label: string }[];
  helpText?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {helpText && <p className="text-xs text-gray-400 mb-1">{helpText}</p>}
      <select
        id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  id, label, value, unit, min, max, step, helpText, placeholder, onChange,
}: {
  id: string; label: string; value: string; unit?: string;
  min?: number; max?: number; step?: number; helpText?: string; placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{unit && <span className="text-gray-400 ml-1">({unit})</span>}
      </label>
      {helpText && <p className="text-xs text-gray-400 mb-1">{helpText}</p>}
      <input
        id={id} type="number" value={value} min={min} max={max} step={step ?? 1}
        placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
      />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="font-heading font-semibold text-sm text-gray-700 border-b border-gray-100 pb-1">
      {title}
    </h3>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function Expertmodus() {
  const { toolState, setField } = useToolState();
  const sf = (k: keyof typeof toolState) => (v: string) => setField(k, v);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold" style={{ color: '#800000' }}>
          🔬 Expertmodus
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gedetailleerde woningmodellering — warmteverlies, systemen en hernieuwbare energie.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
        <strong>Tip:</strong> Vul eerst de basisgegevens in via "Snel advies". De expertmodus
        berekent warmteverlies (UA), verwarmingsvraag, kosten en CO₂ op basis van uw specifieke
        woning.
      </div>

      <ExpertResultWidget />

      {/* KLIMAAT & BASIS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <SectionHeader title="🌡️ Klimaat & Basis" />
        <SelectField
          id="klimaatzone" label="Klimaatzone" value={toolState.klimaatzone}
          options={KLIMAAT_OPTIONS}
          helpText="Franse klimaatzonering — bepaalt stookgraaddagen (HDD) en PV-opbrengst."
          onChange={sf('klimaatzone')}
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="oppervlakte" label="Woonoppervlakte" value={toolState.oppervlakte}
            unit="m²" min={10} max={1000} onChange={sf('oppervlakte')} />
          <NumberField id="stookgrens" label="Stookgrens" value={toolState.stookgrens}
            unit="°C" min={14} max={22} helpText="Binnentemp. (standaard 18 °C)"
            onChange={sf('stookgrens')} />
        </div>
      </div>

      {/* GEBOUWSCHIL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <SectionHeader title="🏠 Gebouwschil (envelop)" />
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="muurOppervlak" label="Muuroppervlak" value={toolState.muurOppervlak}
            unit="m²" min={0} placeholder={`ca. ${Math.round(Number(toolState.oppervlakte || 100) * 1.2)}`}
            helpText="Totaal buitenmuuroppervlak" onChange={sf('muurOppervlak')} />
          <SelectField id="muurIsolatie" label="Muurisolatie" value={toolState.muurIsolatie}
            options={ISOLATIE_OPTIONS} onChange={sf('muurIsolatie')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="dakOppervlak" label="Dakoppervlak" value={toolState.dakOppervlak}
            unit="m²" min={0} placeholder={`ca. ${Math.round(Number(toolState.oppervlakte || 100) * 0.8)}`}
            onChange={sf('dakOppervlak')} />
          <SelectField id="dakIsolatie" label="Dakisolatie" value={toolState.dakIsolatie}
            options={ISOLATIE_OPTIONS} onChange={sf('dakIsolatie')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="vloerOppervlak" label="Vloeroppervlak" value={toolState.vloerOppervlak}
            unit="m²" min={0} placeholder={`ca. ${Math.round(Number(toolState.oppervlakte || 100) * 0.8)}`}
            onChange={sf('vloerOppervlak')} />
          <SelectField id="vloerIsolatie" label="Vloerisolatie" value={toolState.vloerIsolatie}
            options={ISOLATIE_OPTIONS} onChange={sf('vloerIsolatie')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="raamOppervlak" label="Raamoppervlak" value={toolState.raamOppervlak}
            unit="m²" min={0} placeholder={`ca. ${Math.round(Number(toolState.oppervlakte || 100) * 0.15)}`}
            onChange={sf('raamOppervlak')} />
          <SelectField id="raamType" label="Raamtype" value={toolState.raamType}
            options={RAAM_OPTIONS} onChange={sf('raamType')} />
        </div>
      </div>

      {/* VENTILATIE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <SectionHeader title="💨 Ventilatie" />
        <SelectField id="ventilatieType" label="Ventilatiesysteem" value={toolState.ventilatieType}
          options={VENTILATIE_OPTIONS} onChange={sf('ventilatieType')} />
        {toolState.ventilatieType === 'hrv' && (
          <NumberField id="hrvEfficientie" label="WTW rendement" value={toolState.hrvEfficientie}
            unit="%" min={0} max={95} helpText="Typisch 70–90 % voor een moderne WTW-unit"
            onChange={sf('hrvEfficientie')} />
        )}
      </div>

      {/* VERWARMINGSSYSTEEM */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <SectionHeader title="🔥 Verwarmingssysteem" />
        <SelectField id="verwarming" label="Verwarmingssysteem" value={toolState.verwarming}
          options={VERWARMING_OPTIONS} onChange={sf('verwarming')} />
        <NumberField id="verwarmingScop" label="SCOP / Rendement (optioneel)"
          value={toolState.verwarmingScop} min={0} max={6} step={0.1}
          helpText="Laat 0 voor standaardwaarde. Warmtepomp typisch 3,0–4,5."
          onChange={sf('verwarmingScop')} />
        <NumberField id="dhwPersonen" label="Aantal bewoners (voor warm water)"
          value={toolState.dhwPersonen} unit="personen" min={1} max={10}
          onChange={sf('dhwPersonen')} />
      </div>

      {/* ELEKTRICITEIT */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <SectionHeader title="⚡ Elektriciteit" />
        <NumberField id="basisElektriciteit" label="Basisverbruik elektriciteit"
          value={toolState.basisElektriciteit} unit="kWh/j" min={500} max={15000}
          helpText="Exclusief verwarming & warm water — gemiddeld huishouden ≈ 2.500 kWh/j"
          onChange={sf('basisElektriciteit')} />
        <SelectField id="heeftEV" label="Elektrisch voertuig (EV)?" value={toolState.heeftEV}
          options={[{ value: 'nee', label: 'Nee' }, { value: 'ja', label: 'Ja' }]}
          onChange={sf('heeftEV')} />
        {toolState.heeftEV === 'ja' && (
          <NumberField id="evKmPerJaar" label="Jaarlijks gereden km (EV)"
            value={toolState.evKmPerJaar} unit="km/j" min={0} max={100000}
            helpText="Verbruik ≈ 0,20 kWh/km" onChange={sf('evKmPerJaar')} />
        )}
      </div>

      {/* ZONNE-ENERGIE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <SectionHeader title="☀️ Zonne-energie (PV)" />
        <SelectField id="heeftPV" label="Zonnepanelen aanwezig of gepland?" value={toolState.heeftPV}
          options={[{ value: 'nee', label: 'Nee' }, { value: 'ja', label: 'Ja' }]}
          onChange={sf('heeftPV')} />
        {toolState.heeftPV === 'ja' && (
          <>
            <NumberField id="pvVermogen" label="PV-vermogen" value={toolState.pvVermogen}
              unit="kWp" min={0} max={100} step={0.5} onChange={sf('pvVermogen')} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="pvZelfverbruik" label="Zelfverbruik" value={toolState.pvZelfverbruik}
                unit="%" min={0} max={100} helpText="Typisch 20–40 %" onChange={sf('pvZelfverbruik')} />
              <NumberField id="exportTarief" label="Teruglevertarief" value={toolState.exportTarief}
                unit="€/kWh" min={0} max={0.5} step={0.01}
                helpText="Typisch 0,06–0,10 €/kWh" onChange={sf('exportTarief')} />
            </div>
          </>
        )}
      </div>

      <CoachPanel errors={[]} />
    </div>
  );
}
