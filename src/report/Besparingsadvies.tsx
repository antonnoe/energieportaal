import { useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { berekenSavings } from '../engine/savings';

export function Besparingsadvies() {
  const { portaalInput, result } = useToolState();

  const savings = useMemo(() => berekenSavings(portaalInput, result), [portaalInput, result]);

  if (savings.maatregelen.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-primary">Besparingsadvies</h2>
        <p className="text-sm text-gray-500 bg-green-50 border border-green-200 rounded-lg p-3">
          Uw woning is al goed geïsoleerd en uitgerust. Er zijn geen significante besparingsmaatregelen meer beschikbaar.
        </p>
      </section>
    );
  }

  const categorieIcons: Record<string, string> = {
    isolatie: '🧱',
    verwarming: '🔥',
    ventilatie: '💨',
    hernieuwbaar: '☀️',
  };

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-bold text-primary">Besparingsadvies</h2>

      {/* Samenvatting */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-green-800">
          {savings.maatregelen.length} maatregelen beschikbaar — totale besparing ~€ {savings.totaalBesparingEur.toLocaleString('nl-NL')}/jaar
        </p>
        {savings.dpeNaMaatregelen.letter !== result.dpe.letter && (
          <p className="text-green-700 mt-1">
            DPE na alle maatregelen: {result.dpe.letter} → {savings.dpeNaMaatregelen.letter} ({Math.round(savings.dpeNaMaatregelen.kwhPerM2)} kWh/m²)
          </p>
        )}
      </div>

      {/* Maatregelen voor volgende DPE-klasse */}
      {savings.maatregelenVoorVolgendeDPE.length > 0 && result.dpe.letter !== 'A' && (
        <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 text-sm">
          <p className="font-semibold text-primary mb-1">
            Om DPE-klasse {result.dpe.letter} te verlaten:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-0.5">
            {savings.maatregelenVoorVolgendeDPE.map((m) => (
              <li key={m.id}>{m.naam} (-{m.dpeReductieKwhM2} kWh/m²)</li>
            ))}
          </ul>
        </div>
      )}

      {/* Maatregelen lijst */}
      <div className="space-y-3">
        {savings.maatregelen.map((m) => (
          <div key={m.id} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <span className="text-lg">{categorieIcons[m.categorie] ?? '📦'}</span>
                <div>
                  <p className="text-sm font-semibold">{m.naam}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.beschrijving}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 text-center">
              <div className="bg-gray-50 rounded p-1.5">
                <p className="text-xs text-gray-500">Besparing</p>
                <p className="text-sm font-bold text-green-700">€ {m.besparingEurJaar}/jr</p>
              </div>
              <div className="bg-gray-50 rounded p-1.5">
                <p className="text-xs text-gray-500">kWh/jaar</p>
                <p className="text-sm font-bold">{m.besparingKwhJaar.toLocaleString('nl-NL')}</p>
              </div>
              <div className="bg-gray-50 rounded p-1.5">
                <p className="text-xs text-gray-500">Investering</p>
                <p className="text-sm font-bold">€ {m.kostenSchatting.min.toLocaleString('nl-NL')}–{m.kostenSchatting.max.toLocaleString('nl-NL')}</p>
              </div>
              <div className="bg-gray-50 rounded p-1.5">
                <p className="text-xs text-gray-500">Terugverdientijd</p>
                <p className="text-sm font-bold">{m.terugverdientijdJaar < 50 ? `${m.terugverdientijdJaar} jr` : '>50 jr'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
