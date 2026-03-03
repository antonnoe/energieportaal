import { useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { evaluateSubsidie } from '../engine/subsidie-rules';
import { AIAdviseur } from '../components/AIAdviseur';

const statusStyles = {
  green: { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', text: 'text-green-800', icon: '\u2705' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-800', icon: '\u26a0\ufe0f' },
  red: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-800', icon: '\u274c' },
};

// Subsidie-specifieke aanvraag-info voor het verdict
const SUBSIDIE_AANVRAAG: Record<string, { aanvraagwijze: string; url: string }> = {
  'mpr-geste': {
    aanvraagwijze: 'aanvragen via maprimerenov.gouv.fr',
    url: 'https://infofrankrijk.com/ma-prime-renov-in-frankrijk-voorwaarden-werking-en-aandachtspunten/',
  },
  'mpr-ampleur': {
    aanvraagwijze: 'aanvragen via maprimerenov.gouv.fr (met Mon Accompagnateur R\u00e9nov\u2019)',
    url: 'https://infofrankrijk.com/ma-prime-renov-in-frankrijk-voorwaarden-werking-en-aandachtspunten/',
  },
  cee: {
    aanvraagwijze: 'via uw installateur of energieleverancier',
    url: 'https://infofrankrijk.com/cee-en-primes-energie-energiebesparingspremies-in-frankrijk-uitgelegd/',
  },
  'eco-ptz': {
    aanvraagwijze: 'alleen via uw bank \u2014 bureaucratisch maar renteloos',
    url: 'https://infofrankrijk.com/eco-ptz-renteloze-lening-voor-energierenovatie-in-frankrijk/',
  },
  tva: {
    aanvraagwijze: 'automatisch via uw RGE-aannemer op de factuur',
    url: 'https://infofrankrijk.com/tva-a-55-bij-renovatie-in-frankrijk-wanneer-geldt-het-lage-btw-tarief/',
  },
  lokaal: {
    aanvraagwijze: 'informeer bij uw mairie of ADIL',
    url: 'https://infofrankrijk.com/lokale-subsidies-voor-energierenovatie-in-frankrijk-zo-vindt-u-wat-er-geldt/',
  },
};

export function SubsidieCheck() {
  const { portaalInput, result } = useToolState();

  const subsidie = useMemo(
    () => evaluateSubsidie({ ...portaalInput.subsidieIntake, dpeLetter: result.dpe.letter }),
    [portaalInput.subsidieIntake, result.dpe.letter]
  );

  const eligibleCards = subsidie.cards.filter(c => c.eligible);
  const redCards = subsidie.cards.filter(c => c.status === 'red');

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-1">
        <h2 className="font-heading text-lg font-bold text-primary">Subsidie & Financiering</h2>
        <AIAdviseur veld="Subsidie & Financiering" />
      </div>

      {/* Subsidie kaarten */}
      <div className="space-y-2">
        {subsidie.cards.map((card) => {
          const style = statusStyles[card.status];
          return (
            <div key={card.id} className={`${style.bg} border ${style.border} rounded-lg p-3`}>
              <div className="flex items-start gap-2">
                <div className={`w-3 h-3 rounded-full ${style.dot} mt-1 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{card.title}</p>
                    <span className="text-xs font-medium text-gray-600 shrink-0">{card.amount}</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${style.text}`}>{card.reason}</p>
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline mt-1 inline-block"
                  >
                    Meer informatie
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* A2: Concreet subsidie-verdict */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-bold text-primary mb-3">Ons verdict</p>

        <div className="space-y-2">
          {subsidie.cards.map((card) => {
            const style = statusStyles[card.status];
            const aanvraag = SUBSIDIE_AANVRAAG[card.id];
            return (
              <div key={card.id} className="flex items-start gap-2 text-sm">
                <span className="shrink-0">{style.icon}</span>
                <div>
                  <span className="font-semibold">{card.shortTitle}: </span>
                  <span className="text-gray-700">
                    {card.status === 'red' ? (
                      <>niet van toepassing ({card.reason.split('—')[0].trim().toLowerCase()})</>
                    ) : (
                      <>
                        {card.amount}
                        {aanvraag && (
                          <> — <a href={aanvraag.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{aanvraag.aanvraagwijze}</a></>
                        )}
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Samenvattende regel */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          {eligibleCards.length > 0 ? (
            <>
              <p className="text-sm font-semibold text-green-800">
                {eligibleCards.length} subsidie{eligibleCards.length > 1 ? 's' : ''} beschikbaar ({eligibleCards.map(c => c.shortTitle).join(', ')})
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Onze inschatting: {redCards.length <= 1 ? (
                  <span className="font-semibold text-green-700">Ja, aanvragen — het loont. Begin bij France R\u00e9nov' voor gratis begeleiding.</span>
                ) : (
                  <span className="font-semibold text-amber-700">Marginaal — weeg af tegen moeite. Niet alle subsidies zijn beschikbaar in uw situatie.</span>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-red-700">
              Helaas zijn er in uw huidige situatie geen subsidies beschikbaar. Controleer uw invoer of neem contact op met France R\u00e9nov'.
            </p>
          )}
        </div>
      </div>

      {/* Actieplan */}
      {subsidie.actionPlan.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-sm font-semibold mb-2">Stappenplan</p>
          <ol className="text-sm text-gray-700 space-y-1.5">
            {subsidie.actionPlan.map((stap, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gray-400 shrink-0">{stap.split('.')[0]}.</span>
                <span>{stap.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Nuttige links */}
      <div className="text-xs text-gray-500 space-y-0.5">
        <p>
          <a href="https://france-renov.gouv.fr/preparer-projet/trouver-conseiller" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            France R\u00e9nov' — vind een adviseur
          </a>
          {' '}(zoek een gratis adviseur bij u in de buurt)
        </p>
        <p>
          <a href="https://france-renov.gouv.fr/annuaire-rge" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Annuaire RGE — gecertificeerde vakmensen
          </a>
          {' '}(zoek een gecertificeerde aannemer)
        </p>
      </div>
    </section>
  );
}
