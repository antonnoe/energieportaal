# Copilot Instructions — EnergiePortaal

## Projectoverzicht

EnergiePortaal is een **Vite + React + TypeScript** single-page applicatie (SPA) die drie energiehulpmiddelen voor Franse woningbezitters bundelt:

1. **Snel advies (Energiekompas)** — snelle DPE-indicatie op basis van een paar basisvelden
2. **Expertmodus (Warmteverlies-calculator)** — gedetailleerde woningmodellering (schil, ventilatie, WP, PV, EV)
3. **Subsidie/finance** — interactieve checker voor MaPrimeRénov', CEE en fiscale voordelen

Primaire kleur: `#800000` (donkerrood). Typografie: Poppins (koppen) / Mulish (body).

---

## Stack & tooling

| Tool | Versie | Gebruik |
|------|--------|---------|
| Vite | ^7 | Dev server & productiebuild |
| React | ^19 | UI |
| TypeScript | ~5.9 | Type-checking |
| TailwindCSS v4 | ^4 | Utility-first CSS via `@tailwindcss/vite` plugin |
| jsPDF | ^4 | Client-side PDF-export |
| ESLint | ^9 | Linting |

---

## Ontwikkelomgeving opzetten

```bash
# 1. Installeer dependencies
npm install

# 2. Start de dev server
npm run dev
# → http://localhost:5173/energieportaal/
```

> **Let op:** `vite.config.ts` zet `base: '/energieportaal/'`. Bezoek altijd het pad `/energieportaal/` tijdens lokaal testen.

---

## Live testen

### Lokaal (aanbevolen voor ontwikkeling)

```bash
npm run dev
# Open http://localhost:5173/energieportaal/ in de browser
```

Wijzigingen zijn direct zichtbaar via HMR (Hot Module Replacement).

### Productiepreview (lokaal)

```bash
npm run build    # TypeScript compileren + Vite productiebuild → dist/
npm run preview  # Serve de dist/ map op http://localhost:4173/energieportaal/
```

### GitHub Pages (gedeployed)

Bij elke push naar `main` bouwt de GitHub Actions workflow (`.github/workflows/pages.yml`) de app en deployt deze naar:

```
https://antonnoe.github.io/energieportaal/
```

Controleer de status van de laatste deploy via het **Actions**-tabblad in de repository.

---

## Codestructuur

```
src/
├── engine/
│   ├── tool-spec.ts        # Velddefinities & validatieregels (SINGLE SOURCE OF TRUTH)
│   ├── calculations.ts     # Pure rekenfuncties (DPE, kWh, CO₂, kosten)
│   ├── expert/             # Expert-modus berekeningsmodules
│   └── subsidie/           # Subsidie-checker logica
├── context/
│   └── ToolStateContext.tsx # Globale toolState (gedeeld door alle flows)
├── components/
│   ├── Navigation.tsx       # 3-tab navigatie
│   ├── CoachPanel.tsx       # Rules-only coach (meekijk-icoon + paneel)
│   ├── ResultWidget.tsx     # Live resultatenwidget (Snel advies)
│   ├── ExpertResultWidget.tsx # Live resultatenwidget (Expert)
│   └── PdfExport.tsx        # Branded PDF-rapport (jsPDF)
└── pages/
    ├── SnelAdvies.tsx       # Snel advies flow
    ├── Expertmodus.tsx      # Expertmodus flow
    └── SubsidieFinance.tsx  # Subsidies & finance overzicht
```

---

## Conventies

### State management

- Alle veldwaarden worden als `string` opgeslagen in `ToolState` (zie `ToolStateContext.tsx`).
- Gebruik `setField(key, value)` om een enkel veld bij te werken; nooit direct de state muteren.
- `DEFAULT_STATE` definieert de initiële waarden voor alle velden.

### Formuliervelden toevoegen

Voeg nieuwe velden toe aan `snelAdviesFields` in `src/engine/tool-spec.ts`. De UI rendert velden automatisch op basis van deze array.

### Styling

- **TailwindCSS v4**: gebruik `@import "tailwindcss"` en `@theme` in CSS; geen `tailwind.config.js`.
- Gebruik `bg-{color}-50 border-{color}-200 rounded-xl p-3 text-sm text-{color}-800` voor contextuele notificaties/alerts.
- Alle externe links gebruiken `target="_blank" rel="noopener noreferrer"`.

### TypeScript

- Gebruik strikte typen; vermijd `any`.
- Exporteer interfaces en types vanuit het bestand waar ze het meest relevant zijn.

---

## Beschikbare scripts

```bash
npm run dev      # Start dev server (HMR)
npm run build    # Productiebuild naar dist/
npm run preview  # Serve dist/ lokaal
npm run lint     # ESLint
```

---

## Disclaimer (voor rapporten/PDF)

> Indicatie, geen officiële DPE; vind een professional via https://france-renov.gouv.fr/espaces-conseil-fr/recherche
