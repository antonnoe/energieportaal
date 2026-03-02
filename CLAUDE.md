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
- **Push naar main** tenzij expliciet anders gevraagd. Geen aparte branches.

---

## PROJECT OVERZICHT

**EnergiePortaal** is één geïntegreerde energietool voor Nederlandse huiseigenaren in Frankrijk.
URL: energieportaal.vercel.app
Eigenaar: Anton Noë / InfoFrankrijk.com / Nederlanders.fr

### Oorsprong

Dit project vervangt 4 losstaande V1 tools die overlap hadden:

| V1 Repo | Wat het deed | Wat we overnemen |
|---------|-------------|-----------------|
| `warmteverlies-calculator` | Gedetailleerde UA-berekening, SCOP/η, HDD, ventilatie, PV, EV, zwembad, koeling | **De complete rekenmotor** |
| `energiekompas-frankrijk` | Franse huizenmatrix, DPE-schatting, dept→zone mapping, stookgedrag, subsidie-hints | **Huizenmatrix, DPE-logica, dept→zone** |
| `energiebesparing-subsidie` | Subsidie-checker met geo.api.gouv.fr, beslisregels MaPrimeRénov'/CEE/Éco-PTZ/TVA | **Subsidie-beslislogica** |
| `Energiecalculator-Frankrijk` | Vereenvoudigde wrapper | Niet nodig |

### Doel

Eén tool, één rekenmotor, één doorlopend rapport. Geen tabs, geen losse tools.
Invoer links/boven, rapport rechts/onder. Floating € indicator pas zichtbaar na voldoende invoer.

---

## ARCHITECTUUR

### Kernprincipe: Eén rekenmotor → meerdere outputs

```
INVOER (stapsgewijs)
  │
  ├─ Stap 1: Locatie (postcode → zone via dept-mapping)
  ├─ Stap 2: Woningtype (Franse huizenmatrix → auto U-waarden)
  ├─ Stap 3: Isolatie (klikbare niveaus + expert override)
  ├─ Stap 4: Energie (verwarming, tapwater, PV, EV, zwembad)
  └─ Stap 5: Financieel (energieprijzen, stookgedrag)
  │
  ▼
REKENMOTOR (engine/)
  │ Eén pure functie: invoer → volledig resultaatobject + debug
  │
  ▼
ÉÉN DOORLOPEND RAPPORT — progressief grijs→kleur
  │
  │  Niveau 0: Leeg ("Vul uw postcode in")
  │  Niveau 1: Alleen klimaatblok (na postcode), rest grijs
  │  Niveau 2: + Woningprofiel + U-waarden (na woningtype), rest grijs
  │  Niveau 3: Alles in kleur (na isolatie + verwarming)
  │
  ├─ Sectie 1: Woningprofiel
  ├─ Sectie 2: Energieprofiel (warmteverlies, verbruik, kosten)
  ├─ Sectie 3: DPE-indicatie (letter + kWh/m² + uitleg + verhuurverbod)
  ├─ Sectie 4: Besparingsadvies (maatregelen + terugverdientijden)
  ├─ Sectie 5: Subsidie/Finance (indicatief, zonder inkomensvraag)
  └─ Sectie 6: Grondslagen (alle tussenstappen, formules, bronnen)
  │
  │  FLOATING € (sticky, alleen zichtbaar bij Niveau 3)
  │  DPE-badge | Energiekosten | Mogelijke besparing | CO₂
```

### Directory structuur (actueel)

