import { useToolState } from '../context/ToolStateContext';
import { ZONES } from '../engine/constants';
import { HUIZEN_MATRIX, HUISTYPE_CATEGORIEEN } from '../data/huizen-matrix';
import { AIAdviseur } from '../components/AIAdviseur';

// Emoji per categorie
const CATEGORIE_ICON: Record<string, string> = {
  'Historisch steen (vóór 1948)': '🏰',
  'Vakwerk & hout': '🪵',
  'Verbouwd / bijzonder': '🔨',
  'Naoorlogs (1950–2012)': '🏘️',
  'Modern (vanaf 2012)': '🏗️',
  'Appartementen': '🏢',
  'Overig': '⚙️',
};

// Isolatiescore balk — standaard typewaarden, geen aanname over huidige staat
function IsolatieBalk({ score }: { score: number }) {
  const blokjes = [1, 2, 3, 4, 5];
  const colors = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#1abc9c'];
  return (
    <div>
      <p className="text-[10px] text-gray-400 mb-0.5">Standaard isolatiewaarden</p>
      <div className="flex gap-0.5">
        {blokjes.map((b) => (
          <div
            key={b}
            className="h-1.5 flex-1 rounded-sm"
            style={{ backgroundColor: b <= score ? colors[score - 1] : '#e5e7eb' }}
          />
        ))}
      </div>
    </div>
  );
}

export function Step1Locatie() {
  const { toolState, setPostcode, setField, setHuisType } = useToolState();

  const zone = ZONES.find((z) => z.id === toolState.zoneId);
  const hasPostcode = toolState.postcode.length === 5 && !!zone;
  const selected = HUIZEN_MATRIX.find((h) => h.id === toolState.huisTypeId);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 1: Locatie & Woning</h2>
        <p className="text-sm text-gray-500">Postcode + woningtype bepalen uw klimaatzone en standaardwaarden.</p>
      </div>

      {/* Postcode */}
      <div>
        <label htmlFor="postcode" className="flex items-center text-sm font-semibold mb-1">
          Postcode <span className="text-red-500">*</span>
          <AIAdviseur veld="Postcode" waarde={toolState.postcode} />
        </label>
        <input
          id="postcode"
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="bv. 34000"
          value={toolState.postcode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 5);
            setPostcode(val);
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Zone bevestiging */}
      {hasPostcode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-1">
          <p className="font-semibold text-green-800">
            Zone: {zone.name} ({zone.hdd} graaddagen)
          </p>
          <p className="text-green-700 text-xs">
            Département {toolState.departement} &middot; PV-opbrengst {zone.pv} kWh/kWp/jaar
          </p>
        </div>
      )}

      {/* Woningtype tegels — pas tonen na geldige postcode */}
      {hasPostcode && (
        <>
          <div>
            <div className="flex items-center text-sm font-semibold mb-2">
              Woningtype <span className="text-red-500 ml-0.5">*</span>
              <AIAdviseur veld="Woningtype" waarde={toolState.huisTypeId} />
            </div>

            <div className="space-y-3">
              {HUISTYPE_CATEGORIEEN.map((cat) => {
                const types = HUIZEN_MATRIX.filter((h) => h.categorie === cat);
                return (
                  <div key={cat}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      {CATEGORIE_ICON[cat] ?? '🏠'} {cat}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {types.map((h) => {
                        const isSelected = toolState.huisTypeId === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => setHuisType(h.id)}
                            className={`text-left rounded-lg border p-2.5 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <p className={`text-xs font-semibold leading-tight mb-0.5 ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                              {h.naam}
                            </p>
                            <p className="text-[10px] text-gray-400 mb-1.5">{h.periode}</p>
                            <p className="text-[10px] text-gray-500 leading-snug mb-2 line-clamp-2">
                              {h.beschrijving}
                            </p>
                            <IsolatieBalk score={h.isolatiescore} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verwarmtip bij grote panden */}
          {selected?.verwarmtip && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">Let op: gedeeltelijke bewoning</p>
              <p>{selected.verwarmtip}</p>
            </div>
          )}

          {/* Oppervlak, verdiepingen, plafondhoogte */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="woonoppervlak" className="flex items-center text-sm font-semibold mb-1">
                {selected?.verwarmtip ? 'Verwarmd m²' : 'Oppervlak'} <span className="text-red-500">*</span>
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
            </div>
            <div>
              <label htmlFor="verdiepingen" className="text-sm font-semibold mb-1 block">Verdiepingen</label>
              <select
                id="verdiepingen"
                value={toolState.verdiepingen}
                onChange={(e) => setField('verdiepingen', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="plafondHoogte" className="text-sm font-semibold mb-1 block">Plafond</label>
              <div className="relative">
                <input
                  id="plafondHoogte"
                  type="number"
                  min={2.0}
                  max={6.0}
                  step={0.1}
                  value={toolState.plafondHoogte}
                  onChange={(e) => setField('plafondHoogte', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-8 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">m</span>
              </div>
            </div>
          </div>

          {/* Compact type info */}
          {selected && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Kenmerken {selected.naam}</summary>
              <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600 text-xs">
                  <span>U-muur:</span><span className="font-medium">{selected.uMuur} W/m²·K</span>
                  <span>U-dak:</span><span className="font-medium">{selected.uDak} W/m²·K</span>
                  <span>U-vloer:</span><span className="font-medium">{selected.uVloer} W/m²·K</span>
                  <span>U-raam:</span><span className="font-medium">{selected.uRaam} W/m²·K</span>
                  <span>ACH:</span><span className="font-medium">{selected.ach} /uur</span>
                </div>
                {selected.waarschuwingen.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
                    {selected.waarschuwingen.map((w: string, i: number) => (
                      <p key={i}>• {w}</p>
                    ))}
                  </div>
                )}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
