import { useToolState } from '../context/ToolStateContext';
import { HUIZEN_MATRIX } from '../data/huizen-matrix';
import { CoachWidget } from '../components/CoachWidget';

export function Step2Woningtype() {
  const { toolState, setField, setHuisType } = useToolState();

  const selected = HUIZEN_MATRIX.find((h) => h.id === toolState.huisTypeId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 2: Woningtype</h2>
        <p className="text-sm text-gray-500">Selecteer uw woningtype voor automatische standaardwaarden.</p>
      </div>

      {/* Woningtype kaarten */}
      <div className="grid grid-cols-1 gap-3">
        {HUIZEN_MATRIX.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setHuisType(h.id)}
            className={`text-left w-full border rounded-lg p-3 transition-all ${
              toolState.huisTypeId === h.id
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">{h.naam}</p>
                <p className="text-xs text-gray-500">{h.periode}</p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-3 rounded-sm ${
                      i < h.isolatiescore ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{h.beschrijving}</p>
          </button>
        ))}
      </div>

      {/* Oppervlak & verdiepingen */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="woonoppervlak" className="text-sm font-semibold mb-1 flex items-center">
            Woonoppervlakte <span className="text-red-500 ml-0.5">*</span><CoachWidget fieldId="woonoppervlak" />
          </label>
          <div className="relative">
            <input
              id="woonoppervlak"
              type="number"
              min={10}
              max={2000}
              value={toolState.woonoppervlak}
              onChange={(e) => {
                setField('woonoppervlak', e.target.value);
                // Herbereken oppervlakken bij wijziging
                if (selected) {
                  const opp = Number(e.target.value) || 100;
                  setField('muurOppervlak', String(Math.round(opp * selected.oppervlakteRatios.muurPerM2)));
                  setField('dakOppervlak', String(Math.round(opp * selected.oppervlakteRatios.dakPerM2)));
                  setField('vloerOppervlak', String(Math.round(opp * selected.oppervlakteRatios.vloerPerM2)));
                  setField('raamOppervlak', String(Math.round(opp * selected.oppervlakteRatios.raamPerM2)));
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">m²</span>
          </div>
        </div>
        <div>
          <label htmlFor="verdiepingen" className="text-sm font-semibold mb-1 flex items-center">
            Verdiepingen<CoachWidget fieldId="verdiepingen" />
          </label>
          <select
            id="verdiepingen"
            value={toolState.verdiepingen}
            onChange={(e) => setField('verdiepingen', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={String(n)}>{n} {n === 1 ? 'verdieping' : 'verdiepingen'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Info over geselecteerd type */}
      {selected && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm space-y-3">
          <p className="font-semibold">{selected.naam} — {selected.periode}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
            <span>U-muur:</span><span className="font-medium">{selected.uMuur} W/m²·K</span>
            <span>U-dak:</span><span className="font-medium">{selected.uDak} W/m²·K</span>
            <span>U-vloer:</span><span className="font-medium">{selected.uVloer} W/m²·K</span>
            <span>U-raam:</span><span className="font-medium">{selected.uRaam} W/m²·K</span>
            <span>Luchtwisseling:</span><span className="font-medium">{selected.ach} /uur</span>
            <span>Thermische massa:</span><span className="font-medium">{selected.thermischeMassa}</span>
          </div>
          {selected.waarschuwingen.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
              {selected.waarschuwingen.map((w, i) => (
                <p key={i}>• {w}</p>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 italic">{selected.vochtadvies}</p>
        </div>
      )}
    </div>
  );
}