```
energieportaal/
├── CLAUDE.md                          ← dit bestand
├── api/
│   └── ai-advice.ts                  ← Vercel serverless function (proxied Anthropic API)
├── public/
│   └── energieportaal-ai-adviseur.md  ← System prompt voor AI-adviseur
├── vite.config.ts
├── package.json
├── vercel.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx                        ← Split layout + progressief rapport + mobile toggle
    ├── index.css                      ← Tailwind + huisstijl
    │
    ├── engine/                        ← PURE REKENLOGICA, GEEN UI
    │   ├── constants.ts               ← Zones, prijzen feb 2026, isolatieniveaus, DPE-drempels
    │   ├── types.ts                   ← TypeScript types
    │   ├── tool-spec.ts               ← Velddefinities met validatie
    │   ├── compute.ts                 ← Hoofdberekening: invoer → resultaat + debug
    │   ├── dpe.ts                     ← DPE-classificatie + bandbreedte
    │   ├── subsidie-rules.ts          ← Beslislogica subsidies (stoplicht)
    │   └── savings.ts                 ← Besparingsscenario's + terugverdientijden
    │
    ├── data/
    │   ├── huizen-matrix.ts           ← 9 Franse woningtypes (incl. Maison en Pierre)
    │   ├── dept-zone-map.ts           ← Département → klimaatzone mapping
    │   └── sources.ts                 ← Bronverwijzingen
    │
    ├── context/
    │   └── ToolStateContext.tsx        ← Gedeelde state voor alle stappen en outputs
    │
    ├── components/
    │   └── AIAdviseur.tsx             ← [?] knop met echte API-calls naar /api/ai-advice
    │
    ├── steps/
    │   ├── Step1Locatie.tsx
    │   ├── Step2Woningtype.tsx
    │   ├── Step3Isolatie.tsx           ← Klikbare isolatieniveaus + expert override
    │   ├── Step4Energie.tsx
    │   └── Step5Financieel.tsx
    │
    └── report/
        ├── Woningprofiel.tsx
        ├── Energieprofiel.tsx
        ├── DPESchatting.tsx
        ├── Besparingsadvies.tsx
        ├── SubsidieCheck.tsx
        ├── Grondslagen.tsx
        └── FloatingEuro.tsx           ← Sticky, alleen zichtbaar bij Niveau 3
```

---

## DE REKENMOTOR — SPECIFICATIES

### Warmteverlies

```
UA = Σ(A_i × U_i)  voor muur, dak, vloer, ramen
Hvent = 0.34 × volume × ACH
HventEff = Hvent × (1 - η_HRV)  als WTW aanwezig, anders Hvent
H = UA + HventEff

HDD_present = zone.hdd × max(0, (setpoint - Tref) / (18 - Tref))
HDD_away    = zone.hdd × max(0, (awaySetpoint - Tref) / (18 - Tref))
HDD_eff     = HDD_present × fracPresent + HDD_away × fracAway

heatDemand = H × HDD_eff × 24 / 1000
```

### Verwarmingskosten

```
mainInput = heatDemand × mainFrac / mainEff
auxInput  = heatDemand × auxFrac / auxEff

waarbij:
- mainEff = SCOP (warmtepomp) of η (ketel) of 1 (direct elektrisch)
- auxFrac = aandeel bijverwarming (0-90%)
```

### Tapwater

```
dhwThermal = (personen × douches/dag × liters × 365 × ΔT × 4.186) / 3600  [kWh]
dhwInput   = dhwThermal / dhwEff
```

### DPE-indicatie (NIET "DPE")

```
DPE-verbruik = verwarming_final + DHW_final + basiselektriciteit
NIET meenemen: EV, zwembad, koeling (die staan WEL in de kostentabel)

kWh_m2 = DPE-verbruik / woonoppervlak

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

ALTIJD disclaimer: "Indicatieve berekening op basis van uw invoer en finale energie.
Geen officiële DPE-audit. Een gecertificeerde DPE classificeert op dubbele drempels
(energie én broeikasgassen), gebruikt conventies, en rekent in primaire energie."
```

### Subsidie-beslislogica

Indicatief — ZONDER inkomensvraag. Geen bedragen berekenen.
Verwijzing naar mesaides.france-renov.gouv.fr voor exacte berekening.
Verwijzing naar https://infofrankrijk.com/maprimerenov-2026-bezint-eer-ge-begint/

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

---

