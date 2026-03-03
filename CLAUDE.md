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
- **Push naar main** tenzij expliciet anders gevraagd.

---

## PROJECT OVERZICHT

**EnergiePortaal** is één geïntegreerde energietool voor Nederlandse huiseigenaren in Frankrijk.
URL: energieportaal.vercel.app
Eigenaar: Anton Noë / InfoFrankrijk.com / Nederlanders.fr

Eén tool, één rekenmotor, één doorlopend rapport. Invoer links/boven, rapport rechts/onder.

---

## DIRECTORY STRUCTUUR (na PR #22)

```
energieportaal/
├── CLAUDE.md
├── api/ai-advice.ts                  ← Vercel serverless (Anthropic API proxy, max_tokens: 300)
├── public/energieportaal-ai-adviseur.md
├── src/
│   ├── App.tsx                        ← Layout + progressief rapport + mobile toggle
│   ├── engine/
│   │   ├── constants.ts               ← Zones, prijzen, isolatieniveaus, DEFAULT_EFFICIENCY
│   │   ├── types.ts
│   │   ├── compute.ts                 ← Hoofdberekening (getEfficiency: 0 → default)
│   │   ├── dpe.ts
│   │   ├── subsidie-rules.ts
│   │   └── savings.ts
│   ├── data/
│   │   ├── huizen-matrix.ts           ← 9 woningtypes
│   │   ├── dept-zone-map.ts
│   │   └── sources.ts
│   ├── context/ToolStateContext.tsx    ← State + auto-compute + highestStepVisited
│   ├── components/
│   │   ├── AIAdviseur.tsx             ← [?] tooltips met Anthropic API
│   │   ├── CoachPanel.tsx             ← ❌ DOOD — nergens geïmporteerd
│   │   └── CoachWidget.tsx            ← ❌ DOOD — nergens geïmporteerd
│   ├── steps/
│   │   ├── Step1Locatie.tsx .. Step5Financieel.tsx
│   └── report/
│       ├── Woningprofiel.tsx, Energieprofiel.tsx, DPESchatting.tsx
│       ├── Besparingsadvies.tsx, SubsidieCheck.tsx, Grondslagen.tsx
│       ├── FloatingEuro.tsx, Disclaimer.tsx
│       ├── PdfExport.tsx              ← jsPDF + jspdf-autotable
│       └── DossierKnop.tsx            ← postMessage naar parent
```

---

## REKENMOTOR

### Efficiëntie
`getEfficiency(type, override)`: als override > 0 → override, anders DEFAULT_EFFICIENCY[type].
Defaults: gas=0.90, stookolie=0.85, warmtepomp=3.5, elektrisch=1.0, hout=0.75, propaan=0.90.

### DHW
dhwSystem bepaalt zowel rendement als tarief. Functie `getPrijsPerKwh(dhwSystem)` koppelt aan de juiste brandstofprijs.

### DPE
Alleen verwarming + DHW + basiselektriciteit. EV/zwembad/koeling buiten DPE.

---

## PROGRESSIEF RAPPORT

| Niveau | Trigger | Zichtbaar |
|--------|---------|-----------|
| 0 | Geen postcode | "Vul uw postcode in" |
| 1 | Postcode 5 cijfers | Klimaatblok in kleur, rest grijs |
| 2 | Woningtype gekozen | + Woningprofiel in kleur |
| 3 | highestStepVisited >= 3 | Alles in kleur |

FloatingEuro: alleen bij Niveau 3.
Subsidie: alleen bij currentStep >= 5.
PDF + Dossier knoppen: alleen bij Niveau 3.

---

## ENERGIEPRIJZEN — februari 2026

gas=0.1051, stookolie=0.118, elektriciteit=0.1940, hout=0.047, propaan=0.268, PV-export=0.04 €/kWh.

---

## HUISSTIJL

#800000, Poppins (headings), Mulish (body), regelafstand 1.8em.

---

## BEKENDE BUGS (3 maart 2026)

1. DHW-tarief volgt niet mainHeating (propaan → DHW op gastarief)
2. AI max_tokens=300 → advies wordt afgekapt
3. AI-context toont η/SCOP=0 i.p.v. werkelijk default
4. AI-context mist glastype/isolatieniveau
5. DPE + FloatingEuro verschijnt te vroeg (Stap 3 openen = al zichtbaar)
6. Dode code: CoachPanel.tsx, CoachWidget.tsx
