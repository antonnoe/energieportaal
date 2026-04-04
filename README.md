# EnergiePortaal

Energiekostenberekening voor Franse woningen — stap voor stap.

**URL:** energieportaal.vercel.app  
**Eigenaar:** Anton Noë / Infofrankrijk.com / Communities Abroad

## Architectuur

Vanilla HTML/CSS/JS wizard (geen framework, geen build step).

| Bestand | Functie |
|---------|---------|
| `index.html` | Wizard UI met 8 secties (explain → input → confirm) |
| `wizard.css` | IF huisstijl (Poppins/Mulish, #800000) |
| `wizard.js` | Navigatielogica (section/phase routing) |
| `app.js` | Applicatielogica (velden, confirms, resultaten) |
| `engine/engine.js` | Rekenmotor (warmteverlies, kosten, energiebalans) |
| `engine/tool-spec.js` | Veldspecificatie en validatie (single source of truth) |

## Bronnen

- Infofrankrijk.com, "De isolatie van het Franse huis" (Rob van der Meulen)
- Infofrankrijk.com, "De keuze van het verwarmingssysteem" (Aat de Kwaasteniet / Rob van der Meulen)
- Météo France (HDD/CDD klimaatnormalen)
- ADEME / Ministère de la Transition Écologique (DPE-methodiek)
