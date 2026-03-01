# CLAUDE.md — EnergiePortaal Frankrijk

## LEESWIJZER VOOR AI-ASSISTENTEN

Dit document is de enige bron van waarheid voor dit project. Lees het VOLLEDIG voordat je iets doet.
De eigenaar (Anton) is designer/conceptualist, geen programmeur. Communiceer als aannemer tegen opdrachtgever.

### Werkregels (niet-onderhandelbaar)

- **ÉÉN stap per keer.** Wacht op bevestiging.
- **Geen technische uitleg** tenzij expliciet gevraagd.
- **Geen bestanden aanpassen** die niet expliciet genoemd worden.
- **Altijd Nederlands** spreken.
- **Nooit meerdere bestanden tegelijk** in een ZIP. Één per keer.
- **Volledige, kant-en-klare code.** Niet in losse stukken.
- Anton werkt **NOOIT lokaal**. Altijd via GitHub web interface + Vercel.
- **Deployment**: Vercel, `base: '/'` in vite.config.ts. NIET `/energieportaal/`.
- Als je niet kunt pushen: geef de `/permissions` instructie, stuur NIET terug naar GitHub UI.

---

## PROJECT OVERZICHT

**EnergiePortaal** is één geïntegreerde energietool voor Nederlandse huiseigenaren in Frankrijk.
URL: wordt gedeployed via Vercel.
Eigenaar: Anton Noë / InfoFrankrijk.com / Nederlanders.fr

### Oorsprong

Dit project vervangt 4 losstaande V1 tools die overlap hadden:

| V1 Repo | Wat het deed | Wat we overnemen |
|---------|-------------|-----------------|
| `warmteverlies-calculator` | Gedetailleerde UA-berekening, SCOP/η, HDD, ventilatie, PV, EV, zwembad, koeling | **De complete rekenmotor** (engine.js + tool-spec.js) |
| `energiekompas-frankrijk` | Franse huizenmatrix (8 types), DPE-schatting, dept→zone mapping, stookgedrag, subsidie-hints | **Huizenmatrix, DPE-logica, dept→zone, stookpatronen** |
| `energiebesparing-subsidie` | Subsidie-checker met geo.api.gouv.fr, beslisregels MaPrimeRénov'/CEE/Éco-PTZ/TVA | **Subsidie-beslislogica en geo-lookup** |
| `Energiecalculator-Frankrijk` | Vereenvoudigde wrapper | Niet nodig, opgegaan in bovenstaande |

### Doel

Eén tool, één rekenmotor, één doorlopend rapport. Geen losse tabbladen, geen gescheiden tools.
Invoer links/boven, rapport rechts/onder. Floating € indicator altijd zichtbaar.

---

## ARCHITECTUUR

### Kernprincipe: Eén rekenmotor → meerdere outputs

```
INVOER (stapsgewijs)
  │
  ├─ Stap 1: Locatie (postcode → zone via dept-mapping)
  ├─ Stap 2: Woningtype (Franse huizenmatrix → auto U-waarden)
  ├─ Stap 3: Verfijning (isolatie, oppervlakken, handmatig of auto)
  ├─ Stap 4: Energie (verwarming, tapwater, apparaten, PV, EV, zwembad)
  └─ Stap 5: Financieel (energieprijzen, subsidie-parameters)
  │
  ▼
REKENMOTOR (engine/)
  │ Eén pure functie: invoer → volledig resultaatobject
  │ Inclusief debug-object met ELKE tussenstap
  │
  ▼
ÉÉN DOORLOPEND RAPPORT (geen tabs, geen losse tools)
  │
  │  Het rapport is één scrollbaar document met secties:
  │
  ├─ Sectie 1: Woningprofiel — type, locatie, kenmerken
  ├─ Sectie 2: Energieprofiel — warmteverlies, verbruik, kosten per categorie
  ├─ Sectie 3: DPE-schatting — letter + kWh/m² + uitleg waarom D en niet C/E
  │     + wat nodig is om één klasse te stijgen + verhuurverbod-check
  ├─ Sectie 4: Besparingsadvies — concrete maatregelen + terugverdientijden
  ├─ Sectie 5: Subsidie/Finance — MaPrimeRénov', CEE, Éco-PTZ, TVA 5.5%
  │     stoplicht-badges, timing-waarschuwingen, gekoppeld aan maatregelen
  └─ Sectie 6: Grondslagen — alle tussenstappen, formules, bronnen
  │
  │  FLOATING € TOGGLE (altijd zichtbaar, sticky)
  │  ─────────────────────────────────────────────
  │  Een zwevende balk/knop die DIRECT de financiële impact toont
  │  wanneer de gebruiker invoer wijzigt. Bijvoorbeeld:
  │  - Enkel glas → HR++ : "Besparing: €840/jaar"
  │  - Elektrisch → warmtepomp: "Besparing: €1.200/jaar"
  │  - Zwembad aan/uit: direct € effect zichtbaar
  │  Dit zit al in V1 (FloatingEuroButton) en moet mee naar V2.
```

