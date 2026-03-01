import { useToolState } from '../context/ToolStateContext';

function Bar({ label, kwh, maxKwh, color }: { label: string; kwh: number; maxKwh: number; color: string }) {
  const pct = Math.min(100, (kwh / Math.max(1, maxKwh)) * 100);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{kwh.toLocaleString('nl-NL')} kWh</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function Energieprofiel() {
  const { result } = useToolState();

  const maxKwh = result.totaalVerbruikKwh;

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-bold text-primary">Energieprofiel</h2>

      {/* Warmteverlies samenvatting */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="font-semibold mb-1">Warmteverlies</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-primary">{result.uaWK}</p>
            <p className="text-xs text-gray-500">Transmissie (W/K)</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{result.hventEffWK}</p>
            <p className="text-xs text-gray-500">Ventilatie (W/K)</p>
          </div>
          <div>
            <p className="text-lg font-bold">{result.hTotaalWK}</p>
            <p className="text-xs text-gray-500">Totaal H (W/K)</p>
          </div>
        </div>
      </div>

      {/* Energiebalken */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Verbruik per categorie (kWh/jaar)</p>
        <Bar label="Verwarming" kwh={result.verwarmingTotaal} maxKwh={maxKwh} color="#800000" />
        <Bar label="Tapwater (DHW)" kwh={result.dhwInput} maxKwh={maxKwh} color="#c05030" />
        <Bar label="Elektriciteit" kwh={result.elektriciteitBasis} maxKwh={maxKwh} color="#2563eb" />
        {result.evKwh > 0 && (
          <Bar label="Elektrische auto" kwh={result.evKwh} maxKwh={maxKwh} color="#059669" />
        )}
        {result.zwembadKwh > 0 && (
          <Bar label="Zwembad" kwh={result.zwembadKwh} maxKwh={maxKwh} color="#0891b2" />
        )}
        {result.koelingKwh > 0 && (
          <Bar label="Koeling" kwh={result.koelingKwh} maxKwh={maxKwh} color="#7c3aed" />
        )}
      </div>

      {/* Totalen */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold">Totaal verbruik</span>
          <span className="text-lg font-bold">{result.totaalVerbruikKwh.toLocaleString('nl-NL')} kWh/jaar</span>
        </div>
        {result.pvProductieKwh > 0 && (
          <>
            <div className="flex justify-between text-sm text-green-700 mt-1">
              <span>PV-productie</span>
              <span className="font-medium">-{result.pvProductieKwh.toLocaleString('nl-NL')} kWh</span>
            </div>
            <div className="flex justify-between text-sm font-semibold mt-1 pt-1 border-t border-gray-200">
              <span>Netto uit net</span>
              <span>{result.netGridKwh.toLocaleString('nl-NL')} kWh</span>
            </div>
          </>
        )}
      </div>

      {/* CO₂ */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
          <span role="img" aria-label="CO2">🌍</span>
        </div>
        <div>
          <p className="text-sm font-semibold">CO₂-uitstoot</p>
          <p className="text-lg font-bold">{result.co2Kg.toLocaleString('nl-NL')} kg/jaar</p>
        </div>
      </div>

      {/* Kosten */}
      <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Jaarlijkse kosten</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Verwarming</span>
            <span className="font-medium">€ {result.kostenVerwarming.toLocaleString('nl-NL')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tapwater</span>
            <span className="font-medium">€ {result.kostenDhw.toLocaleString('nl-NL')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Elektriciteit</span>
            <span className="font-medium">€ {result.kostenElektriciteit.toLocaleString('nl-NL')}</span>
          </div>
          <div className="flex justify-between border-t border-primary/15 pt-1 font-semibold">
            <span>Totaal</span>
            <span>€ {result.kostenTotaal.toLocaleString('nl-NL')}</span>
          </div>
          {result.pvBesparing > 0 && (
            <>
              <div className="flex justify-between text-green-700">
                <span>PV-besparing</span>
                <span className="font-medium">-€ {result.pvBesparing.toLocaleString('nl-NL')}</span>
              </div>
              <div className="flex justify-between font-bold text-primary border-t border-primary/15 pt-1">
                <span>Netto kosten</span>
                <span>€ {result.nettoKosten.toLocaleString('nl-NL')}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
