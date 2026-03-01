import { useState, useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { berekenSavings, berekenCombinatie } from '../engine/savings';
import { getDPEKleur } from '../engine/dpe';

const categorieIcons: Record<string, string> = {
  isolatie: '\ud83e\uddf1',
  verwarming: '\ud83d\udd25',
  ventilatie: '\ud83d\udca8',
  hernieuwbaar: '\u2600\ufe0f',
};

export function Besparingsadvies() {
  const { portaalInput, result } = useToolState();
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set());

  const savings = useMemo(() => berekenSavings(portaalInput, result), [portaalInput, result]);

  const combinatie = useMemo(() => {
    if (geselecteerd.size === 0) return null;
    return berekenCombinatie(portaalInput, result, Array.from(geselecteerd));
  }, [portaalInput, result, geselecteerd]);

  const toggleMaatregel = (id: string) => {
    setGeselecteerd(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (savings.maatregelen.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-primary">Wat kunt u doen?</h2>
        <p className="text-sm text-gray-500 bg-green-50 border border-green-200 rounded-lg p-3">
          Uw woning is al goed ge\u00efsoleerd en uitgerust. Er zijn geen significante besparingsmaatregelen meer beschikbaar.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-bold text-primary">Wat kunt u doen?</h2>
      <p className="text-xs text-gray-500">
        Selecteer maatregelen om het gecombineerde effect te berekenen. Gesorteerd op terugverdientijd (kortste eerst).
      </p>

      {/* Samenvatting alle maatregelen */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
        <p className="font-semibold text-green-800">
          {savings.maatregelen.length} maatregelen beschikbaar — totale besparing ~\u20ac {savings.totaalBesparingEur.toLocaleString('nl-NL')}/jaar
        </p>
        {savings.dpeNaMaatregelen.letter !== result.dpe.letter && (
          <p className="text-green-700 mt-1">
            DPE-indicatie na alle maatregelen: {result.dpe.letter} \u2192 {savings.dpeNaMaatregelen.letter} ({Math.round(savings.dpeNaMaatregelen.kwhPerM2)} kWh/m\u00b2)
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
              <li key={m.id}>{m.naam} (-{m.dpeReductieKwhM2} kWh/m\u00b2)</li>
            ))}
          </ul>
        </div>
      )}

      {/* A3: Scenario-vergelijking resultaat */}
      {combinatie && geselecteerd.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-bold text-blue-900 mb-2">
            Scenario: {geselecteerd.size} maatregel{geselecteerd.size > 1 ? 'en' : ''} gecombineerd
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">Besparing</p>
              <p className="text-base font-bold text-green-700">\u20ac {combinatie.besparingEurJaar.toLocaleString('nl-NL')}/jr</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">DPE-indicatie</p>
              <p className="text-base font-bold">
                <span style={{ color: combinatie.huidigeDpe.kleur }}>{combinatie.huidigeDpe.letter}</span>
                {' \u2192 '}
                <span style={{ color: combinatie.nieuweDpe.kleur }}>{combinatie.nieuweDpe.letter}</span>
              </p>
              <p className="text-[10px] text-gray-400">{combinatie.nieuweDpe.kwhPerM2} kWh/m\u00b2</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">Investering</p>
              <p className="text-sm font-bold">
                \u20ac {combinatie.kostenSchatting.min.toLocaleString('nl-NL')}\u2013{combinatie.kostenSchatting.max.toLocaleString('nl-NL')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">Terugverdientijd</p>
              <p className="text-base font-bold">
                {combinatie.terugverdientijdJaar < 50 ? `${combinatie.terugverdientijdJaar} jr` : '>50 jr'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Maatregelkaarten met checkboxen */}
      <div className="space-y-3">
        {savings.maatregelen.map((m, index) => {
          const isAanbevolen = index < 3;
          const isSelected = geselecteerd.has(m.id);
          const dpeChanged = m.dpeNaLetter !== result.dpe.letter;

          return (
            <div
              key={m.id}
              className={`border rounded-lg p-3 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 border-blue-300 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleMaatregel(m.id)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleMaatregel(m.id); } }}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="pt-0.5 shrink-0">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{categorieIcons[m.categorie] ?? '\ud83d\udce6'}</span>
                    <p className="text-sm font-semibold">{m.naam}</p>
                    {isAanbevolen && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                        Aanbevolen
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{m.beschrijving}</p>

                  {/* DPE-effect per maatregel */}
                  {dpeChanged && (
                    <p className="text-xs mt-1">
                      <span className="text-gray-500">DPE-indicatie: </span>
                      <span className="font-semibold" style={{ color: result.dpe.kleur }}>{result.dpe.letter}</span>
                      {' \u2192 '}
                      <span className="font-semibold" style={{ color: getDPEKleur(m.dpeNaLetter) }}>{m.dpeNaLetter}</span>
                      <span className="text-gray-400"> ({m.dpeNaKwhM2} kWh/m\u00b2)</span>
                    </p>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    <div className="bg-gray-50 rounded p-1.5 text-center">
                      <p className="text-[10px] text-gray-500">Besparing</p>
                      <p className="text-sm font-bold text-green-700">\u20ac {m.besparingEurJaar}/jr</p>
                    </div>
                    <div className="bg-gray-50 rounded p-1.5 text-center">
                      <p className="text-[10px] text-gray-500">kWh/jaar</p>
                      <p className="text-sm font-bold">{m.besparingKwhJaar.toLocaleString('nl-NL')}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-1.5 text-center">
                      <p className="text-[10px] text-gray-500">Investering</p>
                      <p className="text-xs font-bold">\u20ac {m.kostenSchatting.min.toLocaleString('nl-NL')}\u2013{m.kostenSchatting.max.toLocaleString('nl-NL')}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-1.5 text-center">
                      <p className="text-[10px] text-gray-500">Terugverdientijd</p>
                      <p className="text-sm font-bold">{m.terugverdientijdJaar < 50 ? `${m.terugverdientijdJaar} jr` : '>50 jr'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-gray-400 leading-relaxed">
        Investeringsbedragen zijn indicatief (bron: ADEME). Werkelijke kosten hangen af van woningspecifieke omstandigheden,
        materiaalkeuze en aannemer. Vraag altijd meerdere offertes aan bij RGE-gecertificeerde vakmensen.
      </p>
    </section>
  );
}
