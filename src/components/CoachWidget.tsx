import { useState, useRef, useEffect } from 'react';

/**
 * CoachWidget — [i] knop die bij elk invoerveld of grondslag-regel
 * een korte context-gevoelige uitleg geeft.
 *
 * Huidige versie: statische uitleg uit de COACH_TIPS dictionary.
 * Toekomst: koppeling met Anthropic/Café Claude API voor dynamische uitleg.
 */

// ─── Statische uitleg per veld-ID ────────────────────────────────────────────

const COACH_TIPS: Record<string, string> = {
  // Stap 1
  postcode: 'Uw Franse postcode (5 cijfers) bepaalt automatisch in welke klimaatzone uw woning valt. Dit beïnvloedt het aantal graaddagen en daarmee uw verwarmingsbehoefte.',

  // Stap 2
  huisTypeId: 'Het woningtype bepaalt de typische U-waarden (isolatiekwaliteit) en luchtwisseling. Een oud stenen huis (La Longère) heeft heel andere isolatiewaarden dan een RT2012-woning.',
  woonoppervlak: 'De totale verwarmde woonoppervlakte in m². Onverwarmde ruimtes (garage, kelder, zolder) tellen niet mee.',
  verdiepingen: 'Aantal verwarmde woonlagen. Dit beïnvloedt het totale volume en daarmee het ventilatieverlies.',

  // Stap 3
  uMuur: 'De U-waarde is de warmtedoorgangscoëfficiënt (W/m²·K). Hoe lager, hoe beter geïsoleerd. Oud ongeïsoleerd steen: 2.0–3.0. Geïsoleerde muur: 0.2–0.4.',
  uDak: 'Het dak is vaak de grootste bron van warmteverlies. Ongeïsoleerd dak: 2.5–3.5 W/m²·K. Goed geïsoleerd: 0.15–0.25.',
  uVloer: 'Vloerisolatie is in Frankrijk vaak afwezig bij oudere huizen. Ongeïsoleerde vloer op kruipruimte: 1.0–1.5. Geïsoleerd: 0.2–0.4.',
  uRaam: 'Enkel glas ≈ 5.8, oud dubbel glas ≈ 2.8, HR++ ≈ 1.2, triple glas ≈ 0.8 W/m²·K.',
  muurOppervlak: 'Totaal buitenmuuroppervlak exclusief ramen en deuren. Wordt automatisch geschat op basis van woningtype en oppervlakte.',
  dakOppervlak: 'Oppervlak van het dak boven verwarmde ruimte. Bij een appartement is dit vaak 0 (buren erboven).',
  vloerOppervlak: 'Oppervlak van de begane grondvloer boven onverwarmde ruimte. Bij een appartement is dit vaak 0.',
  raamOppervlak: 'Totaal glasoppervlak. Vuistregel: 15–20% van het woonoppervlak bij een standaard woning.',
  ach: 'Air Changes per Hour — het aantal keer per uur dat de binnenlucht volledig wordt ververst. Oud huis: 0.7–0.9. Nieuwbouw: 0.3–0.5.',
  plafondHoogte: 'De gemiddelde hoogte van plafond tot vloer. Standaard 2.5m in moderne woningen, 2.8–3.0m in oudere huizen.',

  // Stap 4
  mainHeating: 'Uw hoofdverwarmingssysteem. Gasketel (η≈0.90), warmtepomp (SCOP≈3.5), stookolie (η≈0.85), elektrisch (η=1.0), hout (η≈0.75).',
  mainEfficiency: 'Het rendement (ketel) of SCOP (warmtepomp) van uw hoofdverwarming. Laat op 0 voor het standaardrendement.',
  auxHeating: 'Een eventueel tweede verwarmingssysteem, zoals een houtkachel als aanvulling op de gasketel.',
  auxFraction: 'Welk percentage van de totale warmtevraag de bijverwarming levert. Bijvoorbeeld: houtkachel levert 30% van de warmte.',
  hasHRV: 'WTW = Warmte Terug Winning (VMC double flux). Een mechanisch ventilatiesysteem dat warmte uit de afgevoerde lucht terugwint.',
  hrvEfficiency: 'Het rendement van het WTW-systeem. Typisch 70–90%. Hoe hoger, hoe minder warmte verloren gaat via ventilatie.',
  personen: 'Aantal bewoners. Bepaalt het tapwaterverbruik: meer personen = meer warm water nodig.',
  douchesPerDag: 'Gemiddeld aantal douches per persoon per dag. Een gemiddelde douche van 8 minuten verbruikt ~50 liter warm water.',
  dhwSystem: 'Het systeem dat uw tapwater verwarmt. Vaak dezelfde ketel als de verwarming, maar kan ook een elektrische boiler of warmtepompboiler zijn.',
  basisElektriciteit: 'Jaarlijks elektriciteitsverbruik exclusief verwarming: verlichting, apparaten, koelkast, wasmachine, etc. Gemiddeld ~2.500 kWh voor 2 personen.',
  hasEV: 'Laadt u thuis een elektrische auto op? Dit voegt ~3.000 kWh/jaar toe aan uw elektriciteitsverbruik (bij 15.000 km/jaar).',
  evKmPerJaar: 'Het geschatte aantal kilometers dat u jaarlijks rijdt met uw elektrische auto.',
  hasPV: 'Zonnepanelen produceren elektriciteit die u zelf verbruikt of teruglevert aan het net, waardoor uw energiekosten dalen.',
  pvVermogen: 'Het totale piekvermogen van uw zonnepanelen in kilowatt-piek (kWp). 1 kWp ≈ 3 panelen ≈ 5 m².',
  pvZelfverbruik: 'Het percentage van uw zonnestroom dat u direct zelf verbruikt (zonder batterij typisch 25–40%).',
  hasZwembad: 'Een verwarmd zwembad verbruikt veel energie. De grootte en het aantal maanden actief bepalen het verbruik.',
  zwembadOppervlak: 'Het wateroppervlak van uw zwembad. Een standaard privézwembad is 24–40 m².',
  hasKoeling: 'Airconditioning in de zomer. Verbruik hangt af van de koelingsgraaddagen (CDD) in uw zone.',
  koelingEER: 'Energy Efficiency Ratio van uw airco. Standaard ≈ 3.0, goede split-unit ≈ 4.0–5.0.',

  // Stap 5
  setpoint: 'Uw gewenste binnentemperatuur wanneer u thuis bent. Elke graad lager bespaart ~7% op verwarmingskosten.',
  awaySetpoint: 'Temperatuur wanneer u langere tijd afwezig bent. Zet niet te laag om vorstschade te voorkomen (minimum 8°C).',
  daysPresent: 'Aantal dagen per jaar dat u daadwerkelijk in de woning verblijft. Belangrijk voor vakantiewoningen.',
  daysAway: 'Dagen dat de woning niet bewoond is. De verwarming staat dan op de lagere "afwezig"-temperatuur.',
  prijsGas: 'Uw gastarief per kWh. Het Franse gereguleerde tarief (TRV) voor gas is per februari 2026 circa 0,1051 €/kWh (PCI).',
  prijsElektriciteit: 'Uw elektriciteitstarief per kWh. Het Franse TRV voor elektriciteit is per februari 2026 circa 0,2516 €/kWh.',
  prijsStookolie: 'Stookolie (fioul domestique) prijs omgerekend naar €/kWh. 1 liter fioul ≈ 10 kWh, dus 1,18 €/L ÷ 10 = 0,118 €/kWh.',
  prijsHout: 'Houtprijs omgerekend naar €/kWh. 1 stère = ~1.500 kWh, dus 85€/stère ÷ 1.500 = 0,057 €/kWh. Pellet: ~0,080 €/kWh.',
  exportTarief: 'De vergoeding die u ontvangt voor teruggeleverde zonnestroom (vente surplus). OA EDF S1 2026: ~0,13 €/kWh.',

  // Subsidie
  subsidieUsage: 'Het gebruik van de woning bepaalt voor welke subsidies u in aanmerking komt. MaPrimeRénov\' is alleen voor hoofdverblijfplaatsen.',
  subsidieAgeGt2: 'Veel subsidies vereisen dat de woning ouder is dan 2 jaar (MaPrimeRénov\', CEE, Éco-PTZ).',
  subsidieStage: 'De fase van uw project bepaalt of u nog in aanmerking komt. CEE vereist inschrijving VÓÓR het tekenen van offertes.',
  subsidieWorkType: 'Het type werkzaamheden beïnvloedt welke subsidies van toepassing zijn en de hoogte ervan.',
  subsidieMprPath: 'MaPrimeRénov\' heeft twee trajecten: Geste (enkele actie, lagere premie) en Ampleur (ingrijpende renovatie, hogere premie).',
  subsidieHeatlossDone: 'Een warmteverliesberekening (audit énergétique) is verplicht voor het MPR Ampleur-traject.',

  // Grondslagen
  'grondslag-ua': 'UA = U-waarde × oppervlak. De UA-waarde geeft het warmteverlies per graad temperatuurverschil aan.',
  'grondslag-hvent': 'Ventilatieverlies hangt af van het volume, de luchtwisseling (ACH) en eventuele warmteterugwinning.',
  'grondslag-hdd': 'Graaddagen (HDD) geven aan hoe koud het klimaat is. Hoe meer graaddagen, hoe meer verwarming nodig.',
  'grondslag-hddeff': 'HDD_eff is het gewogen gemiddelde van graaddagen voor aanwezige en afwezige periodes, gebaseerd op uw stookgedrag.',
  'grondslag-warmtevraag': 'Thermische warmtevraag = totaal warmteverlies × gewogen graaddagen × 24 uur / 1000. Dit is de werkelijke energie die uw woning nodig heeft.',
  'grondslag-dpe': 'De DPE-indicatie deelt uw woning in van A (zuinig, <70 kWh/m²) tot G (energieslurpend, >420 kWh/m²). Dit is een schatting, geen officieel DPE.',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface CoachWidgetProps {
  fieldId: string;
}

export function CoachWidget({ fieldId }: CoachWidgetProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const tip = COACH_TIPS[fieldId];
  if (!tip) return null;

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors inline-flex items-center justify-center ml-1 shrink-0"
        aria-label="Uitleg"
        title="Klik voor uitleg"
      >
        i
      </button>
      {open && (
        <div className="absolute z-50 left-0 top-7 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-700 leading-relaxed">
          <p>{tip}</p>
          <p className="text-xs text-gray-400 mt-2 italic">Le Bricoleur — uw energiecoach</p>
        </div>
      )}
    </div>
  );
}