## FRANSE HUIZENMATRIX — 9 WONINGTYPES

| id | Naam (zoals getoond) | Periode | U-muur | U-dak | U-vloer | U-raam | ACH |
|----|---------------------|---------|--------|-------|---------|--------|-----|
| longere | La Longère / Le Mas | Vóór 1948 | 2.5 | 3.5 | 1.5 | 5.8 | 0.9 |
| colombage | Colombage / Vakwerk | Vóór ~1900 | 1.5 | 2.5 | 1.2 | 5.8 | 0.7 |
| pierre | Maison en Pierre | Vóór 1948 | 2.0 | 2.5 | 1.2 | 4.5 | 0.6 |
| pavillon | Pavillon Parpaing | 1950–1975 | 2.8 | 3.0 | 1.2 | 4.0 | 0.8 |
| placo | Maison Placo (1975–1990) | 1975–1990 | 0.8 | 1.0 | 0.8 | 2.9 | 0.6 |
| traditioneel-plus | Maison Traditionnelle | 1990–2012 | 0.4 | 0.3 | 0.4 | 1.8 | 0.5 |
| rt2012 | RT2012 / RE2020 | Vanaf 2012 | 0.2 | 0.15 | 0.2 | 1.2 | 0.3 |
| appartement-oud | Appartement (vóór 1975) | Vóór 1975 | 2.0 | 0.5 | 0.5 | 4.0 | 0.6 |
| appartement-recent | Appartement (na 1975) | Na 1975 | 0.6 | 0.3 | 0.3 | 2.0 | 0.5 |

**BELANGRIJK:** De 'naam' in de tabel is EXACT wat de gebruiker ziet. Gebruik Franse benamingen.
Geen vertalingen als "Het Langhuis", "Betonnen blokkenpaviljoen" of "Stenen Huis".

---

## ENERGIEPRIJZEN — februari 2026

```typescript
// Alle prijzen in €/kWh (omgerekend via KWH_CONVERSION)
const DEFAULT_PRIJZEN = {
  gas: 0.1051,        // CRE Prix Repère chauffage, feb 2026
  stookolie: 0.118,   // DGEC wekelijks gemiddelde (€1,18/L ÷ 10 kWh/L)
  warmtepomp: 0.1940, // CRE TRV Base 6kVA TTC, feb 2026
  elektrisch: 0.1940, // CRE TRV Base 6kVA TTC, feb 2026
  hout: 0.047,        // marktgemiddelde (€85/stère ÷ 1800 kWh/stère)
  propaan: 0.268,     // marktgemiddelde (€1,90/L ÷ 7,1 kWh/L)
};

const DEFAULT_EXPORT_TARIEF = 0.04; // S21 surplus ≤9 kWc, Q1 2026

const KWH_CONVERSION = {
  elec: 1, gas: 10, fioul: 10, pellet: 4.8, wood: 1800, propaan: 7.1,
};
```

---

## BRONVERWIJZINGEN

| Onderwerp | Bron |
|-----------|------|
| Isolatie Franse huis | https://infofrankrijk.com/de-isolatie-van-het-franse-huis/ |
| MaPrimeRénov' 2026 | https://infofrankrijk.com/maprimerenov-2026-bezint-eer-ge-begint/ |
| CEE | https://infofrankrijk.com/cee-en-primes-energie-energiebesparingspremies-in-frankrijk-uitgelegd/ |
| Éco-PTZ | https://infofrankrijk.com/eco-ptz-renteloze-lening-voor-energierenovatie-in-frankrijk/ |
| TVA 5,5% | https://infofrankrijk.com/tva-a-55-bij-renovatie-in-frankrijk-wanneer-geldt-het-lage-btw-tarief/ |
| Lokale subsidies | https://infofrankrijk.com/lokale-subsidies-voor-energierenovatie-in-frankrijk-zo-vindt-u-wat-er-geldt/ |
| France Rénov' loket | https://france-renov.gouv.fr/preparer-projet/trouver-conseiller |
| RGE-vakman | https://france-renov.gouv.fr/annuaire-rge |