### Directory structuur

```
energieportaal/
├── CLAUDE.md                    ← dit bestand
├── vite.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── index.html
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                 ← mount punt
    ├── App.tsx                  ← routing tussen stappen + output views
    ├── index.css                ← Tailwind + huisstijl
    │
    ├── engine/                  ← PURE REKENLOGICA, GEEN UI
    │   ├── constants.ts         ← ZONES, HUIZEN-matrix, brandstofprijzen, U-presets
    │   ├── types.ts             ← TypeScript types voor invoer en resultaat
    │   ├── tool-spec.ts         ← Velddefinities met validatie (single source of truth)
    │   ├── compute.ts           ← Hoofdberekening: invoer → resultaatobject + debug
    │   ├── dpe.ts               ← DPE-classificatie + bandbreedte-analyse
    │   ├── subsidie-rules.ts    ← Beslislogica subsidies (stoplicht)
    │   └── savings.ts           ← Besparingsscenario's + terugverdientijden
    │
    ├── data/                    ← STATISCHE DATA
    │   ├── huizen-matrix.ts     ← 8 Franse woningtypes met U-waarden, massa, vochtadvies
    │   ├── dept-zone-map.ts     ← Département → klimaatzone mapping
    │   └── sources.ts           ← Bronverwijzingen naar infofrankrijk.com artikelen
    │
    ├── context/
    │   └── ToolStateContext.tsx  ← Gedeelde state voor alle stappen en outputs
    │
    ├── components/              ← HERBRUIKBARE UI-COMPONENTEN
    │   ├── NumInput.tsx         ← Numeriek invoerveld met suffix, min/max
    │   ├── InfoButton.tsx       ← [i] knop voor coach-tooltips
    │   ├── DPEBalk.tsx          ← Visuele DPE-balk met pointer
    │   ├── StoplichtBadge.tsx   ← Groen/oranje/rood badge voor subsidies
    │   ├── KostenBar.tsx        ← Sticky floating kostenoverzicht
    │   ├── HuisKaart.tsx        ← Woningtype selectiekaart
    │   ├── IsolatieIndicator.tsx
    │   ├── Grondslagen.tsx      ← Inklapbaar paneel met alle berekeningen
    │   ├── CoachTip.tsx         ← Le Bricoleur [i] tooltip bij invoervelden
    │   └── PdfExport.tsx        ← PDF-generator
    │
    ├── steps/                   ← INVOERSTAPPEN
    │   ├── Step1Locatie.tsx
    │   ├── Step2Woningtype.tsx
    │   ├── Step3Isolatie.tsx
    │   ├── Step4Energie.tsx
    │   └── Step5Financieel.tsx
    │
    └── report/                   ← RAPPORT SECTIES (één doorlopend rapport)
        ├── Woningprofiel.tsx
        ├── Energieprofiel.tsx
        ├── DPESchatting.tsx
        ├── Besparingsadvies.tsx
        ├── SubsidieCheck.tsx
        ├── Grondslagen.tsx
        └── FloatingEuro.tsx       ← Sticky floating € impact-indicator
```

