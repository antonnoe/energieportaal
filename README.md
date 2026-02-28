# EnergiePortaal — 3‑in‑1 Suite

EnergiePortaal is een moderne, mobile‑first webportal die drie bestaande tools samenbrengt in één consistente ervaring:

1. **Snel advies (Energiekompas)** — snelle scenario‑inschatting voor energie & DPE‑indicatie  
2. **Expertmodus (Warmteverlies-calculator)** — gedetailleerde woningmodellering  
3. **Subsidie/finance** — subsidie- en fiscale regelingen checker

![EnergiePortaal screenshot](https://github.com/user-attachments/assets/542ab8ba-234d-433e-9c20-c561bcfbfca6)

## Live demo

🌐 [antonnoe.github.io/energieportaal/](https://antonnoe.github.io/energieportaal/)

## Ontwikkelen

```bash
npm install
npm run dev    # start dev server op http://localhost:5173
npm run build  # productiebuild
npm run lint   # linting
npm test       # vitest unit tests
```

## Stack

- **Vite + React + TypeScript** — moderne, snelle build-tooling
- **TailwindCSS v4** — utility-first CSS, Poppins/Mulish typografie, primaire kleur `#800000`
- **jsPDF** — client-side PDF-export
- **Vercel** — deployment via `vercel.json` met SPA-routing

## Architectuur

```
src/
├── engine/
│   ├── tool-spec.ts        # Velddefinities & validatieregels (single source of truth)
│   └── calculations.ts     # Pure rekenfuncties (DPE, kWh, CO₂, kosten)
├── context/
│   └── ToolStateContext.tsx # Globale toolState (gedeeld over alle flows)
├── components/
│   ├── Navigation.tsx       # 3-tab navigatie
│   ├── CoachPanel.tsx       # Rules-only coach (meekijk-icoon + paneel)
│   ├── ResultWidget.tsx     # Live resultatenwidget
│   └── PdfExport.tsx        # Branded PDF-rapport
└── pages/
    ├── SnelAdvies.tsx       # Snel advies flow
    ├── Expertmodus.tsx      # Expertmodus flow
    └── SubsidieFinance.tsx  # Subsidies & finance overzicht
```

## Belangrijkste uitgangspunten

- **Één UI/UX**, één thema (primaire kleur `#800000`, typografie Poppins/Mulish)
- **Één centrale state** (`toolState`) gedeeld tussen alle flows
- **Tool-spec driven**: velden, validatie en stappen komen uit `engine/tool-spec.ts`
- **Rules-only coach** (geen LLM in MVP): zichtbaar als meekijk-icoon, helpt op klik of bij fouten
- **PDF export**: client-side, branded rapport met disclaimer + link naar DPE-professional

## Disclaimer (voor PDF/rapporten)

> Indicatie, geen officiële DPE; vind professional via https://france-renov.gouv.fr/espaces-conseil-fr/recherche

## Legacy tools (referentie)

- Energiekompas (legacy): https://github.com/antonnoe/energiekompas-frankrijk  
- Warmteverlies-calculator (legacy): https://github.com/antonnoe/warmteverlies-calculator  
- Subsidie-tool (legacy): https://github.com/antonnoe/energiebesparing-subsidie-en-fiscale-regelingen

