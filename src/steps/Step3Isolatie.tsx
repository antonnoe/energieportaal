import { useState } from 'react';
import { useToolState } from '../context/ToolStateContext';
import type { ToolState } from '../context/ToolStateContext';
import { ISOLATIE_MUUR, ISOLATIE_DAK, ISOLATIE_VLOER, ISOLATIE_RAAM } from '../engine/constants';

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

function IsolatieKeuze({ label, niveaus, selected, onSelect, uWaarde, huisTypeId, expertValue, onExpertChange }: {
  label: string;
  niveaus: { id: string; label: string; uWaarde: number | ((ht: string) => number) }[];
  selected: string;
  onSelect: (id: string, u: number) => void;
  uWaarde: string;
  huisTypeId: string;
  expertValue: string;
  onExpertChange: (v: string) => void;
}) {
  const [expertOpen, setExpertOpen] = useState(false);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {niveaus.map((n) => {
          const u = typeof n.uWaarde === 'function' ? n.uWaarde(huisTypeId) : n.uWaarde;
          const isActive = selected === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect(n.id, u)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary/50'
              }`}
            >
              {n.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>&rarr; {uWaarde} W/m²·K</span>
        <button
          type="button"
          onClick={() => setExpertOpen(!expertOpen)}
          className="text-primary underline text-[11px]"
        >
          {expertOpen ? 'Sluiten' : 'Eigen waarde invoeren'}
        </button>
      </div>
      {expertOpen && (
        <input
          type="number" min={0.1} max={6} step={0.1}
          value={expertValue}
          onChange={(e) => onExpertChange(e.target.value)}
          className="w-32 border border-gray-300 rounded px-2 py-1 text-xs"
          placeholder="U-waarde"
        />
      )}
    </div>
  );
}

export function Step3Isolatie() {
  const { toolState, setField } = useToolState();
  const sf = (key: keyof ToolState) => (v: string) => setField(key, v);

  const handleIsolatieSelect = (
    niveauKey: keyof ToolState,
    uKey: keyof ToolState,
    id: string,
    u: number
  ) => {
    setField(niveauKey, id);
    setField(uKey, String(u));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 3: Isolatie</h2>
        <p className="text-sm text-gray-500">Kies het isolatieniveau per bouwdeel. De U-waarden worden automatisch ingevuld op basis van uw woningtype.</p>
      </div>

      {/* U1: Klikbare isolatieniveaus */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-5">
        <h3 className="font-heading text-sm font-bold text-gray-700 uppercase tracking-wide">Isolatieniveau</h3>

        <IsolatieKeuze
          label="Muren"
          niveaus={ISOLATIE_MUUR}
          selected={toolState.isolatieNiveauMuur}
          onSelect={(id, u) => handleIsolatieSelect('isolatieNiveauMuur', 'uMuur', id, u)}
          uWaarde={toolState.uMuur}
          huisTypeId={toolState.huisTypeId}
          expertValue={toolState.uMuur}
          onExpertChange={(v) => { setField('uMuur', v); setField('isolatieNiveauMuur', ''); }}
        />

        <IsolatieKeuze
          label="Dak"
          niveaus={ISOLATIE_DAK}
          selected={toolState.isolatieNiveauDak}
          onSelect={(id, u) => handleIsolatieSelect('isolatieNiveauDak', 'uDak', id, u)}
          uWaarde={toolState.uDak}
          huisTypeId={toolState.huisTypeId}
          expertValue={toolState.uDak}
          onExpertChange={(v) => { setField('uDak', v); setField('isolatieNiveauDak', ''); }}
        />

        <IsolatieKeuze
          label="Vloer"
          niveaus={ISOLATIE_VLOER}
          selected={toolState.isolatieNiveauVloer}
          onSelect={(id, u) => handleIsolatieSelect('isolatieNiveauVloer', 'uVloer', id, u)}
          uWaarde={toolState.uVloer}
          huisTypeId={toolState.huisTypeId}
          expertValue={toolState.uVloer}
          onExpertChange={(v) => { setField('uVloer', v); setField('isolatieNiveauVloer', ''); }}
        />

        <IsolatieKeuze
          label="Ramen"
          niveaus={ISOLATIE_RAAM}
          selected={toolState.isolatieNiveauRaam}
          onSelect={(id, u) => handleIsolatieSelect('isolatieNiveauRaam', 'uRaam', id, u)}
          uWaarde={toolState.uRaam}
          huisTypeId={toolState.huisTypeId}
          expertValue={toolState.uRaam}
          onExpertChange={(v) => { setField('uRaam', v); setField('isolatieNiveauRaam', ''); }}
        />
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
        <h3 className="font-heading text-sm font-bold text-gray-700 uppercase tracking-wide">Luchtdichtheid &amp; ventilatie</h3>
        <div className="grid grid-cols-2 gap-3">
          <NumField id="ach" label="Luchtwisseling (ACH)" value={toolState.ach} unit="/uur" onChange={sf('ach')} min={0.1} max={2} helpText="Oud: 0.8 · Nieuw: 0.3" />
          <NumField id="plafondHoogte" label="Plafondhoogte" value={toolState.plafondHoogte} unit="m" onChange={sf('plafondHoogte')} min={2} max={5} helpText="Standaard 2,5 m" />
        </div>
      </div>
    </div>
  );
}
