// Herstel rekenwijze 26-10-2026: per herstelde fout een voorbeeld met de wettelijke of bronuitkomst.
// Draaien: node tests/herstel-rekenwijze.test.mjs (geen netwerk). Faalt bij elke afwijking.
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const lees = (...p) => fs.readFileSync(path.join(root, ...p), "utf8");
const require = createRequire(import.meta.url);
const fouten = [];
const ok = (cond, m) => { if (!cond) fouten.push(m); };
const bijna = (a, b, eps = 0.05) => Math.abs(a - b) <= eps;

const ctx = { Intl, Math, Number, Object, console, JSON };
vm.createContext(ctx);
vm.runInContext(lees("engine", "engine.js") + "\n;this.__W = { PRIJS_INFO, KWH_CONVERSION, HEAT_MAIN_DEF, TERUGLEVER_TARIEF, computeResults, DEFAULT_APPLIANCES };", ctx);
const W = ctx.__W;
const dpe = require(path.join(root, "engine", "dpe.js"));
const arch = {}; vm.createContext(arch); vm.runInContext(lees("engine", "archetypes.js"), arch);
const app = lees("app.js"), index = lees("index.html");

const prijzen = () => Object.fromEntries(Object.entries(W.PRIJS_INFO).map(([k, v]) => [k, v.waarde]));
const huis = (o = {}) => Object.assign({
  zone: "centre", setpoint: 20, awaySetpoint: 12, volume: 250, woonoppervlak: 100, ach: 0.6, ventType: "natural", hrvEta: 0.75,
  wallA: 120, wallU: 0.5, roofA: 100, roofU: 0.25, floorA: 100, floorU: 0.35, winA: 20, winU: 1.6,
  presentDaysWinter: 212, presentDaysSummer: 153, mainType: "gas", mainScop: 3.2, mainEta: 0.9,
  auxType: "none", auxSharePreset: "25", auxShareCustom: 25, auxScop: 3.2, auxEta: 0.85,
  persons: 2, showersPerPerson: 1, litersPer: 55, dhwType: "gas", dhwScop: 2.5, dhwEta: 0.9,
  pvKwp: 0, pvSelfUse: 60, pvExportMode: "nvt", pvExportTariff: 0.011, acOn: false, seer: 4,
  appls: JSON.parse(JSON.stringify(W.DEFAULT_APPLIANCES)), evKmWeek: 0, evKwh100: 18, evLoss: 10,
  poolHas: false, rekendatum: "2026-10-26", userPrices: prijzen()
}, o);