---

## DE REKENMOTOR — SPECIFICATIES

### Dit is het hart van de tool. Elke berekening moet verifieerbaar zijn.

### Warmteverlies (uit V1 warmteverlies-calculator)

```
UA = Σ(A_i × U_i)  voor muur, dak, vloer, ramen
Hvent = 0.34 × volume × ACH
HventEff = Hvent × (1 - η_HRV)  als WTW aanwezig, anders Hvent
H = UA + HventEff

HDD_present = zone.hdd × max(0, (setpoint - Tref) / (18 - Tref))
HDD_away    = zone.hdd × max(0, (awaySetpoint - Tref) / (18 - Tref))

heatDemand = H × ((HDD_present × daysPresent/365) + (HDD_away × daysAway/365)) × 24 / 1000
```

### Verwarmingskosten

```
mainInput = heatDemand × mainFrac / mainEff
auxInput  = heatDemand × auxFrac / auxEff

waarbij:
- mainEff = SCOP (voor warmtepomp) of η (voor ketel) of 1 (voor direct elektrisch)
- auxFrac = aandeel bijverwarming (0-90%)
```

### Tapwater

```
dhwThermal = (personen × douches/dag × liters × 365 × (40-12) × 4.186) / 3600  [kWh]
dhwInput   = dhwThermal / dhwEff
```

### DPE-classificatie (uit V1 energiekompas)

```
kWh_m2 = totaalVerbruikKwh / woonoppervlak

| Letter | Max kWh/m²/jaar | Kleur    |
|--------|----------------|----------|
| A      | 70             | #319834  |
| B      | 110            | #33cc31  |
| C      | 180            | #cbfc32  |
| D      | 250            | #fbfe06  |
| E      | 330            | #fbcc05  |
| F      | 420            | #f66c02  |
| G      | ∞              | #fc0205  |

Verhuurverboden:
- G: sinds 1-1-2025
- F: vanaf 1-1-2028
- E: vanaf 1-1-2034
```

### DPE moet NIET alleen een letter geven, maar:

1. De exacte kWh/m²/jaar waarde
2. Hoeveel kWh/m² tot de volgende klasse (omhoog EN omlaag)
3. Welke maatregel(en) de DPE naar de volgende klasse tillen
4. Bij F/G: expliciet verhuurverbod-waarschuwing

### Subsidie-beslislogica (uit V1 energiebesparing-subsidie)

Elke subsidie krijgt een stoplicht-badge: groen/oranje/rood met uitleg WAAROM.

**MaPrimeRénov':**
- Rood als werk al gestart (uitvoering hoort NA acceptatie)
- Oranje als devis al getekend
- Groen als nog vóór start

**CEE / primes énergie:**
- Rood als devis al getekend (CEE vereist inschrijving VÓÓR tekenen)
- Rood als woning < 2 jaar

**Éco-PTZ:**
- Rood als niet résidence principale
- Rood als woning < 2 jaar

**TVA 5,5%:**
- Rood als woning < 2 jaar
- Oranje als type werk onzeker

**Lokale steun:**
- Altijd oranje (variëert per gemeente)

### Geo-lookup (uit V1 subsidie tool)

Gebruikt `https://geo.api.gouv.fr/communes?codePostal={cp}&fields=nom,code,departement,region,epci`

---

## KLIMAATZONES

```typescript
const ZONES = [
  { id: 'med',    name: 'Méditerranée (zacht)',           hdd: 1400, cdd: 700,  pv: 1450, pool_temp: 22, Tref: 12 },
  { id: 'ouest',  name: 'Zuid-West / Atlantisch',          hdd: 1900, cdd: 350,  pv: 1250, pool_temp: 20, Tref: 10 },
  { id: 'paris',  name: 'Noord / Parijs (Île-de-France)',  hdd: 2200, cdd: 250,  pv: 1150, pool_temp: 19, Tref: 7  },
  { id: 'centre', name: 'Centraal / Bourgogne',            hdd: 2500, cdd: 200,  pv: 1200, pool_temp: 19, Tref: 6  },
  { id: 'est',    name: 'Oost / Elzas-Lotharingen',        hdd: 2800, cdd: 150,  pv: 1150, pool_temp: 18, Tref: 5  },
  { id: 'mont',   name: 'Bergen (koel)',                    hdd: 3400, cdd:  50,  pv: 1100, pool_temp: 17, Tref: 2  },
];
```

