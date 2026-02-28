import { useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { calculateExpert, expertInputFromState, KLIMAATZONES } from '../engine/expert/heatLoss';

const DPE_COLORS: Record<string, string> = {
  A: '#009900',
  B: '#33cc00',
  C: '#99cc00',
  D: '#ffcc00',
  E: '#ff9900',
  F: '#ff6600',
  G: '#ff0000',
};

export function ExpertResultWidget() {
  const { toolState } = useToolState();

  const result = useMemo(() => {
    const input = expertInputFromState(toolState as unknown as Record<string, string>);
    return calculateExpert(input);
  }, [toolState]);

  const zone = KLIMAATZONES[toolState.klimaatzone] ?? KLIMAATZONES['H1b'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      <h3 className="font-heading font-semibold text-sm text-gray-500 uppercase tracking-wide">
        Expert berekening — {zone.label}
      </h3>

      {/* DPE + UA */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold font-heading shadow-md shrink-0"
          style={{ backgroundColor: DPE_COLORS[result.dpeLabel] ?? '#888' }}
          title="Geschatte DPE label"
        >
          {result.dpeLabel}
        </div>
        <div>
          <p className="text-xs text-gray-500">Geschatte DPE — {result.kwhPerM2} kWh/m²</p>
          <p className="text-xs text-gray-400">
            UA = {result.uaWK} W/K · Q<sub>vent</sub> = {result.qventWK} W/K
          </p>
        </div>
      </div>

      {/* Energy breakdown */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">Jaarlijks energieverbruik</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniCard icon="🔥" label="Verwarming" value={result.verwarmingKwh.toLocaleString('nl')} unit="kWh" />
          <MiniCard icon="🚿" label="Warm water" value={result.dhwKwh.toLocaleString('nl')} unit="kWh" />
          <MiniCard icon="💡" label="Elektriciteit" value={result.elektriciteitKwh.toLocaleString('nl')} unit="kWh" />
          {result.evKwh > 0 && (
            <MiniCard icon="🚗" label="EV laden" value={result.evKwh.toLocaleString('nl')} unit="kWh" />
          )}
        </div>
      </div>

      {/* PV */}
      {result.pvProductieKwh > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Zonne-energie</p>
          <div className="grid grid-cols-3 gap-2">
            <MiniCard icon="☀️" label="Productie" value={result.pvProductieKwh.toLocaleString('nl')} unit="kWh" highlight />
            <MiniCard icon="🏠" label="Zelfverbruik" value={result.pvZelfverbruikKwh.toLocaleString('nl')} unit="kWh" highlight />
            <MiniCard icon="🔌" label="Export" value={result.pvExportKwh.toLocaleString('nl')} unit="kWh" highlight />
          </div>
        </div>
      )}

      {/* Cost + CO₂ */}
      <div className="grid grid-cols-3 gap-2">
        <MiniCard icon="💶" label="Bruto kosten" value={`€ ${result.kostenEur.toLocaleString('nl')}`} unit="/jaar" />
        {result.pvBesparing > 0 && (
          <MiniCard icon="💚" label="PV besparing" value={`€ ${result.pvBesparing.toLocaleString('nl')}`} unit="/jaar" highlight />
        )}
        <MiniCard icon="🌿" label="CO₂" value={result.co2Kg.toLocaleString('nl')} unit="kg/jaar" />
      </div>

      {result.pvBesparing > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
          💚 <strong>Netto energiekosten: € {result.netKostenEur.toLocaleString('nl')} / jaar</strong>{' '}
          (na PV besparing)
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Indicatief · geen officiële DPE · vind professional via{' '}
        <a
          href="https://france-renov.gouv.fr/espaces-conseil-fr/recherche"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          France Rénov
        </a>
      </p>
    </div>
  );
}

function MiniCard({
  icon,
  label,
  value,
  unit,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg p-2 text-center ${highlight ? 'bg-green-50' : 'bg-gray-50'}`}>
      <div className="text-lg">{icon}</div>
      <div className="font-heading font-bold text-xs text-gray-800 truncate">{value}</div>
      <div className="text-xs text-gray-500">{unit}</div>
      <div className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</div>
    </div>
  );
}