// 1. Gas: verbruik in kWh PCI, prijs per gefactureerde kWh PCS (factor 1,11, 3CL par. 13.2.1.4)
{
  const r = W.computeResults(huis());
  const verwacht = r.verbruik.heatMain * 0.146 * 1.11;
  ok(bijna(r.costs.verwarming, verwacht, 0.01), `1 gas: verwarming ${r.costs.verwarming.toFixed(2)}, verwacht ${verwacht.toFixed(2)} (PCI-verbruik x PCS-prijs x 1,11)`);
}
// 2. Terugleververgoeding: 3 kWp, zone Centraal, 60 procent eigen verbruik: 1.440 kWh x 0,011 = 15,84 euro (arrêté du 1er juin 2026)
{
  const r = W.computeResults(huis({ mainType: "hp", dhwType: "elec", pvKwp: 3, pvSelfUse: 60, pvExportMode: "vente" }));
  ok(W.TERUGLEVER_TARIEF === 0.011, "2 terugleververgoeding moet 0,011 euro per kWh zijn");
  ok(bijna(r.verbruik.pvExport, 1440, 0.01) && bijna(-r.costs.pvExportOpbrengst, 15.84, 0.01), `2 teruglevering: ${(-r.costs.pvExportOpbrengst).toFixed(2)} euro, verwacht 15,84`);
  ok(r.debug.pvExportBetaald <= 1600 * 3, "2 plafond 1.600 uur maal het vermogen");
  ok(!/value="0\.04"/.test(index) && !/pvExportTariff'\),0\.04\)/.test(app), "2 de oude standaard 0,04 staat nog in index.html of app.js");
}
// 3. Standaardprijzen (keuring 26-10-2026, all_p.json)
{
  const P = W.PRIJS_INFO, K = W.KWH_CONVERSION;
  ok(P.gas.waarde === 0.146 && P.fioul.waarde === 1.72, "3 gas 0,146 en fioul 1,72");
  ok(bijna(P.pellet.waarde / K.pellet, 0.0843, 0.0005), `3 pellets per kWh PCI ${(P.pellet.waarde / K.pellet).toFixed(4)}, verwacht 0,0843`);
  ok(bijna(P.wood.waarde / K.wood, 0.047, 0.0005), `3 hout per kWh PCI ${(P.wood.waarde / K.wood).toFixed(4)}, verwacht 0,047`);
  for (const k of ["gas", "fioul", "pellet", "wood", "propaan"]) ok(P[k].periode && P[k].periodeEinde && /\d{4}/.test(P[k].bron), `3 ${k}: periode en bron ontbreken`);
}
// 4. DPE-klasse: afronding naar beneden en strikt kleiner dan; kleine woningen; boven 800 m
{
  ok(dpe.dpeKlasse(250.0, 10, 100, false) === "E", "4 CEP 250,0 bij 100 m2 moet E zijn");
  ok(dpe.dpeKlasse(249.9, 10, 100, false) === "D", "4 CEP 249,9 bij 100 m2 moet D zijn (afronding naar beneden)");
  ok(dpe.dpeKlasse(252.2, 10, 20, false) === "D", "4 studio 20 m2 met CEP 252,2 moet D zijn (grens 300)");
  ok(dpe.dpeKlasse(100, 10, 8, false) === "A", "4 8 m2 met CEP 100 moet A zijn (grens 146)");
  const t = dpe.dpeDrempels(14.5, false); ok(bijna(t.ep[0], 102, 0.01), `4 interpolatie 14,5 m2 A-grens ${t.ep[0]}, verwacht 102`);
  ok(dpe.dpeKlasse(395, 10, 100, true) === "F" && dpe.dpeKlasse(385, 10, 100, true) === "E", "4 boven 800 m: E tot 390");
  ok(dpe.dpeKlasse(440, 10, 20, true) === "E", "4 boven 800 m, 20 m2: E tot 445");
}
// 5. Warm water met Nadeq: 100 m2, elektrische boiler: 1,163 x 1,975 x 56 x 28 x 358 / 1000 = 1.289,4 kWh
{
  const d = dpe.computeDPE(huis({ mainType: "hp", dhwType: "elec", zone: "paris" }));
  ok(bijna(d.details.dhwThermal, 1289.4, 0.1), `5 warm water ${d.details.dhwThermal.toFixed(1)} kWh, verwacht 1.289,4`);
  ok(bijna(d.details.Nadeq, 1.975, 1e-9), "5 Nadeq 1,975 bij 100 m2");
}
// 6. CO2 elektriciteit per gebruik (verwarming 0,079, warm water 0,065, verlichting 0,069, hulp 0,064)
{
  const d = dpe.computeDPE(huis({ mainType: "elec", dhwType: "elec", zone: "paris", ventType: "mech" }));
  const x = d.details;
  const verwacht = x.heatFinal * 0.079 + x.dhwFinal * 0.065 + x.lightFinal * 0.069 + x.ventFinal * 0.064;
  ok(bijna(d.ges, verwacht, 0.01), `6 CO2 ${d.ges.toFixed(1)} kg, verwacht ${verwacht.toFixed(1)}`);
}
// 7. Verlichting 0,9 x 1,4 x 1.500 / 1000 x 100 m2 = 189 kWh (3CL par. 16.1); natuurlijke ventilatie 0, VMC simple flux 569,4 kWh (par. 5)
{
  const d = dpe.computeDPE(huis({ zone: "paris" }));
  ok(bijna(d.details.lightFinal, 189, 0.01), `7 verlichting ${d.details.lightFinal}, verwacht 189`);
  ok(d.details.ventFinal === 0 && bijna(dpe.computeDPE(huis({ zone: "paris", ventType: "mech" })).details.ventFinal, 569.4, 0.01), "7 hulpenergie ventilatie");
}
// 8. Benaderingszin zichtbaar; bijverwarming telt mee in de DPE-indicatie
{
  ok(/benadering en geen officiële DPE/.test(dpe.DPE_BENADERING) && index.includes("benadering en geen officiële DPE"), "8 benaderingszin ontbreekt");
  const zonder = dpe.computeDPE(huis({ mainType: "elec" })), met = dpe.computeDPE(huis({ mainType: "elec", auxType: "wood", auxSharePreset: "50" }));
  ok(met.details.finalByCar.wood > 0 && met.perM2.ep < zonder.perM2.ep, "8 bijverwarming (hout) telt mee");
}
// 9. Afstand tot een betere klasse op de eindklasse en op beide assen: gas, CEP 148,7 (C) en EGES 32,7 (D): energie 0, CO2 3
{
  const fake = { perM2: { ep: 148.7, ges: 32.7 }, details: { classeIndex: 3, drempels: dpe.dpeDrempels(100, false) } };
  const a = dpe.dpeAfstand(fake);
  ok(a && a.doel === "C" && a.ep === 0 && a.ges === 3, `9 afstand ${JSON.stringify(a)}, verwacht doel C, energie 0, CO2 3`);
  ok(!/kwhM22-better\.max/.test(app) && !/kwhM2-betterClass\.max/.test(app), "9 oude afstandsberekening staat nog in app.js");
}
// 10. Totaal potentieel: één berekening met alle maatregelen (voorbeeld: gas, U muur 2,5, dak 2,5, ramen 4,9)
{
  const s = huis({ wallU: 2.5, roofU: 2.5, winU: 4.9, zone: "paris" });
  const r0 = W.computeResults(s).totalCost;
  const maatregelen = [{ roofU: 0.25 }, { wallU: 0.35 }, { winU: 1.2 }, { ventType: "hrv", hrvEta: 0.8 }, { mainType: "hp", mainScop: 3.5 }];
  const los = maatregelen.map((m) => r0 - W.computeResults(Object.assign({}, s, m)).totalCost);
  const pakket = r0 - W.computeResults(Object.assign({}, s, ...maatregelen)).totalCost;
  const som = los.reduce((a, b) => a + b, 0);
  ok(pakket < som && pakket < r0, `10 pakket ${pakket.toFixed(0)} moet kleiner zijn dan de som ${som.toFixed(0)} en dan de rekening ${r0.toFixed(0)}`);
  ok(/computeResults\(pakket\)/.test(app) && !/totalSaving\+=/.test(app), "10 app.js telt de losse besparingen nog op");
}
// 11 en NIEUW b. MaPrimeRénov': hoofdverblijf, 15 jaar, fossiele toestellen
{
  ok(!/Uw woning komt in aanmerking/.test(app) && !/status:'Beschikbaar',\s*color:'#009B4D'\s*\}\);\s*\/\/ MaPrimeR/.test(app), "11 Ampleur of Geste nog onvoorwaardelijk");
  ok(/hoofdverblijf is en de woning ouder is dan 15 jaar/.test(app) && /fossiele brandstof/.test(app), "11 voorwaarden hoofdverblijf, 15 jaar en fossiel ontbreken");
}
// 12 en NIEUW a. Verhuurverbod: ook bij verlenging; geen omgekeerde tekst
{
  ok((app.match(/ook niet bij verlenging van de huur/g) || []).length >= 3, "12 verhuurverbod noemt verlenging niet");
  ok(!/vóór 2034: klasse D/.test(app), "NIEUW a de omgekeerde tekst staat er nog");
}
// 13 en NIEUW d. Verouderingscontrole: einde periode als refDate, stroomtarief nooit verouderd, waarschuwing getoond
{
  const echteDate = Date, echteFetch = globalThis.fetch;
  class NepDate extends echteDate { constructor(...a) { super(...(a.length ? a : ["2026-12-15T12:00:00Z"])); } static now() { return new echteDate("2026-12-15T12:00:00Z").getTime(); } }
  globalThis.Date = NepDate; globalThis.fetch = async () => { throw new Error("geen netwerk"); };
  let data = null;
  const { default: handler } = await import(path.join(root, "api", "prices.js"));
  await handler({}, { setHeader() {}, status() { return { json(d) { data = d; } }; } });
  globalThis.Date = echteDate; globalThis.fetch = echteFetch;
  ok(data && data.elec.stale === false, "NIEUW d het gereguleerde stroomtarief mag niet als verouderd gelden");
  ok(data && data.pellet.refDate === "2026-06-30" && data.pellet.stale === true && data.gas.stale === false, "13 pellets (tot 30-06-2026) moeten op 15-12-2026 verouderd zijn, gas niet");
  ok(data && /houtpellets/.test(data.staleWarning || ""), "13 de waarschuwing noemt de verouderde prijs niet");
  ok(/priceUpdateInfo'\);\s*if\(info&&data&&data\.staleWarning\)/.test(app), "13 app.js toont de waarschuwing niet");
}
// 14. Propaan: keuze in de verwarming, omrekening 12,78 kWh PCI per kg x 0,51 kg per liter
{
  ok(W.HEAT_MAIN_DEF.some((h) => h.key === "propaan" && h.priceKey === "propaan"), "14 propaan ontbreekt als verwarmingskeuze");
  ok(bijna(W.KWH_CONVERSION.propaan, 6.5178, 1e-4), "14 omrekening propaan per liter");
  const r = W.computeResults(huis({ mainType: "propaan", dhwType: "elec" }));
  ok(r.costs.verwarming > 0 && bijna(r.costs.verwarming, r.verbruik.heatMain * 1.17 / 6.5178, 0.01), "14 propaankosten");
  ok(dpe.computeDPE(huis({ mainType: "propaan", dhwType: "elec" })).details.heatCarrier === "propaan", "14 DPE herkent propaan");
}
// 15. Standaardwaarden: enkel glas 4,9, vloer vóór 1975 2,0
{
  const P = arch.PERIODS;
  ok(P.pre1948.winU === 4.9 && P.y48_74.winU === 4.9 && P.y48_74.floorU === 2.0, "15 archetypes: enkel glas 4,9 en vloer 2,0");
}

if (fouten.length) { console.log(`${fouten.length} fout(en) in het herstel van de rekenwijze:`); fouten.forEach((m) => console.log("FOUT " + m)); process.exit(1); }
console.log("Alle herstelcontroles rekenwijze geslaagd.");
