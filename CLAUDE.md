# CLAUDE.md — EnergiePortaal

## Project Overview

EnergiePortaal is a client-side React SPA combining three energy advisory tools for French housing, built for Dutch-speaking users:

1. **Snel Advies** (Energiekompas) — Quick scenario estimation
2. **Expertmodus** (Warmteverlies-calculator) — Detailed heat-loss modeling (EN ISO 13790)
3. **Subsidie/Finance** — French subsidy eligibility checker (MaPrimeRénov', CEE, Éco-PTZ, TVA 5.5%)

Originally three separate repos, now merged into one:
- `warmteverlies-calculator` → Expert mode
- `energiebesparing-subsidie-en-fiscale-regelingen` → Subsidie/Finance
- `Energiecalculator-Frankrijk-door-Nederlanders.fr` → Snel advies

**Tech stack:** React 19 · TypeScript 5.9 (strict) · Vite 7 · TailwindCSS v4 · Vitest · jsPDF

**No backend/database** — all logic is client-side. UI language: Dutch. Code: English.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:5173
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run preview      # Preview production build
```

## Architecture

```
src/
├── engine/                        # Pure calculation functions (no side effects)
│   ├── tool-spec.ts               # Field definitions & validation (single source of truth)
│   ├── calculations.ts            # Quick energy estimation
│   ├── expert/heatLoss.ts         # Heat-loss engine (UA, Qvent, HDD, DPE)
│   └── subsidie/rules.ts          # Subsidy eligibility rule engine
├── context/
│   └── ToolStateContext.tsx        # Single global React Context state
├── components/
│   ├── Navigation.tsx             # 3-tab navigation bar
│   ├── CoachPanel.tsx             # Rules-based help sidebar
│   ├── ResultWidget.tsx           # Live results for Snel Advies
│   ├── ExpertResultWidget.tsx     # Detailed results for Expert mode
│   └── PdfExport.tsx              # Branded PDF generation (jsPDF)
├── pages/
│   ├── SnelAdvies.tsx             # Quick advice flow
│   ├── Expertmodus.tsx            # Expert mode flow
│   └── SubsidieFinance.tsx        # Subsidie/Finance flow
├── App.tsx                        # Root component (ToolStateProvider + tab routing)
├── main.tsx                       # React DOM entry point
└── index.css                      # Global styles + Tailwind @theme config
```

## Key Conventions

- **Single source of truth for fields:** All form fields are defined as `FieldDef[]` arrays in `engine/tool-spec.ts`. Validation uses `validateFields()` from the same file.
- **Shared state:** One global `ToolState` via React Context. Access with `useToolState()` hook → `{ toolState, setField, setActiveTab }`. All state values are strings; parse to numbers in calculation functions.
- **Pure calculations:** All functions in `engine/` are deterministic with no side effects. Memoize in components with `useMemo()`.
- **TypeScript strict mode:** No `any`. No unused locals/parameters. Use `Pick<>`, `Record<>`, and union types.
- **Styling:** TailwindCSS v4 utility classes. Primary color: `#800000`. Fonts: Poppins (headings), Mulish (body). Defined in `index.css` via `@theme`.
- **Commit style:** Conventional commits (`feat:`, `fix:`, etc.). Feature branch + PR workflow.

## Testing

- **Framework:** Vitest (configured in `vite.config.ts`, environment: `node`)
- **Test files:** Colocated as `*.test.ts` in `engine/`
- **Pattern:** `describe`/`it`/`expect` testing pure functions

## Deployment

- **GitHub Pages:** `.github/workflows/pages.yml` deploys on push to `main` (Node 20)
- **Vite base path:** `/energieportaal/`
- **Vercel:** SPA routing via `vercel.json`

## External APIs

- **Geo API** (SubsidieFinance only): `https://geo.api.gouv.fr/communes?codePostal={pc}` — French municipality lookup by postal code

## Disclaimer

All energy calculations are indicative, not an official DPE report. Users should consult a certified professional via [France Rénov'](https://france-renov.gouv.fr).
