import { useState, useRef, useEffect, useCallback } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { getHuisTypeById } from '../data/huizen-matrix';
import { getZoneById } from '../engine/constants';

// ─── System prompt cache ──────────────────────────────────────────────────────

let systemPromptCache: string | null = null;
let systemPromptLoading = false;
const systemPromptWaiters: ((p: string) => void)[] = [];

async function getSystemPrompt(): Promise<string> {
  if (systemPromptCache) return systemPromptCache;
  if (systemPromptLoading) {
    return new Promise((resolve) => { systemPromptWaiters.push(resolve); });
  }
  systemPromptLoading = true;
  try {
    const resp = await fetch('/energieportaal-ai-adviseur.md');
    if (!resp.ok) throw new Error('Kon system prompt niet laden');
    systemPromptCache = await resp.text();
  } catch {
    // Fallback: korte inline prompt
    systemPromptCache = `Je bent een Nederlandse energie-adviseur voor Nederlanders in Frankrijk. Geef korte, praktische uitleg. Max 4 zinnen. Verwijs naar infofrankrijk.com voor verdieping.`;
  }
  systemPromptLoading = false;
  systemPromptWaiters.forEach((w) => w(systemPromptCache!));
  systemPromptWaiters.length = 0;
  return systemPromptCache;
}

// ─── Response cache ───────────────────────────────────────────────────────────

const responseCache = new Map<string, string>();

function buildCacheKey(fieldId: string, stateHash: string): string {
  return `${fieldId}::${stateHash}`;
}

// ─── Context builder ──────────────────────────────────────────────────────────

function buildContextPrompt(
  toolState: ReturnType<typeof useToolState>['toolState'],
  result: ReturnType<typeof useToolState>['result'],
  fieldId: string,
  fieldValue?: string | number,
): string {
  const huisType = getHuisTypeById(toolState.huisTypeId);
  const zone = getZoneById(toolState.zoneId);

  let context = `GEBRUIKERSSITUATIE:\n`;
  context += `- Postcode: ${toolState.postcode || 'niet ingevuld'}\n`;
  context += `- Département: ${toolState.departement || 'onbekend'}\n`;
  context += `- Klimaatzone: ${zone.name} (${zone.hdd} graaddagen)\n`;
  context += `- Woningtype: ${huisType?.naam ?? 'niet gekozen'} (${huisType?.periode ?? 'onbekend'})\n`;
  context += `- Oppervlak: ${toolState.woonoppervlak} m²\n`;
  context += `- Volume: ${result.debug.volume} m³\n\n`;

  if (result.hTotaalWK > 0) {
    context += `ISOLATIE:\n`;
    context += `- Muur: U=${toolState.uMuur} W/m²·K (${toolState.muurOppervlak} m²)\n`;
    context += `- Dak: U=${toolState.uDak} W/m²·K (${toolState.dakOppervlak} m²)\n`;
    context += `- Vloer: U=${toolState.uVloer} W/m²·K (${toolState.vloerOppervlak} m²)\n`;
    context += `- Ramen: U=${toolState.uRaam} W/m²·K (${toolState.raamOppervlak} m²)\n\n`;

    context += `WARMTEVERLIES:\n`;
    context += `- Transmissie (Htr): ${result.uaWK} W/K\n`;
    context += `- Ventilatie (Hvent_eff): ${result.hventEffWK} W/K\n`;
    context += `- Totaal (Htot): ${result.hTotaalWK} W/K\n\n`;
  }

  if (result.verwarmingTotaal > 0) {
    context += `ENERGIE:\n`;
    context += `- Hoofdverwarming: ${toolState.mainHeating}\n`;
    context += `- Verwarming totaal: ${result.verwarmingTotaal} kWh/jaar\n`;
    context += `- DHW totaal: ${result.dhwInput} kWh/jaar\n`;
    context += `- Basiselektriciteit: ${result.elektriciteitBasis} kWh/jaar\n\n`;

    context += `DPE-INDICATIE: ${result.dpe.letter} (${Math.round(result.dpe.kwhPerM2)} kWh/m²/jaar)\n`;
    context += `KOSTEN: €${result.nettoKosten}/jaar\n\n`;
  }

  context += `VRAAG VAN GEBRUIKER:\n`;
  context += `De gebruiker klikt op [?] bij: ${fieldId}`;
  if (fieldValue !== undefined) {
    context += ` met waarde: ${fieldValue}`;
  }
  context += `.\nGeef een korte, praktische uitleg (max 4 zinnen).`;

  return context;
}

function getStateHash(toolState: ReturnType<typeof useToolState>['toolState']): string {
  return `${toolState.postcode}|${toolState.huisTypeId}|${toolState.woonoppervlak}|${toolState.uMuur}|${toolState.uDak}|${toolState.mainHeating}`;
}

// ─── Fallback hints (same as old CoachWidget) ─────────────────────────────────

