import { useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { calculate } from '../engine/calculations';

const DPE_COLORS: Record<string, string> = {
  A: '#009900',
  B: '#33cc00',
  C: '#99cc00',
  D: '#ffcc00',
  E: '#ff9900',
  F: '#ff6600',
  G: '#ff0000',
};

export function ResultWidget() {
  const { toolState } = useToolState();

  const result = useMemo(
    () =>
      calculate({
        oppervlakte: toolState.oppervlakte,
        isolatie: toolState.isolatie,
        verwarming: toolState.verwarming,
      }),
    [toolState.oppervlakte, toolState.isolatie, toolState.verwarming]
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="font-heading font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">
        Live resultaat
      </h3>

      <div className="flex items-center gap-4 mb-4">
        {/* DPE Badge */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold font-heading shadow-md shrink-0"
          style={{ backgroundColor: DPE_COLORS[result.dpeLabel] ?? '#888' }}
          title="Geschatte DPE label"
        >
          {result.dpeLabel}
        </div>
        <div>
          <p className="text-xs text-gray-500">Geschatte DPE label</p>
          <p className="text-sm text-gray-400">indicatief, geen officieel rapport</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Jaarverbruik"
          value={result.jaarverbruikKwh.toLocaleString('nl')}
          unit="kWh"
          icon="⚡"
        />
        <StatCard
          label="CO₂"
          value={result.co2Kg.toLocaleString('nl')}
          unit="kg/j"
          icon="🌿"
        />
        <StatCard
          label="Kosten"
          value={`€ ${result.kostenEur.toLocaleString('nl')}`}
          unit="per jaar"
          icon="💶"
        />
      </div>

      <p className="mt-3 text-xs text-gray-400 text-center">
        Indicatie · geen officiële DPE · vind professional via{' '}
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

function StatCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 text-center">
      <div className="text-lg">{icon}</div>
      <div className="font-heading font-bold text-sm text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{unit}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