### Département → Zone mapping

Gebruik de complete DEPT_ZONE mapping uit V1 energiekompas (alle ~100 departementen).
Postcode → eerste 2 cijfers → département → zone.

---

## FRANSE HUIZENMATRIX

8 woningtypes met elk:
- Typische U-waarden (muur, dak, vloer, ramen)
- ACH (luchtwisseling)
- Oppervlakte-ratio's (voor automatische schatting uit m²)
- Thermische massa score
- Isolatiescore
- Vochtadvies
- Waarschuwingen
- Link naar infofrankrijk.com bron

| Type | Periode | U-muur | U-dak | U-vloer | U-raam | ACH |
|------|---------|--------|-------|---------|--------|-----|
| La Longère / Le Mas | Vóór 1948 | 2.5 | 3.5 | 1.5 | 5.8 | 0.9 |
| Colombage / Vakwerk | Tot ~1900 | 1.5 | 2.5 | 1.2 | 5.8 | 0.7 |
| Le Pavillon Parpaing | 1950-1975 | 2.8 | 3.0 | 1.2 | 4.0 | 0.8 |
| Placo-Polystyrène | 1975-1990 | 0.8 | 1.0 | 0.8 | 2.9 | 0.6 |
| Traditioneel+ | 1990-2012 | 0.4 | 0.3 | 0.4 | 1.8 | 0.5 |
| RT2012 / RE2020 | Na 2012 | 0.2 | 0.15 | 0.2 | 1.2 | 0.3 |
| Appartement (oud) | Vóór 1975 | 2.0 | 0.5 | 0.5 | 4.0 | 0.6 |
| Appartement (recent) | Na 1975 | 0.6 | 0.3 | 0.3 | 2.0 | 0.5 |

Wanneer gebruiker een type selecteert: auto-fill U-waarden, ACH, en geschatte oppervlakken.
Gebruiker kan altijd handmatig overrulen.

---

## BRONVERWIJZINGEN

Elke berekening MOET traceerbaar zijn naar een bron. Deze bronnen zijn aanklikbaar in de tool.

| Onderwerp | Bron |
|-----------|------|
| Isolatie Franse huis | https://infofrankrijk.com/de-isolatie-van-het-franse-huis/ |
| MaPrimeRénov' | https://infofrankrijk.com/ma-prime-renov-in-frankrijk-voorwaarden-werking-en-aandachtspunten/ |
| CEE | https://infofrankrijk.com/cee-en-primes-energie-energiebesparingspremies-in-frankrijk-uitgelegd/ |
| Éco-PTZ | https://infofrankrijk.com/eco-ptz-renteloze-lening-voor-energierenovatie-in-frankrijk/ |
| TVA 5,5% | https://infofrankrijk.com/tva-a-55-bij-renovatie-in-frankrijk-wanneer-geldt-het-lage-btw-tarief/ |
| Lokale subsidies | https://infofrankrijk.com/lokale-subsidies-voor-energierenovatie-in-frankrijk-zo-vindt-u-wat-er-geldt/ |
| France Rénov' loket | https://france-renov.gouv.fr/preparer-projet/trouver-conseiller |
| RGE-vakman | https://france-renov.gouv.fr/annuaire-rge |

---

## GRONDSLAGEN-PANEEL

De tool MOET een inklapbaar "Grondslagen" paneel hebben dat toont:

```
WONING: La Longère (Vóór 1948)
ZONE: Méditerranée (1400 graaddagen)
OPPERVLAK: 120 m² × 1 verdieping = 300 m³

U-WAARDEN (W/m²·K)
Ramen: 5.8 (14 m²)    → bron: infofrankrijk.com/de-isolatie-van-het-franse-huis/
Dak:   3.5 (72 m²)
Muren: 2.5 (180 m²)
Vloer: 1.5 (72 m²)

WARMTEVERLIES
Htr:   UA = 1071 W/K
Hvent: 0.34 × 300 × 0.9 = 91.8 W/K
Htot:  1163 W/K

ENERGIE
Warmtevraag: 39.046 kWh/jaar
DPE: 325 kWh/m²/jaar → E
  Tot D: nog 75 kWh/m² besparen (= ~9.000 kWh)
  Maatregelen: dakisolatie (-40%), ramen HR++ (-15%)
```

---

## INTEGRATIES

### AI-Coach Widget (Fase 6 — NU bouwen)
Een zwevende [i] knop bij ELK invoerveld EN bij elke regel in de grondslagen.
Bij klik: roept de Anthropic API aan met de actuele context en geeft een korte, 
begrijpelijke uitleg in het Nederlands.

**Technisch:**
- Component: `src/components/CoachWidget.tsx`
- Roept `https://api.anthropic.com/v1/messages` aan (model: claude-sonnet-4-20250514)
- Geen API key nodig in de code (wordt al afgehandeld)
- Per element een prompt die bevat: veld-naam, huidige waarde, woningtype, context
- Maximaal 150 woorden antwoord
- Floating tooltip die opent bij klik op [i]

**Voorbeeld prompt:**
```
Je bent een Nederlandse energieadviseur. Leg in max 3 zinnen uit wat deze waarde 
betekent voor de gebruiker. Gebruik geen jargon. Geef praktisch advies.

Context: Woningtype: La Longère (1948), Zone: Méditerranée
Veld: Htr (transmissieverlies)
Waarde: 744,6 W/K
```

**Voorbeeld antwoord:**
"Uw woning verliest 744,6 Watt per graad temperatuurverschil via muren, dak, vloer 
en ramen. Dat is veel — vergelijkbaar met 7 olieradiatoren continu aan. De muren 
zijn de grootste bron (50%). Muurisolatie zou het meeste opleveren."

### DossierFrankrijk
De PDF-export moet een formaat hebben dat eenvoudig in DossierFrankrijk kan worden opgeslagen.
Toekomst: directe API-koppeling.

### PDF-generator
Moet een complete samenvatting genereren met:
- Woningprofiel + DPE-indicatie
- Kostenopsplitsing
- Subsidie-overzicht met stoplichten
- Berekeningsgrondslagen
- Bronverwijzingen
- Datum + disclaimer

---

## HUISSTIJL

```css
:root {
  --brand: #800000;
  --brand-light: rgba(128, 0, 0, 0.06);
  --brand-border: rgba(128, 0, 0, 0.16);
}
```