const FALLBACK_HINTS: Record<string, string> = {
  postcode: 'Voer uw Franse postcode in (5 cijfers). De eerste twee cijfers bepalen het département en daarmee de klimaatzone.',
  woonoppervlak: 'Het verwarmde woonoppervlak in m². Dit staat op uw taxe foncière of in de compromis de vente.',
  woonoppervlakte: 'Het verwarmde woonoppervlak in m². Dit staat op uw taxe foncière of in de compromis de vente.',
  verdiepingen: 'Het aantal verwarmde verdiepingen. Een zolder die niet verwarmd wordt, telt niet mee.',
  woningtype: 'Kies het type dat het best bij uw woning past. De U-waarden en oppervlakken worden automatisch ingevuld.',
  muren: 'De U-waarde van uw buitenmuren in W/m²·K. Hoe lager, hoe beter geïsoleerd.',
  dak: 'De U-waarde van uw dak. Een ongeïsoleerd dak verliest tot 30% van de warmte.',
  vloer: 'De U-waarde van uw vloer. Vloerisolatie wordt vaak vergeten maar kan 7-10% besparen.',
  ramen: 'De U-waarde van uw beglazing. Enkel glas: 5,8. Dubbel: 2,9. HR++: 1,2. Triple: 0,7.',
  hoofdverwarming: 'Uw primaire verwarmingssysteem. Een warmtepomp verbruikt 3,5× minder dan direct elektrisch.',
  tapwater: 'Hoe uw warm water wordt verwarmd. Een warmtepompboiler is het zuinigst (COP 2,5-3,5).',
  temperatuur: 'Elke graad lager bespaart 7% op verwarmingskosten. 19°C is het Franse advies.',
  zonnepanelen: 'Zonnepanelen in Zuid-Frankrijk leveren 1.300-1.450 kWh/kWp/jaar op.',
  elektriciteit: 'Het Franse reguliere elektriciteitstarief (TRV Base). Wordt 2× per jaar aangepast door de CRE.',
  subsidie: 'Frankrijk biedt diverse subsidies voor energierenovatie. De timing is cruciaal — vraag aan VÓÓR u begint.',
  'dpe-indicatie': 'Deze DPE-indicatie is gebaseerd op uw eigen invoer en finale energie. Een officiële DPE kan afwijken.',
  kosten: 'De berekende kosten zijn gebaseerd op de energieprijzen van februari 2026.',
  aanbevelingen: 'Maatregelen zijn gesorteerd op terugverdientijd. De top-3 zijn aanbevolen.',
  grondslagen: 'Alle berekeningen zijn transparant opgebouwd. Elke waarde is herleidbaar.',
  klimaatzone: 'De klimaatzone bepaalt de graaddagen en PV-opbrengst. Deze wordt automatisch bepaald op basis van uw postcode.',
};

function getFallbackHint(fieldId: string): string {
  const v = fieldId.toLowerCase();
  for (const [key, text] of Object.entries(FALLBACK_HINTS)) {
    if (v.includes(key)) return text;
  }
  return 'Klik voor meer informatie over deze waarde.';
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AIAdviseurProps {
  veld: string;
  waarde?: string | number;
}

export function AIAdviseur({ veld, waarde }: AIAdviseurProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [antwoord, setAntwoord] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { toolState, result } = useToolState();

  // Sluit tooltip bij klik buiten
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

  const fetchAdvies = useCallback(async () => {
    const stateHash = getStateHash(toolState);
    const cacheKey = buildCacheKey(veld, stateHash);

    // Check cache
    if (responseCache.has(cacheKey)) {
      setAntwoord(responseCache.get(cacheKey)!);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const systemPrompt = await getSystemPrompt();
      const contextPrompt = buildContextPrompt(toolState, result, veld, waarde);

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: systemPrompt,
          messages: [{ role: 'user', content: contextPrompt }],
        }),
      });

      if (!resp.ok) throw new Error(`API error: ${resp.status}`);

      const data = await resp.json();
      const text = data.content?.[0]?.text ?? '';

      if (text) {
        responseCache.set(cacheKey, text);
        setAntwoord(text);
      } else {
        throw new Error('Leeg antwoord');
      }
    } catch {
      // Fallback to static hint
      const fallback = getFallbackHint(veld);
      setAntwoord(fallback);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [toolState, result, veld, waarde]);

  const handleClick = () => {
    if (!open) {
      setOpen(true);
      if (!antwoord) {
        fetchAdvies();
      }
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Uitleg over ${veld}`}
        className="ai-adviseur-btn"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-[100] bottom-full mb-2 left-1/2 -translate-x-1/2 ai-adviseur-tooltip">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="font-semibold text-sm" style={{ color: '#800000' }}>{veld}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-2"
            >
              &times;
            </button>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <span className="ai-adviseur-loading" />
              <span className="ai-adviseur-loading" style={{ animationDelay: '0.2s' }} />
              <span className="ai-adviseur-loading" style={{ animationDelay: '0.4s' }} />
              <span className="text-sm text-gray-400 ml-1">Even denken...</span>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed">{antwoord}</p>
              {error && (
                <p className="text-xs text-gray-400 mt-2 italic">Statische uitleg — AI-adviseur niet beschikbaar.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
