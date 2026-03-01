import { useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { berekenSavings } from '../engine/savings';

/**
 * FloatingEuro — Sticky zwevende balk die direct de financiële impact toont.
 *
 * Altijd zichtbaar onderaan het scherm. Toont:
 * - Huidige jaarlijkse energiekosten
 * - DPE-klasse
 * - Mogelijke besparing
 */
export function FloatingEuro() {
  const { result, portaalInput } = useToolState();

  const savings = useMemo(() => berekenSavings(portaalInput, result), [portaalInput, result]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* DPE badge */}
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-sm"
              style={{ backgroundColor: result.dpe.kleur }}
            >
              {result.dpe.letter}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-500">DPE-ind.</p>
              <p className="text-xs font-medium">{Math.round(result.dpe.kwhPerM2)} kWh/m²</p>
            </div>
          </div>

          {/* Kosten */}
          <div className="text-center">
            <p className="text-xs text-gray-500">Energiekosten</p>
            <p className="text-lg font-bold text-primary">
              € {result.nettoKosten.toLocaleString('nl-NL')}<span className="text-xs font-normal text-gray-500">/jaar</span>
            </p>
          </div>

          {/* Besparing */}
          {savings.totaalBesparingEur > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Mogelijke besparing</p>
              <p className="text-lg font-bold text-green-700">
                € {savings.totaalBesparingEur.toLocaleString('nl-NL')}<span className="text-xs font-normal text-gray-500">/jaar</span>
              </p>
            </div>
          )}

          {/* CO₂ */}
          <div className="hidden md:block text-right">
            <p className="text-xs text-gray-500">CO₂</p>
            <p className="text-sm font-medium">{result.co2Kg.toLocaleString('nl-NL')} kg</p>
          </div>
        </div>
      </div>
    </div>
  );
}