- **Lettertypes**: Poppins (h1, h2), Mulish (body text)
- **Regelafstand**: 1.8em
- **Primaire kleur**: #800000 met transparantie-variaties voor achtergronden en borders
- **DPE-kleuren**: officieel schema (#319834 t/m #fc0205)

---

## TECH STACK

- React 19 + TypeScript (strict mode)
- Vite als bundler
- TailwindCSS voor styling
- Vitest voor tests
- Deployment: Vercel (`base: '/'`)
- Geen jQuery, geen externe UI-frameworks

---

## TESTS

Elke engine-functie MOET unit tests hebben:

```
npm test          # Vitest
npm run build     # TypeScript + Vite build
npm run lint      # ESLint
```

Minimale testdekking:
- `compute.ts`: test met bekende invoer → verwachte kWh, kosten
- `dpe.ts`: test grenswaarden (70, 110, 180, 250, 330, 420)
- `subsidie-rules.ts`: test elke stoplicht-combinatie
- `tool-spec.ts`: test validatie per veld

---

## COMMIT CONVENTIE

```
feat: nieuwe functionaliteit
fix: bugfix
refactor: code-herstructurering
docs: documentatie
test: tests toevoegen/aanpassen
```

---

## WAT ER NU IS vs WAT ER MOET KOMEN

### Huidige staat (Fase 1-5 klaar, correcties nodig)
- Engine, data, state, stappen en rapport zijn gebouwd
- 125 tests, allemaal groen
- MAAR: oude tabs staan er nog in (Portaal/Snel/Expert/Subsidie)
- MAAR: energieprijzen zijn verouderd
- MAAR: rekenfout in totaalberekening (spookgetal)
- MAAR: rapport toont data voordat er genoeg invoer is
- MAAR: geen AI-coach tooltips
- MAAR: DPE wordt ten onrechte gepresenteerd als officieel
- Zie CORRECTIES FASE 6 voor alles wat nog moet

### Gewenste staat
- Eén stapsgewijze flow (5 stappen) voor invoer
- Eén rekenmotor met alle V1 diepte
- Eén doorlopend rapport met 6 secties (GEEN tabs)
- Floating € indicator die direct € effect toont bij elke wijziging
- DPE met uitleg en verbeteradvies
- Subsidie met stoplichten en timing, gekoppeld aan maatregelen
- Controleerbare grondslagen met bronverwijzingen
- Werkende PDF-export
- Coach-tooltips bij invoervelden

### BELANGRIJK: V1 repos zijn ALLEEN bronmateriaal
De V1 repos (warmteverlies-calculator, energiekompas-frankrijk, energiebesparing-subsidie) 
worden NIET gewijzigd. Ze dienen uitsluitend als specificatie voor de rekenmotor en logica.
Alle code wordt NIEUW geschreven in TypeScript/React voor energieportaal.

### Aanpak

**Fase 1: Engine** — Bouw de volledige rekenmotor in `src/engine/` met alle V1 logica. Schrijf tests. ✅ KLAAR
**Fase 2: Data** — Huizenmatrix, dept→zone mapping, bronverwijzingen in `src/data/`. ✅ KLAAR
**Fase 3: State** — ToolStateContext die de volledige invoer + resultaat beheert. ✅ KLAAR
**Fase 4: Stappen** — De 5 invoerstappen in `src/steps/`. ✅ KLAAR
**Fase 5: Rapport** — Het doorlopende rapport met 6 secties + FloatingEuro. ✅ KLAAR
**Fase 6: Correcties + AI-Coach** — Zie CORRECTIES hieronder.

Werk per fase. Commit per fase. Test per fase.

---

## CORRECTIES FASE 6 (URGENT)

### Deze correcties moeten ALLEMAAL in één ronde worden uitgevoerd.

### C1: Tabs verwijderen
Verwijder de VOLLEDIGE tabnavigatie in de header (Portaal / Snel / Expert / Subsidie).
Er is maar één flow: 5 stappen invoer → 1 doorlopend rapport. Geen tabs. Geen oude views.
Verwijder ook alle code die bij de oude tabs hoort (oude components, routes, etc).

### C2: Klimaatzone niet handmatig
Zodra een geldige postcode (5 cijfers) is ingevoerd:
- Zone wordt automatisch bepaald via dept→zone mapping
- GEEN dropdown meer voor klimaatzone
- GEEN stedenknoppen/snelknoppen
- Toon alleen: "Zone: Méditerranée (1400 graaddagen)" als bevestiging
- Less is more

### C3: Rapport bouwt progressief op
Het rapport rechts is LEEG totdat Stap 1 (Locatie + postcode) is voltooid.
Daarna toont het rapport alleen de secties waarvoor genoeg data is:
- Na Stap 1: Woningprofiel (locatie, zone)
- Na Stap 2: + woningtype, U-waarden
- Na Stap 3: + warmteverlies, DPE-indicatie
- Na Stap 4: + energieverbruik, kosten
- Na Stap 5: + subsidies, grondslagen compleet

Secties waarvoor nog geen data is, worden NIET getoond (geen lege placeholders).

### C4: FloatingEuro pas na Stap 3
De FloatingEuro balk mag pas verschijnen als er minimaal een warmteverliesberekening is
(na Stap 3: Isolatie). Daarvóór is er geen zinvolle €-waarde om te tonen.

### C5: Energieprijzen updaten
De standaard energieprijzen in `src/engine/constants.ts` moeten worden geupdate naar 
actuele waarden (februari 2026). De OUDE waarden zijn verouderd.

```typescript
// ENERGIEPRIJZEN — Bron: CRE / DGEC / Markt — februari 2026
// Gebruiker kan altijd handmatig aanpassen in Stap 5
const ENERGY_PRICES_DEFAULT = {
  elec:    0.1940,  // €/kWh — CRE Tarif Bleu Base feb 2026
  gas:     0.1051,  // €/kWh — CRE Prix Repère chauffage feb 2026 (≈ €1,05/m³)
  fioul:   1.18,    // €/L   — DGEC gemiddelde feb 2026
  pellet:  0.385,   // €/kg  — Propellet/SDES vrac feb 2026
  wood:    85,      // €/stère — marktgemiddelde 2025-2026
  propaan: 1.90,    // €/L   — marktgemiddelde 2026
};

// Conversie naar kWh (PCI)
const KWH_CONVERSION = {
  elec: 1,        // 1 kWh = 1 kWh
  gas: 10,        // 1 m³ ≈ 10 kWh
  fioul: 10,      // 1 L ≈ 10 kWh
  pellet: 4.8,    // 1 kg ≈ 4,8 kWh
  wood: 1800,     // 1 stère ≈ 1800 kWh
  propaan: 7.1,   // 1 L ≈ 7,1 kWh
};
```

### C6: Rekenfout in totaalberekening fixen
Het totaal in het rapport en de grondslagen moet TRANSPARANT optellen.
Elke post moet expliciet zichtbaar zijn:

```
ENERGIEVERBRUIK (kWh/jaar)
  Ruimteverwarming (final):  53.810 kWh  (thermisch: 48.429 / η=0,9)
  Tapwater DHW (final):       1.320 kWh  (thermisch: 1.188 / η=0,9)
  Basiselektriciteit:         2.500 kWh  (huishouden)
  [EV laden]:                     0 kWh  (niet ingevuld)
  [Zwembad]:                      0 kWh  (niet ingevuld)
  [Koeling]:                      0 kWh  (niet ingevuld)
  ─────────────────────────────────────
  TOTAAL:                    57.630 kWh
```

Geen spookgetallen. Elke kWh moet herleidbaar zijn.

### C7: HDD presenteren als gewogen HDD
In de grondslagen, NIET twee losse regels voor aanwezig/afwezig.
WEL: duidelijk gewogen berekening:

```
GRAADDAGEN
  Basis HDD zone: 2200 K·d
  Setpoint aanwezig: 20°C (82% van jaar) → HDD_corr = 2600
  Setpoint afwezig:  16°C (18% van jaar) → HDD_corr = 1800
  Gewogen HDD_eff = 2600 × 0,82 + 1800 × 0,18 = 2.456 K·d
```

### C8: "DPE" hernoemen naar "DPE-indicatie"
OVERAL in de tool — rapport, grondslagen, FloatingEuro, PDF — moet staan:
- "DPE-indicatie" (niet "DPE" of "DPE-schatting")
- Met disclaimer: "Indicatieve berekening op basis van invoergegevens. 
  Geen officiële DPE-audit. Een gecertificeerde DPE kan afwijken."

### C9: Grondslagen uitbreiden
De grondslagen moeten ALLES tonen, inclusief:
- Gebruikte energieprijzen per energiesoort (€/kWh, bron, datum)
- Conversie kWh↔eenheid voor elke brandstof
- Elke post in de kostenberekening: kWh × prijs = € per categorie
- Totale kosten per jaar EN per maand

### C10: AI-Coach Widget bouwen
Bouw de CoachWidget component zoals beschreven in de INTEGRATIES sectie hierboven.
- [i] knop bij elk invoerveld in Stap 1-5
- [i] knop bij elke regel in de grondslagen
- Bij klik: API-call naar Claude met context → korte uitleg in tooltip
- Geen volledige chatbot, alleen gerichte uitleg per element
