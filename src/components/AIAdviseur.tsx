import { useState, useRef, useEffect } from 'react';
import { useToolState } from '../context/ToolStateContext';

interface AIAdviseurProps {
  veld: string;
  waarde?: string | number;
  context?: string;
}

// Cache: stateHash+veld → response text
const cache = new Map<string, string>();

let systemPromptCache: string | null = null;

function getStateHash(toolState: any): string {
  return JSON.stringify(toolState);
}

async function loadSystemPrompt(): Promise<string> {
  if (systemPromptCache) return systemPromptCache;
  const resp = await fetch('/energieportaal-ai-adviseur.md');
  if (!resp.ok) throw new Error('Could not load system prompt');
  systemPromptCache = await resp.text();
  return systemPromptCache;
}

export function AIAdviseur({ veld, waarde, context }: AIAdviseurProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { toolState, result } = useToolState();

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);

    // Check cache
    const hash = getStateHash(toolState);
    const contextHash = context ? getStateHash(context) : '';
    const cacheKey = `${hash}:${veld}:${waarde ?? ''}:${contextHash}`;
    if (cache.has(cacheKey)) {
      setAnswer(cache.get(cacheKey)!);
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const systemPrompt = await loadSystemPrompt();
      const contextPrompt = buildContextPrompt(veld, waarde, context, toolState, result);

      const resp = await fetch('/api/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt,
          prompt: contextPrompt,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.text) {
        cache.set(cacheKey, data.text);
        setAnswer(data.text);
      } else {
        throw new Error('API error');
      }
    } catch {
      setError('AI-adviseur is momenteel niet beschikbaar. Probeer later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`AI-advies over ${veld}`}
        className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center hover:bg-blue-200 transition-colors ml-1 shrink-0"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-700 leading-relaxed">
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className="font-semibold text-blue-700 text-[11px]">AI-adviseur: {veld}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="text-gray-400 hover:text-gray-600 text-sm leading-none"
            >
              &times;
            </button>
          </div>
          {loading && (
            <p className="text-gray-400 italic">Even denken...</p>
          )}
          {error && (
            <p className="text-red-600">{error}</p>
          )}
          {answer && (
            <p>{answer}</p>
          )}
        </div>
      )}
    </div>
  );
}

function getDefaultEffLabel(type: string): string {
  const defaults: Record<string, string> = {
    gas: '0.90', stookolie: '0.85', warmtepomp: '3.5',
    elektrisch: '1.0', hout: '0.75', propaan: '0.90',
  };
  return defaults[type] ?? '?';
}

function buildContextPrompt(
  veld: string,
  waarde: string | number | undefined,
  context: string | undefined,
  toolState: any,
  result: any,
): string {
  const lines: string[] = [
    `GEBRUIKERSSITUATIE:`,
    `- Postcode: ${toolState.postcode || '(niet ingevuld)'}`,
    `- Département: ${toolState.departement || '(onbekend)'}`,
    `- Klimaatzone: ${toolState.zoneId}`,
    `- Woningtype: ${toolState.huisTypeId}`,
    `- Oppervlak: ${toolState.woonoppervlak} m²`,
    ``,
    `ISOLATIE:`,
    `- Muur: U=${toolState.uMuur} W/m²·K (${toolState.muurOppervlak} m²)`,
    `- Dak: U=${toolState.uDak} W/m²·K (${toolState.dakOppervlak} m²)`,
    `- Vloer: U=${toolState.uVloer} W/m²·K (${toolState.vloerOppervlak} m²)`,
    `- Ramen: U=${toolState.uRaam} W/m²·K (${toolState.raamOppervlak} m²)`,
    `- Raamtype: ${toolState.isolatieNiveauRaam || 'handmatig ingevoerd'}`,
    `- Muurniveau: ${toolState.isolatieNiveauMuur || 'handmatig'}`,
    `- Dakniveau: ${toolState.isolatieNiveauDak || 'handmatig'}`,
    `- Vloerniveau: ${toolState.isolatieNiveauVloer || 'handmatig'}`,
    ``,
    `WARMTEVERLIES:`,
    `- Transmissie (Htr): ${result.uaWK} W/K`,
    `- Ventilatie (Hvent_eff): ${result.hventEffWK} W/K`,
    `- Totaal (Htot): ${result.hTotaalWK} W/K`,
    ``,
    `ENERGIE:`,
    `- Hoofdverwarming: ${toolState.mainHeating} (η/SCOP=${Number(toolState.mainEfficiency) > 0 ? toolState.mainEfficiency : 'standaard (' + getDefaultEffLabel(toolState.mainHeating) + ')'})`,
    `- Bijverwarming: ${toolState.auxHeating || 'geen'} (${toolState.auxFraction}%)`,
    `- DHW-systeem: ${toolState.dhwSystem}`,
    `- DHW rendement: ${toolState.dhwEfficiency}`,
    `- WTW: ${toolState.hasHRV === 'ja' ? 'Ja (' + toolState.hrvEfficiency + ')' : 'Nee'}`,
    `- Verwarming totaal: ${result.verwarmingTotaal} kWh/jaar`,
    `- DHW totaal: ${result.dhwInput} kWh/jaar`,
    `- Basiselektriciteit: ${result.elektriciteitBasis} kWh/jaar`,
    `- EV: ${toolState.hasEV === 'ja' ? toolState.evKmPerJaar + ' km/jaar' : 'Nee'}`,
    `- PV: ${toolState.hasPV === 'ja' ? toolState.pvVermogen + ' kWp' : 'Nee'}`,
    `- Zwembad: ${toolState.hasZwembad === 'ja' ? toolState.zwembadOppervlak + ' m²' : 'Nee'}`,
    ``,
    `DPE-INDICATIE: ${result.dpe.letter} (${Math.round(result.dpe.kwhPerM2)} kWh/m²/jaar)`,
    `KOSTEN: \u20AC${result.kostenTotaal}/jaar`,
    ``,
    `VRAAG VAN GEBRUIKER:`,
    `Veld/sectie: ${veld}`,
  ];

  if (waarde !== undefined) {
    lines.push(`Huidige waarde: ${waarde}`);
  }
  if (context) {
    lines.push(`Extra context: ${context}`);
  }

  lines.push('', 'Geef een kort, praktisch antwoord in maximaal 4 zinnen.');

  return lines.join('\n');
}
