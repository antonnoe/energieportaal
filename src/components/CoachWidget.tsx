import { useState, useRef, useEffect } from 'react';

interface CoachWidgetProps {
  veld: string;
  waarde?: string | number;
  context?: string;
  waarschuwing?: string;
}

/**
 * CoachWidget — [i] knop bij elk invoerveld.
 * Bij klik opent een tooltip met uitleg over het veld.
 *
 * Fase 6 C10: Per element een korte, begrijpelijke uitleg.
 * Gebruikt voorgedefinieerde hints (geen API-call in deze versie).
 */
export function CoachWidget({ veld, waarde, context, waarschuwing }: CoachWidgetProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const hint = waarschuwing || getHint(veld, waarde, context);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Uitleg over ${veld}`}
        className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center hover:bg-primary/20 transition-colors ml-1 shrink-0"
      >
        i
      </button>
      {open && (
        <div className="absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-700 leading-relaxed">
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className="font-semibold text-primary text-[11px]">{veld}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm leading-none"
            >
              &times;
            </button>
          </div>
          {waarschuwing && (
            <p className="text-amber-700 bg-amber-50 rounded p-1.5 mb-1.5 text-[11px]">{waarschuwing}</p>
          )}
          <p>{hint}</p>
        </div>
      )}
    </div>
  );
}

/** Voorgedefinieerde hints per veld */
function getHint(veld: string, waarde?: string | number, _context?: string): string {
  const v = String(veld).toLowerCase();

  const hints: Record<string, string> = {
    postcode: 'Voer uw Franse postcode in (5 cijfers). De eerste twee cijfers bepalen het département en daarmee de klimaatzone.',
    woonoppervlak: 'Het verwarmde woonoppervlak in m². Dit staat op uw taxe foncière of in de compromis de vente.',
    woonoppervlakte: 'Het verwarmde woonoppervlak in m². Dit staat op uw taxe foncière of in de compromis de vente.',
    verdiepingen: 'Het aantal verwarmde verdiepingen. Een zolder die niet verwarmd wordt, telt niet mee.',
    muren: 'De U-waarde van uw buitenmuren in W/m²·K. Hoe lager, hoe beter geïsoleerd. Ongeïsoleerde stenen muren: 2-3. Goed geïsoleerd: onder 0,3.',
    dak: 'De U-waarde van uw dak. Een ongeïsoleerd dak verliest tot 30% van de warmte. Goede isolatie: onder 0,2 W/m²·K.',
    vloer: 'De U-waarde van uw vloer. Vloerisolatie wordt vaak vergeten maar kan 7-10% besparen.',
    ramen: 'De U-waarde van uw beglazing. Enkel glas: 5,8. Dubbel glas: 2,9. HR++: 1,2. Triple: 0,7.',
    luchtwisseling: 'Het aantal keren per uur dat de lucht in uw woning wordt ververst. Oud huis: 0,8-1,0. Nieuwbouw: 0,3.',
    ach: 'Het aantal keren per uur dat de lucht in uw woning wordt ververst. Oud huis: 0,8-1,0. Nieuwbouw: 0,3.',
    plafondhoogte: 'De hoogte van uw plafonds. Standaard 2,5 m. Oude huizen hebben soms 2,8-3,5 m.',
    hoofdverwarming: 'Uw primaire verwarmingssysteem. Een warmtepomp (SCOP 3,5) verbruikt 3,5× minder energie dan direct elektrisch.',
    bijverwarming: 'Eventueel een tweede verwarmingsbron, bijv. een houtkachel als aanvulling op gasverwarming.',
    tapwater: 'Hoe uw warm water wordt verwarmd. Een warmtepompboiler is het zuinigst (COP 2,5-3,5).',
    personen: 'Aantal personen in het huishouden. Bepaalt het warmwaterverbruik.',
    douches: 'Gemiddeld aantal douches per persoon per dag.',
    liter: 'Waterverbruik per douche. Een spaardouchekop verbruikt 6-8 liter/minuut.',
    basiselektriciteit: 'Elektriciteitsverbruik voor huishoudelijke apparaten, verlichting, etc. Gemiddeld Frans huishouden: 2.500 kWh/jaar.',
    basisverbruik: 'Elektriciteitsverbruik voor huishoudelijke apparaten, verlichting, etc. Gemiddeld Frans huishouden: 2.500 kWh/jaar.',
    temperatuur: 'Elke graad lager bespaart 7% op verwarmingskosten. 19°C is het Franse advies.',
    setpoint: 'Elke graad lager bespaart 7% op verwarmingskosten. 19°C is het Franse advies.',
    dagen: 'Hoeveel dagen per jaar u aanwezig bent. De rest wordt verwarmd op de lagere "afwezig"-temperatuur.',
    zonnepanelen: 'Zonnepanelen in Zuid-Frankrijk leveren 1.300-1.450 kWh/kWp/jaar op. In het noorden: 1.100-1.200.',
    elektriciteit: 'Het Franse reguliere elektriciteitstarief (TRV Base). Wordt 2× per jaar aangepast door de CRE.',
    gas: 'De Franse referentiegasprijs (Prix Repère), vastgesteld door de CRE.',
    stookolie: 'De gemiddelde fioul-prijs in Frankrijk, wekelijks bijgewerkt door de DGEC.',
    hout: 'Houtprijs per kWh, berekend als €/stère gedeeld door 1.800 kWh/stère.',
    propaan: 'Propaangas is duur (0,27 €/kWh) maar soms de enige optie in afgelegen gebieden.',
    export: 'Het tarief voor teruglevering van zonnestroom aan het net. Wordt per kwartaal vastgesteld.',
    subsidie: 'Frankrijk biedt diverse subsidies voor energierenovatie. De timing is cruciaal — vraag aan VÓÓR u begint.',
    rendement: 'Het rendement van uw verwarmingssysteem. Gasketel: 0,90. Warmtepomp: SCOP 3,5. Elektrisch: 1,0.',
    wtw: 'WTW-ventilatie (VMC double flux) wint 75-90% van de warmte terug uit afgevoerde lucht.',
    ev: 'Een elektrische auto verbruikt gemiddeld 15-20 kWh/100 km. Thuisladen is het goedkoopst.',
    zwembad: 'Een verwarmd zwembad is een groot energieverbruiker. Overweeg een zonnecollector of een warmtepompboiler.',
    koeling: 'Airconditioning verbruikt veel minder energie dan verwarming dankzij de hoge EER (3-5).',
  };

  // Zoek de beste match
  for (const [key, text] of Object.entries(hints)) {
    if (v.includes(key)) return text;
  }

  if (waarde !== undefined) {
    return `De huidige waarde is ${waarde}. Klik op "Eigen waarde invoeren" als u de exacte waarde kent.`;
  }

  return 'Klik op dit veld voor meer informatie over de invoer.';
}
