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

## INTEGRATIES (TOEKOMSTIG)

### Le Bricoleur (Café Claude)
Een zwevende [i] knop bij elk invoerveld die context-gevoelige uitleg geeft.
Technisch: een CoachTip component dat per veld-ID een tooltip toont.
Toekomst: koppeling met Café Claude API voor dynamische uitleg.

### DossierFrankrijk
De PDF-export moet een formaat hebben dat eenvoudig in DossierFrankrijk kan worden opgeslagen.
Toekomst: directe API-koppeling.

### PDF-generator
Moet een complete samenvatting genereren met:
- Woningprofiel + DPE
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

### Huidige staat (slecht)
- 3 losse tabbladen die elk hun eigen berekening doen
- Uitgeklede engine zonder de diepte van de V1 tools
- Geen huizenmatrix
- Geen DPE-schatting
- Geen subsidie-logica
- Geen grondslagen-paneel
- Geen PDF-export

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

**Fase 1: Engine** — Bouw de volledige rekenmotor in `src/engine/` met alle V1 logica. Schrijf tests.
**Fase 2: Data** — Huizenmatrix, dept→zone mapping, bronverwijzingen in `src/data/`.
**Fase 3: State** — ToolStateContext die de volledige invoer + resultaat beheert.
**Fase 4: Stappen** — De 5 invoerstappen in `src/steps/`.
**Fase 5: Rapport** — Het doorlopende rapport met 6 secties + FloatingEuro.
**Fase 6: Extras** — PDF-export, coach-tooltips.

Werk per fase. Commit per fase. Test per fase.
