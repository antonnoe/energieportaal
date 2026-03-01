import { useToolState } from '../context/ToolStateContext';

function NumField({ id, label, value, unit, onChange, min, max, step, helpText }: {
  id: string; label: string; value: string; unit?: string;
  onChange: (v: string) => void; min?: number; max?: number; step?: number; helpText?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1">{label}</label>
      <div className="relative">
        <input
          id={id} type="number" min={min} max={max} step={step ?? 0.1}
          value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>}
      </div>
      {helpText && <p className="text-xs text-gray-400 mt-0.5">{helpText}</p>}
    </div>
  );
}

export function Step3Isolatie() {
  const { toolState, setField } = useToolState();
  const sf = (key: keyof typeof toolState) => (v: string) => setField(key, v);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 3: Verfijning</h2>
        <p className="text-sm text-gray-500">Pas de U-waarden en oppervlakken aan als u ze kent. Anders blijven de standaardwaarden van uw woningtype staan.</p>
      </div>

      {/* U-waarden */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-heading text-sm font-bold text-gray-700 uppercase tracking-wide">U-waarden (W/m²·K)</h3>
        <p className="text-xs text-gray-400">Hoe lager de U-waarde, hoe beter geïsoleerd. Standaardwaarden zijn ingevuld op basis van uw woningtype.</p>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="uMuur" label="Muren" value={toolState.uMuur} unit="W/m²·K" onChange={sf('uMuur')} min={0.1} max={5} helpText="Slecht: 2.5 · Goed: 0.3" />
          <NumField id="uDak" label="Dak" value={toolState.uDak} unit="W/m²·K" onChange={sf('uDak')} min={0.1} max={5} helpText="Slecht: 3.5 · Goed: 0.2" />
          <NumField id="uVloer" label="Vloer" value={toolState.uVloer} unit="W/m²·K" onChange={sf('uVloer')} min={0.1} max={3} helpText="Slecht: 1.5 · Goed: 0.2" />
          <NumField id="uRaam" label="Ramen" value={toolState.uRaam} unit="W/m²·K" onChange={sf('uRaam')} min={0.5} max={6} helpText="Enkel: 5.8 · HR++: 1.2" />
        </div>
      </div>

      {/* Oppervlakken */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-heading text-sm font-bold text-gray-700 uppercase tracking-wide">Oppervlakken (m²)</h3>
        <p className="text-xs text-gray-400">Geschat op basis van uw woonoppervlak en woningtype. Pas aan als u de exacte waarden kent.</p>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="muurOppervlak" label="Buitenmuren" value={toolState.muurOppervlak} unit="m²" onChange={sf('muurOppervlak')} min={0} max={2000} step={1} />
          <NumField id="dakOppervlak" label="Dak" value={toolState.dakOppervlak} unit="m²" onChange={sf('dakOppervlak')} min={0} max={2000} step={1} />
          <NumField id="vloerOppervlak" label="Vloer" value={toolState.vloerOppervlak} unit="m²" onChange={sf('vloerOppervlak')} min={0} max={2000} step={1} />
          <NumField id="raamOppervlak" label="Ramen" value={toolState.raamOppervlak} unit="m²" onChange={sf('raamOppervlak')} min={0} max={500} step={1} />
        </div>
      </div>

      {/* Ventilatie */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-heading text-sm font-bold text-gray-700 uppercase tracking-wide">Luchtdichtheid & ventilatie</h3>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="ach" label="Luchtwisseling (ACH)" value={toolState.ach} unit="/uur" onChange={sf('ach')} min={0.1} max={2} helpText="Oud: 0.8 · Nieuw: 0.3" />
          <NumField id="plafondHoogte" label="Plafondhoogte" value={toolState.plafondHoogte} unit="m" onChange={sf('plafondHoogte')} min={2} max={5} helpText="Standaard 2,5 m" />
        </div>
      </div>
    </div>
  );
}