---

## AI-ADVISEUR (EMBEDDED)

De AIAdviseur component (`src/components/AIAdviseur.tsx`) vervangt alle statische tooltips.

### Architectuur

```
Gebruiker klikt [?] knop
  → AIAdviseur.tsx bouwt prompt met actuele context
  → POST /api/ai-advice (Vercel serverless function)
  → api/ai-advice.ts proxied naar Anthropic API met ANTHROPIC_API_KEY
  → System prompt uit public/energieportaal-ai-adviseur.md
  → Antwoord in tooltip (max 4 zinnen, Nederlands)
```

### Vereisten

- **ANTHROPIC_API_KEY** moet in Vercel Environment Variables staan
- Model: claude-sonnet-4-5-20250929
- [?] knop bij ALLE invoervelden in Stap 1-5
- [?] knop bij ALLE rapportsecties (Woningprofiel, Energieprofiel, DPE, etc.)
- In-memory cache per sessie: dezelfde vraag bij dezelfde state = instant antwoord
- Tooltip moet altijd volledig zichtbaar zijn (smart positioning: boven/onder/links/rechts)
- Geen CoachWidget meer — AIAdviseur is de ENIGE tooltip-component

### Oude bestanden die NIET meer gebruikt mogen worden

- `src/components/CoachWidget.tsx` — VERVANGEN door AIAdviseur
- `src/components/CoachPanel.tsx` — VERVANGEN door AIAdviseur

---

## PROGRESSIEF RAPPORT — 4 NIVEAUS

Het rapport rechts bouwt geleidelijk op van grijs naar kleur.

### Niveau 0 — Niets ingevuld
- Tekst: "Vul uw postcode in om de rapportage te starten"
- FloatingEuro: VERBORGEN

### Niveau 1 — Alleen postcode (5 cijfers)
- Klimaatblok in kleur: "Zone: {naam} ({hdd} graaddagen) · Dept {nr} · PV {pv} kWh/kWp · Ref. {Tref} °C"
- Daaronder: grijze placeholders (opacity 0.35, grayscale) met tekst "Kies uw woningtype"
- GEEN U-waarden, GEEN getallen, GEEN DPE, GEEN kosten
- FloatingEuro: VERBORGEN

### Niveau 2 — Woningtype gekozen + oppervlak
- Klimaatblok: in kleur
- Woningprofiel: IN KLEUR (type, locatie, m², volume, HDD)
- U-waarden kaarten: IN KLEUR (standaardwaarden van het gekozen type)
- Overige secties: GRIJS met tekst "Vul isolatie en verwarming in"
- FloatingEuro: VERBORGEN

### Niveau 3 — Isolatie + verwarming ingevuld
- ALLES in kleur. Alle 6 secties actief.
- FloatingEuro: ZICHTBAAR
- Subsidie: alleen als currentStep >= 5

### CSS transitie
- opacity 0.35 + filter grayscale(1) → opacity 1 + filter none
- transition: all 0.4s ease

---

## INTEGRATIES (Ronde 4b — NOG TE BOUWEN)

### PDF-rapportage (9 hoofdstukken)

PDF-export met een complete samenvatting, gestructureerd in 9 hoofdstukken:

1. **Woningprofiel** — type met kenmerken, aandachtspunten, U-waarden tabel, uitgebreide tekstuele uitleg
2. **Locatie & Klimaat** — zone, HDD, PV-opbrengst, ref. temperatuur, uitgebreide uitleg
3. **Isolatie & Warmteverlies** — U-waarden, transmissie/ventilatieverlies, uitleg
4. **DPE-indicatie** — grafische weergave, letter + kWh/m², waarom deze klasse, hoe verbeteren, disclaimer
5. **Overig verbruik** — EV, zwembad, koeling (buiten DPE, wél in kosten), uitleg
6. **Stookgedrag** — aanwezig/afwezig, setpoints, tips
7. **Zonnepanelen** — opbrengst, zelfverbruik, export, financieel effect (GEEN DPE-invloed)
8. **Subsidies** — indicatief zonder inkomensvraag, verwijzing naar infofrankrijk.com/maprimerenov-2026-bezint-eer-ge-begint/ en mesaides.france-renov.gouv.fr
9. **Aanbevelingen** — prioriteitenlijst gesorteerd op terugverdientijd, low hanging fruit

