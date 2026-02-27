````markdown name=README.md
# EnergiePortaal — 3‑in‑1 Suite

EnergiePortaal is een moderne, mobile‑first webportal die drie bestaande tools samenbrengt in één consistente ervaring:

1. **Snel advies (Energiekompas)** — snelle scenario‑inschatting voor energie & DPE‑indicatie  
2. **Expertmodus (Warmteverlies-calculator)** — gedetailleerde woningmodellering  
3. **Subsidie/finance** — subsidie- en fiscale regelingen checker

## Status

Deze repository is **net geïnitialiseerd**. De MVP wordt gebouwd in de nieuwe stack (Vite + React + TailwindCSS) en zal stapsgewijs de rekenkernen en data uit de legacy tools hergebruiken (als modules), zonder die legacy repos verder aan te passen.

## Belangrijkste uitgangspunten

- **Één UI/UX**, één thema (o.a. primaire kleur `#800000`, typografie Poppins/Mulish)
- **Één centrale state** (`toolState`) gedeeld tussen alle flows
- **Tool-spec driven**: velden, validatie en stappen komen uit een centrale `tool-spec`
- **Rules-only coach** (geen LLM in MVP): zichtbaar als meekijk-icoon, helpt op klik of bij fouten
- **PDF export**: client-side, branded rapport met disclaimer + link naar DPE-professional

Disclaimer (voor PDF/rapporten):  
> indicatie, geen officiële DPE; vind professional via https://france-renov.gouv.fr/espaces-conseil-fr/recherche

## Development (komt in MVP PR)

Na de eerste MVP PR:

```bash
npm install
npm run dev
npm run build
```

## Legacy tools (referentie)

- Energiekompas (legacy): https://github.com/antonnoe/energiekompas-frankrijk  
- Warmteverlies-calculator (legacy): https://github.com/antonnoe/warmteverlies-calculator  
- Subsidie-tool (legacy): https://github.com/antonnoe/energiebesparing-subsidie-en-fiscale-regelingen  
````
