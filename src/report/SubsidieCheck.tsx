import { useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { evaluateSubsidie } from '../engine/subsidie-rules';

const statusStyles = {
  green: { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', text: 'text-green-800' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-800' },
  red: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-800' },
};

export function SubsidieCheck() {
  const { portaalInput } = useToolState();

  const subsidie = useMemo(
    () => evaluateSubsidie(portaalInput.subsidieIntake),
    [portaalInput.subsidieIntake]
  );

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-bold text-primary">Subsidie & Financiering</h2>

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
            France Rénov' — vind een adviseur
          </a>
        </p>
        <p>
          <a href="https://france-renov.gouv.fr/annuaire-rge" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Annuaire RGE — gecertificeerde vakmensen
          </a>
        </p>
      </div>
    </section>
  );
}