### DossierFrankrijk-koppeling

De tool draait in een iframe op InfoFrankrijk.com. Opslaan via postMessage:

```javascript
var data = {
  type: 'saveToDossier',
  title: 'EnergiePortaal: La Longère 120m² | DPE F | €4.320/jaar',
  summary: '... volledige rapportage als tekst ...',
  source: 'energieportaal'
};
if (window.parent !== window) {
  window.parent.postMessage(data, '*');
}
```

Tool slug: `energieportaal`
Knop: "📁 Opslaan in Dossier" in huisstijl (#800000)

---

## INVOERVALIDATIE

### V7: Minimum/maximum oppervlak
- Minimum: 20 m². Onder 20: waarschuwing + niet doorrekenen.
- Maximum: 1000 m². Boven 1000: waarschuwing + niet doorrekenen.

### V8: Fracties aanwezig + afwezig
- fracPresent + fracAway ≤ 1.0 altijd.
- Als < 1.0: verschil is "leegstand" (geen verwarming). Expliciet tonen in grondslagen.
- Als > 1.0: foutmelding, niet doorrekenen.

### V9: DHW op hout/pellet waarschuwing
- Als DHW-type = hout of pellet: AIAdviseur waarschuwing tonen.
- Wél toestaan (bouilleur bestaat), maar markeren als uitzonderlijk.

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
- **Primaire kleur**: #800000 met transparantie-variaties
- **DPE-kleuren**: officieel schema (#319834 t/m #fc0205)

---

## TECH STACK

- React 19 + TypeScript (strict mode)
- Vite als bundler
- TailwindCSS voor styling
- Vitest voor tests
- Deployment: Vercel (`base: '/'`)
- Geen jQuery, geen externe UI-frameworks
- Anthropic API via Vercel serverless function (ANTHROPIC_API_KEY in env vars)

---

## TESTS

```
npm test          # Vitest
npm run build     # TypeScript + Vite build
```

---

## HUIDIGE STAAT (2 maart 2026)

### ✅ Klaar
- Engine: compute, dpe, savings, subsidie-rules, tool-spec (124+ tests groen)
- Data: 9 woningtypes (incl. Maison en Pierre), dept→zone, sources
- State: ToolStateContext met auto-compute
- 5 invoerstappen met klikbare isolatieniveaus
- 6 rapportsecties
- FloatingEuro + mobile toggle
- AIAdviseur component + Vercel serverless function + system prompt
- Energieprijzen feb 2026 (0,1940 elektra, 0,04 PV-export, 1800 kWh/stère hout)
- EV uitgesloten uit DPE-indicatie
- Gewogen HDD_eff in grondslagen

### ❌ Nog te fixen (Ronde 4a bugs)
- Rapport toont fictieve waarden te vroeg (moet 4-niveaus grijs→kleur zijn)
- Woningnamen zijn vertaald ipv Frans ("Het Langhuis" → "La Longère")
- Periodeaanduidingen inconsistent ("Dat jaar 2012" → "Vanaf 2012")
- AI-tooltip valt buiten scherm (CSS positioning)
- AI-cache niet merkbaar bij tweede klik
- AIAdviseur alleen op 2 plekken — moet overal (alle Steps + alle rapportsecties)

### ❌ Nog te bouwen (Ronde 4b)
- PDF-rapportage (9 hoofdstukken)
- DossierFrankrijk-koppeling (postMessage)
- "📁 Opslaan in Dossier" knop
