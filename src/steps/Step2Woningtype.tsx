import { useToolState } from '../context/ToolStateContext';
import { HUIZEN_MATRIX, HUISTYPE_CATEGORIEEN } from '../data/huizen-matrix';
import { AIAdviseur } from '../components/AIAdviseur';

export function Step2Woningtype() {
  const { toolState, setField, setHuisType } = useToolState();

  const selected = HUIZEN_MATRIX.find((h) => h.id === toolState.huisTypeId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 2: Woningtype</h2>
        <p className="text-sm text-gray-500">Selecteer uw woningtype voor automatische standaardwaarden.</p>
      </div>

      {/* Woningtype dropdown met optgroups */}
      <div>
        <label htmlFor="huistype" className="flex items-center text-sm font-semibold mb-1">
          Woningtype <span className="text-red-500">*</span>
          <AIAdviseur veld="Woningtype" waarde={toolState.huisTypeId} />
        </label>
        <select
          id="huistype"
          value={toolState.huisTypeId}
          onChange={(e) => setHuisType(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          {HUISTYPE_CATEGORIEEN.map((cat) => (
            <optgroup key={cat} label={cat}>
              {HUIZEN_MATRIX.filter((h) => h.categorie === cat).map((h) => (
                <option key={h.id} value={h.id}>
                  {h.naam} ({h.periode})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Verwarmtip bij grote panden */}
      {selected?.verwarmtip && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <p className="font-semibold mb-1">Let op: gedeeltelijke bewoning</p>
          <p>{selected.verwarmtip}</p>
        </div>
      )}

      {/* Oppervlak & verdiepingen */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="woonoppervlak" className="flex items-center text-sm font-semibold mb-1">
            {selected?.verwarmtip ? 'Verwarmd woonoppervlak' : 'Woonoppervlakte'} <span className="text-red-500">*</span>
            <AIAdviseur veld="Woonoppervlakte" waarde={toolState.woonoppervlak} />
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
          {Number(toolState.woonoppervlak) > 0 && Number(toolState.woonoppervlak) < 20 && (
            <p className="text-xs text-red-600 mt-1">Minimaal 20 m² voor een betrouwbare berekening</p>
          )}
          {Number(toolState.woonoppervlak) > 1000 && (
            <p className="text-xs text-red-600 mt-1">Maximaal 1000 m² voor een betrouwbare berekening</p>
          )}
        </div>
        <div>
          <label htmlFor="verdiepingen" className="flex items-center text-sm font-semibold mb-1">
            Verdiepingen
            <AIAdviseur veld="Verdiepingen" waarde={toolState.verdiepingen} />
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

      {/* Plafond hoogte — altijd tonen, extra uitleg bij hoge plafonds */}
      <div>
        <label htmlFor="plafondHoogte" className="flex items-center text-sm font-semibold mb-1">
          Plafondhoogte
          <AIAdviseur veld="Plafondhoogte" waarde={toolState.plafondHoogte} />
        </label>
        <div className="relative">
          <input
            id="plafondHoogte"
            type="number"
            min={2.0}
            max={6.0}
            step={0.1}
            value={toolState.plafondHoogte}
            onChange={(e) => setField('plafondHoogte', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">m</span>
        </div>
        {Number(toolState.plafondHoogte) >= 3.0 && (
          <p className="text-xs text-amber-700 mt-1">Hoge plafonds verhogen het te verwarmen volume aanzienlijk. Dit is meegenomen in de berekening.</p>
        )}
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
