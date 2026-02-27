import { useState } from 'react';
import { type ValidationError } from '../engine/tool-spec';

interface CoachPanelProps {
  errors: ValidationError[];
  helpTexts?: Record<string, string>;
}

export function CoachPanel({ errors, helpTexts = {} }: CoachPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasErrors = errors.length > 0;

  // Auto-show when there are validation errors
  const shouldShow = hasErrors || isOpen;

  return (
    <>
      {/* Persistent coach icon */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        title="Coach — klik voor hulp"
        aria-label="Coach hulp"
        className={[
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg',
          'flex items-center justify-center text-2xl',
          'transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
          hasErrors
            ? 'bg-amber-500 focus:ring-amber-500 animate-pulse'
            : 'focus:ring-[#800000]',
        ].join(' ')}
        style={hasErrors ? {} : { backgroundColor: '#800000' }}
      >
        🧑‍🏫
      </button>

      {/* Coach panel */}
      {shouldShow && (
        <aside
          className="fixed bottom-24 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          role="dialog"
          aria-label="Coach hulppaneel"
        >
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ backgroundColor: '#800000' }}
          >
            <span className="font-heading font-semibold text-sm">🧑‍🏫 EnergieCoach</span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Sluit coach paneel"
              className="text-white/80 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto space-y-3">
            {hasErrors ? (
              <>
                <p className="text-sm text-amber-700 font-medium">
                  ⚠️ Er zijn {errors.length} validatiefout{errors.length > 1 ? 'en' : ''} gevonden:
                </p>
                <ul className="space-y-2">
                  {errors.map((err) => (
                    <li
                      key={err.fieldId}
                      className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-2"
                    >
                      <span className="font-medium text-amber-800">{err.fieldId}:</span>{' '}
                      <span className="text-amber-700">{err.message}</span>
                      {helpTexts[err.fieldId] && (
                        <p className="mt-1 text-amber-600 text-xs">{helpTexts[err.fieldId]}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium text-[#800000]">Hoe werkt het?</p>
                <p>
                  Vul de velden in om een energieschatting te krijgen. De resultaten zijn
                  indicatief en geen officieel DPE-rapport.
                </p>
                <p>
                  Voor een officieel energielabel, raadpleeg een gecertificeerde professional
                  via{' '}
                  <a
                    href="https://france-renov.gouv.fr/espaces-conseil-fr/recherche"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#800000] underline"
                  >
                    France Rénov
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
