import { useToolState } from '../context/ToolStateContext';
import { DPE_KLASSEN } from '../engine/constants';
import { AIAdviseur } from '../components/AIAdviseur';

function DPEBalk({ kwhPerM2, huidigeKlasseIndex }: { kwhPerM2: number; huidigeKlasseIndex: number }) {
  return (
    <div className="space-y-1">
      {DPE_KLASSEN.map((klasse, i) => {
        const isHuidig = i === huidigeKlasseIndex;
        const width = 40 + i * 8; // toenemende breedte A→G
        return (
          <div key={klasse.letter} className="flex items-center gap-2">
            <div
              className={`h-7 rounded-r-lg flex items-center px-2 text-white text-xs font-bold transition-all ${
                isHuidig ? 'ring-2 ring-gray-800 ring-offset-1' : ''
              }`}
              style={{ width: `${width}%`, backgroundColor: klasse.kleur }}
            >
              {klasse.letter}
              {klasse.maxKwhM2 !== Infinity && (
                <span className="ml-auto text-white/80 text-[10px]">&le; {klasse.maxKwhM2}</span>
              )}
            </div>
            {isHuidig && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">{Math.round(kwhPerM2)} kWh/m²</span>
                <span className="text-[10px] text-gray-500">&lArr;</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DPESchatting() {
  const { result } = useToolState();
  const { dpe } = result;

  const klasseIndex = DPE_KLASSEN.findIndex((k) => k.letter === dpe.letter);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-1">
        <h2 className="font-heading text-lg font-bold text-primary">DPE-indicatie</h2>
        <AIAdviseur veld="DPE-indicatie" waarde={`${dpe.letter} (${Math.round(dpe.kwhPerM2)} kWh/m²)`} />
      </div>

      {/* Grote DPE letter */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-lg"
          style={{ backgroundColor: dpe.kleur }}
        >
          {dpe.letter}
        </div>
        <div>
          <p className="text-2xl font-bold">{Math.round(dpe.kwhPerM2)} kWh/m²/jaar</p>
          <p className="text-sm text-gray-500">
            Klasse {dpe.letter} (max {dpe.maxKwhVoorKlasse === Infinity ? '\u221E' : dpe.maxKwhVoorKlasse} kWh/m²)
          </p>
        </div>
      </div>

      {/* DPE balk */}
      <DPEBalk kwhPerM2={dpe.kwhPerM2} huidigeKlasseIndex={klasseIndex} />

      {/* Afstand tot volgende klasse */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
        {dpe.kwhTotVolgendeKlasse > 0 && dpe.letter !== 'A' && (
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">&uarr;</span>
            <p>
              <span className="font-semibold">Naar klasse {DPE_KLASSEN[Math.max(0, klasseIndex - 1)]?.letter}:</span>{' '}
              nog {Math.round(dpe.kwhTotVolgendeKlasse)} kWh/m² besparen
            </p>
          </div>
        )}
        {dpe.letter === 'A' && (
          <p className="text-green-700 font-semibold">Uw woning heeft de beste DPE-klasse!</p>
        )}
        {dpe.kwhTotLagereKlasse > 0 && dpe.letter !== 'G' && (
          <div className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">&darr;</span>
            <p>
              <span className="font-semibold">Naar klasse {DPE_KLASSEN[Math.min(6, klasseIndex + 1)]?.letter}:</span>{' '}
              nog {Math.round(dpe.kwhTotLagereKlasse)} kWh/m² marge
            </p>
          </div>
        )}
      </div>

      {/* Verhuurverbod waarschuwing */}
      {dpe.verhuurverbod && (
        <div className={`rounded-lg p-3 text-sm ${
          dpe.verhuurverbod.verboden
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-amber-50 border border-amber-200 text-amber-800'
        }`}>
          <p className="font-bold mb-1">
            {dpe.verhuurverbod.verboden ? 'Verhuurverbod actief' : 'Verhuurverbod gepland'}
          </p>
          <p>{dpe.verhuurverbod.beschrijving}</p>
        </div>
      )}

      {/* F6: Disclaimer methodiek */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 space-y-1">
        <p className="font-semibold">Indicatieve berekening</p>
        <p>
          Dit is een indicatieve berekening op basis van uw invoergegevens. Geen offici&euml;le DPE-audit.
          Een gecertificeerde DPE kan afwijken.
        </p>
        <p className="text-blue-600">
          Let op: een offici&euml;le DPE classificeert op dubbele drempels (energie &eacute;n broeikasgassen),
          gebruikt conventies voor gebruikspatronen, en rekent in kWh primaire energie (EP).
          Deze indicatie is gebaseerd op uw werkelijke invoer en finale energie.
        </p>
        <p>
          <span className="font-medium">DPE-verbruik:</span> verwarming + tapwater + basiselek.
          EV, zwembad en koeling zijn uitgesloten.
        </p>
      </div>
    </section>
  );
}
