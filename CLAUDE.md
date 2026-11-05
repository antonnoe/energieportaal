# CLAUDE.md

Repo: energieportaal

## Wat dit is

EnergiePortaal: energiekostenberekening voor Franse woningen, stap voor stap (wizard), van Infofrankrijk.com / Communities Abroad.

## Live adres

energieportaal.vercel.app (README.md). vercel.json laat inbedden toe (frame-ancestors *) en zet noindex, nofollow.

## Opbouw

- index.html, wizard.css, wizard.js (navigatie), app.js (velden, bevestigingen, resultaten).
- engine/engine.js (rekenmotor), engine/tool-spec.js (veldspecificatie), engine/dpe.js, engine/archetypes.js.
- api/prices.js (standaard energieprijzen), api/explain.js (toelichting door AI).
- peil.js (Peil-label bij de uitkomst), peil/waarden.json (kopie uit Peil), peil/engine-hash.json (sha256 van de byte-identieke engine-bestanden, gelijk te houden met if-mobiel).
- tests/dpe-test.js, tests/peil.test.mjs, tests/herstel-rekenwijze.test.mjs.
- .github/workflows/peil-controle.yml.

## Techniek

Vanilla HTML, CSS en JavaScript, geen framework, geen build (README.md). package.json: versie 2.0.0, afhankelijkheid jsdom (voor de tests), script npm test draait de drie testbestanden. Vercel serverless functies in api/.

## Externe diensten en namen van omgevingsvariabelen

- Anthropic API (api/explain.js): ANTHROPIC_API_KEY.
- CRE Open Data (api/prices.js): live csv voor het elektriciteitstarief, zonder sleutel; bij falen geldt de waarde uit Peil.
- Peil, het parameterregister van Communities Abroad (kopie in peil/waarden.json).
- Google Fonts.

## Hoe het live gaat

Vercel deployt de repo (rewrite van alle paden naar index.html, api/ als serverless functies). GitHub Actions (peil-controle.yml) draait bij elke push en wekelijks op maandag tests/dpe-test.js en tests/peil.test.mjs.

## Regels en besluiten

Bron: README.md.
- IF-huisstijl: Poppins en Mulish, kleur #800000.
- tool-spec.js is de enige bron van waarheid voor velden en validatie.
- Bronnen voor de inhoud: artikelen op Infofrankrijk.com over isolatie en verwarmingssysteem, Météo France (HDD/CDD), ADEME en het ministerie (DPE-methodiek).
- Uit peil/engine-hash.json: wijzig de engine in energieportaal en if-mobiel allebei en werk de hashes in beide bij.

Laatst nagelopen: 5 november 2026
