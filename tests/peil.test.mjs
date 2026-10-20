// Controle van de waarden in de tool tegen peil/waarden.json, de kopie van de waarden uit Peil (het parameterregister van Communities Abroad).
// Draaien: node tests/peil.test.mjs (geen netwerk, geen afhankelijkheden). Faalt bij elke afwijking.
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const lees = (...p) => fs.readFileSync(path.join(root, ...p), "utf8");
const require = createRequire(import.meta.url);
const WAARDEN = JSON.parse(lees("peil", "waarden.json"));
const PIN = JSON.parse(lees("peil", "engine-hash.json"));
const UITLEG_URL = "https://infofrankrijk.com/ons-manifest-hoe-wij-werken/";
const fouten = [];
const fout = (m) => fouten.push(m);
const gelijk = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nl = (n) => String(n).replace(".", ",");

// ---- engine.js laden: de constanten staan als const, dus ze worden via een hulpregel zichtbaar gemaakt
const engineCode = lees("engine", "engine.js");
const ctx = { Intl, Math, Number, Object, console };
vm.createContext(ctx);
vm.runInContext(engineCode + "\n;this.__W = { PEIL_WAARDEN_STAND, PRIJS_INFO, PRICE_DEFAULTS_USER, KWH_CONVERSION, PRIJS_UITLEG, APPARATEN_UITLEG, DEFAULT_APPLIANCES, U_PRESETS, U_UITLEG, computeResults };", ctx);
const W = ctx.__W;
const dpe = require(path.join(root, "engine", "dpe.js"));

// ---- peil.js laden (het blok tussen de markeringen)
const peilCode = lees("peil.js");
const blok = (peilCode.match(/\/\/ PEIL-BLOK-BEGIN\n([\s\S]*?)\/\/ PEIL-BLOK-EIND/) || [])[1];
if (!blok) fout("peil.js mist het blok tussen PEIL-BLOK-BEGIN en PEIL-BLOK-EIND.");
function laadPeil(code) {
  const c = { console };
  vm.createContext(c);
  vm.runInContext(code + "\n;this.__P = { PEIL_STAND, PEIL_LABEL_AAN, PEIL_UITLEG_URL, peilStandNl, peilStandKort, peilRegelHtml, peilRegelMd, peilVoetHtml };", c);
  return c.__P;
}
const P = laadPeil(blok || "");

// ---- 1. Datum en standen
if (!/^\d{4}-\d{2}-\d{2}$/.test(P.PEIL_STAND)) fout(`PEIL_STAND (${P.PEIL_STAND}) is geen datum als JJJJ-MM-DD.`);
if (WAARDEN.stand !== P.PEIL_STAND) fout(`stand in peil/waarden.json is ${WAARDEN.stand}, maar PEIL_STAND in peil.js is ${P.PEIL_STAND}.`);
if (W.PEIL_WAARDEN_STAND !== WAARDEN.stand) fout(`PEIL_WAARDEN_STAND in engine.js is ${W.PEIL_WAARDEN_STAND}, peil/waarden.json heeft ${WAARDEN.stand}.`);
const perId = new Map((WAARDEN.parameters || []).map((p) => [p.id, p]));
const param = (id) => { const p = perId.get(id); if (!p) fout(`${id} staat niet in peil/waarden.json.`); return p || {}; };

// ---- 2. Primaire-energiefactor elektriciteit, datumafhankelijk
{
  const p = param("p.fr.dpe.primaire_energiefactor_elektriciteit");
  for (const per of p.waarde_per_periode || []) {
    const dag = per.vanaf;
    if (dpe.dpePefElec(dag) !== per.waarde) fout(`DPE-factor op ${dag}: tool ${dpe.dpePefElec(dag)}, Peil ${per.waarde}.`);
    if (per.tot && dpe.dpePefElec(per.tot) !== per.waarde) fout(`DPE-factor op ${per.tot}: tool ${dpe.dpePefElec(per.tot)}, Peil ${per.waarde}.`);
  }
  if (dpe.dpePefElec("2026-12-31") !== 1.9) fout("DPE-factor op 31 december 2026 moet 1,9 zijn.");
  if (dpe.dpePefElec("2027-01-01") !== 1.7) fout("DPE-factor op 1 januari 2027 moet 1,7 zijn.");
  if (p.waarde !== 1.9) fout("peil/waarden.json: de factor voor 2026 moet 1,9 zijn.");
  const huis = { zone: "paris", volume: 250, ach: 0.6, ventType: "natural", wallA: 120, wallU: 0.5, roofA: 100, roofU: 0.25, floorA: 100, floorU: 0.35, winA: 20, winU: 1.6, woonoppervlak: 100, mainType: "elec", dhwType: "elec" };
  const a = dpe.computeDPE({ ...huis, rekendatum: "2026-12-31" });
  const b = dpe.computeDPE({ ...huis, rekendatum: "2027-01-01" });
  // alleen elektriciteit: primaire energie = finale energie x factor
  if (Math.abs(a.energiePrimaire - a.energieFinale * 1.9) > 1e-6) fout("computeDPE op 31-12-2026 rekent niet met factor 1,9.");
  if (Math.abs(b.energiePrimaire - b.energieFinale * 1.7) > 1e-6) fout("computeDPE op 01-01-2027 rekent niet met factor 1,7.");
  if (a.details.pefElec !== 1.9 || b.details.pefElec !== 1.7) fout("details.pefElec toont niet de gebruikte factor.");
  const gas = dpe.computeDPE({ ...huis, mainType: "gas", dhwType: "gas", rekendatum: "2027-01-01" });
  const el = gas.details.finalByCar.elec, gs = gas.details.finalByCar.gas;
  if (Math.abs(gas.energiePrimaire - (el * 1.7 + gs * 1.0)) > 1e-6) fout("Overige energiedragers moeten met factor 1,0 meetellen.");
}

// ---- 3. Klassegrenzen
{
  const p = param("p.fr.dpe.klassegrenzen");
  const e = (p.waarde || {}).energie_kWh_ep_per_m2_per_jaar_bovengrens_exclusief || {};
  const c = (p.waarde || {}).co2_kg_per_m2_per_jaar_bovengrens_exclusief || {};
  for (const k of dpe.DPE_EP_CLASSES) if (k.letter !== "G" && k.max !== e[k.letter]) fout(`DPE-klasse ${k.letter} energie: tool ${k.max}, Peil ${e[k.letter]}.`);
  for (const k of dpe.DPE_GES_CLASSES) if (k.letter !== "G" && k.max !== c[k.letter]) fout(`DPE-klasse ${k.letter} CO2: tool ${k.max}, Peil ${c[k.letter]}.`);
}

// ---- 4. Elektriciteitsprijs (TRVE) overal gelijk aan Peil
{
  const p = param("p.fr.energie.prijs_elektriciteit_trve");
  const ab = p.abonnement_per_jaar_ttc || {};
  if (W.PRIJS_INFO.elec.waarde !== p.waarde) fout(`Elektriciteitsprijs in PRIJS_INFO: ${W.PRIJS_INFO.elec.waarde}, Peil ${p.waarde}.`);
  if (W.PRICE_DEFAULTS_USER.elec !== p.waarde) fout(`PRICE_DEFAULTS_USER.elec: ${W.PRICE_DEFAULTS_USER.elec}, Peil ${p.waarde}.`);
  if (W.PRIJS_INFO.elec.status !== "vastgesteld") fout("Elektriciteitsprijs moet als vastgesteld zijn gemarkeerd.");
  const t = W.PRIJS_INFO.elec.toelichting;
  if (!t.includes(nl(ab["3_kva"])) || !t.includes(nl(ab["6_kva"]))) fout("De uitleg bij de elektriciteitsprijs noemt het abonnement niet met de bedragen uit Peil.");
  if (!/komt er los bij/.test(W.PRIJS_UITLEG + W.PRIJS_INFO.elec.toelichting)) fout("De uitleg moet zeggen dat het abonnement er los bij komt.");
  const spec = lees("engine", "tool-spec.js");
  const specWaarde = (id) => parseFloat((new RegExp(`id:\\s*'${id}',[\\s\\S]*?default:\\s*([0-9.]+)`).exec(spec) || [])[1]);
  const api = lees("api", "prices.js");
  const apiWaarde = (k) => parseFloat((new RegExp(`\\n\\s*${k}:\\s*\\{ value: ([0-9.]+)`).exec(api) || [])[1]);
  for (const k of Object.keys(W.PRIJS_INFO)) {
    if (W.PRICE_DEFAULTS_USER[k] !== W.PRIJS_INFO[k].waarde) fout(`PRICE_DEFAULTS_USER.${k} wijkt af van PRIJS_INFO.`);
    if (specWaarde("price_" + k) !== W.PRIJS_INFO[k].waarde) fout(`tool-spec.js price_${k}: ${specWaarde("price_" + k)}, verwacht ${W.PRIJS_INFO[k].waarde}.`);
    if (apiWaarde(k) !== W.PRIJS_INFO[k].waarde) fout(`api/prices.js ${k}: ${apiWaarde(k)}, verwacht ${W.PRIJS_INFO[k].waarde}.`);
  }
  if (/0\.25\b|0\.194\b/.test(W.PRIJS_UITLEG) || /elec:\s*0\.25\b/.test(engineCode)) fout("De oude elektriciteitsprijs (0,25 of 0,194) staat nog in de tool.");
}

// ---- 5. Overige prijzen: aannames met bron en zichtbaar in de tool
{
  const ids = { gas: "p.fr.energie.prijs_gas_prix_repere", fioul: "p.fr.energie.prijs_fioul", pellet: "p.fr.energie.prijs_pellets", wood: "p.fr.energie.prijs_hout", propaan: "p.fr.energie.prijs_propaan", petroleum: "p.fr.energie.prijs_petroleum" };
  for (const [k, id] of Object.entries(ids)) {
    const p = param(id), i = W.PRIJS_INFO[k];
    if (i.peilId !== id) fout(`PRIJS_INFO.${k}.peilId is ${i.peilId}, verwacht ${id}.`);
    if (p.status !== "aanname" || i.status !== "aanname") fout(`${id}: de tool en Peil moeten dit als aanname markeren (tool ${i.status}, Peil ${p.status}).`);
    if (!i.bron) fout(`PRIJS_INFO.${k} heeft geen bron.`);
    if (![nl(i.waarde.toFixed(2)), nl(String(i.waarde))].some((s) => (p.waarde_weergave || "").includes(s))) fout(`${id}: de standaardwaarde ${nl(i.waarde.toFixed(2))} staat niet in waarde_weergave van Peil (${p.waarde_weergave}).`);
  }
  // omrekening gas: 0,14 euro per kWh x 10 kWh per m3; hout: 0,05 x 1800
  if (Math.abs(W.PRIJS_INFO.gas.waarde - 0.14 * W.KWH_CONVERSION.gas) > 1e-9) fout("Gasprijs per m³ is niet 0,14 x de energie-inhoud uit KWH_CONVERSION.");
  if (Math.abs(W.PRIJS_INFO.wood.waarde - 0.05 * W.KWH_CONVERSION.wood) > 1e-9) fout("Houtprijs per stère is niet 0,05 x de energie-inhoud uit KWH_CONVERSION.");
  if (!/aanname/.test(W.PRIJS_UITLEG)) fout("PRIJS_UITLEG zegt niet dat de overige prijzen aannames zijn.");
  const st = param("p.fr.energie.standaardprijzen_invoer");
  if (st.status !== "aanname") fout("standaardprijzen_invoer moet als aanname zijn gemarkeerd.");
}

// ---- 6. U-waarden per bouwperiode (3CL), apparaatverbruik (ADEME)
{
  const u = param("p.fr.energie.u_waarden_isolatieniveau"), w = u.waarde || {};
  const vals = (o) => Object.values(o);
  if (!gelijk(vals(W.U_PRESETS.wall), w.muur)) fout(`Muur-U-waarden: tool ${JSON.stringify(vals(W.U_PRESETS.wall))}, Peil ${JSON.stringify(w.muur)}.`);
  if (!gelijk(vals(W.U_PRESETS.roof), w.dak)) fout(`Dak-U-waarden: tool ${JSON.stringify(vals(W.U_PRESETS.roof))}, Peil ${JSON.stringify(w.dak)}.`);
  if (!gelijk(vals(W.U_PRESETS.floor), w.vloer)) fout(`Vloer-U-waarden: tool ${JSON.stringify(vals(W.U_PRESETS.floor))}, Peil ${JSON.stringify(w.vloer)}.`);
  if (!gelijk(vals(W.U_PRESETS.win), (u.waarde_ramen || {}).waarden)) fout("Raamwaarden in de tool wijken af van peil/waarden.json.");
  if (vals(W.U_PRESETS.roof).includes(3) || vals(W.U_PRESETS.win).includes(5.5)) fout("Dak 3,0 en raam 5,5 komen in de methode niet voor en moeten vervallen zijn.");
  if (!/aanname/.test(W.U_UITLEG) || !/1983/.test(W.U_UITLEG)) fout("U_UITLEG zegt niet dat de koppeling aan bouwperiodes een aanname is.");
  const a = param("p.fr.energie.apparaatverbruik_per_jaar"), aw = a.waarde || {};
  const kwh = Object.fromEntries(W.DEFAULT_APPLIANCES.map((x) => [x.key, x]));
  const koppel = { fridge: "koel_vriescombinatie", wash: "wasmachine_plus_droger", dish: "vaatwasser", tv: "televisie", lighting: "verlichting" };
  for (const [k, pk] of Object.entries(koppel)) {
    if (kwh[k].kwh !== aw[pk]) fout(`Apparaat ${k}: tool ${kwh[k].kwh} kWh, Peil ${aw[pk]} kWh.`);
    if (kwh[k].status !== "raming") fout(`Apparaat ${k} moet als raming zijn gemarkeerd.`);
  }
  for (const k of ["it", "small"]) if (kwh[k].status !== "aanname") fout(`Apparaat ${k} moet als aanname zijn gemarkeerd.`);
  if (a.status !== "raming") fout("apparaatverbruik_per_jaar moet in Peil raming zijn.");
  if (!/ADEME/.test(W.APPARATEN_UITLEG) || !/kan afwijken/.test(W.APPARATEN_UITLEG)) fout("APPARATEN_UITLEG zegt niet 'gemiddeld volgens ADEME, uw verbruik kan afwijken'.");
}

// ---- 7. Byte-identieke engines blijven gelijk (pin in peil/engine-hash.json, in beide repo's hetzelfde)
{
  const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, "engine", f))).digest("hex");
  for (const f of ["archetypes.js", "engine.js", "dpe.js"]) {
    if (sha(f) !== PIN.bestanden[f]) fout(`engine/${f} wijkt af van de vastgelegde versie in peil/engine-hash.json. De kopie in if-mobiel moet byte-identiek blijven: pas beide repo's samen aan en werk de hashes in beide bij.`);
  }
  // Lokaal ook rechtstreeks vergelijken met de zusterrepo als die ernaast staat
  const zus = path.join(root, "..", "if-mobiel", "engine");
  if (fs.existsSync(zus)) for (const f of ["archetypes.js", "engine.js", "dpe.js"]) if (!fs.readFileSync(path.join(zus, f)).equals(fs.readFileSync(path.join(root, "engine", f)))) fout(`engine/${f} verschilt van ../if-mobiel/engine/${f}.`);
}

// ---- 8. Het Peil-label: stempel en voettekstalinea, identiek aan het goedgekeurde ontwerp
{
  const index = lees("index.html"), css = lees("wizard.css");
  const nlD = P.peilStandNl(), kort = P.peilStandKort();
  if (P.PEIL_UITLEG_URL !== UITLEG_URL) fout("PEIL_UITLEG_URL wijst niet naar het manifest.");
  if (P.PEIL_LABEL_AAN !== true) fout("PEIL_LABEL_AAN moet true zijn.");
  if (P.peilRegelMd() !== `[Bedragen gecontroleerd tegen Peil, stand ${nlD}](${UITLEG_URL})`) fout("De markdownregel klopt niet.");
  const h = P.peilRegelHtml();
  if (!h.includes(`href="${UITLEG_URL}"`) || !h.includes('target="_blank"') || !h.includes('rel="noopener"')) fout("Stempel linkt niet naar het manifest met target _blank en rel noopener.");
  if (!h.includes(`aria-label="Bedragen gecontroleerd tegen Peil, stand ${nlD}, lees hoe wij werken"`)) fout("Stempel mist de aria-label met volledige datum.");
  if (!h.includes("Gecontroleerd tegen Peil</span>") || !h.includes(`stand ${kort}<span class="peil-pijl" aria-hidden="true">&#8599;</span></span>`)) fout("Stempel mist de twee korte regels of het pijltje.");
  if ((h.match(/<a /g) || []).length !== 1 || !h.includes("<svg") || !h.includes('stroke="#800000"')) fout("Stempel moet één link met inline svg in #800000 zijn.");
  const v = P.peilVoetHtml();
  const verwacht = `<strong>Over de bedragen in deze tool.</strong> Alle wettelijke tarieven, bedragen en grenzen komen uit Peil, het register waarin wij deze gegevens bijhouden. Elk daarvan is gecontroleerd bij de officiële bron, de laatste controle was op ${nlD}. Waar de tool met een aanname of schatting rekent, staat dat bij de uitkomst. <a href="${UITLEG_URL}" target="_blank" rel="noopener">Lees in ons manifest hoe wij werken</a>`;
  if (!v.startsWith('<span class="peil-merk"') || !v.includes(verwacht)) fout("De voettekstalinea wijkt af van het goedgekeurde ontwerp.");
  if (/(19|20) oktober 2026/.test(peilCode.replace(/PEIL_STAND = [^\n]*/, "")) || /(19|20) oktober 2026/.test(index)) fout("Er staat een vaste peildatum buiten PEIL_STAND; de datum mag alleen uit PEIL_STAND komen.");
  const uit = laadPeil(blok.replace("const PEIL_LABEL_AAN = true;", "const PEIL_LABEL_AAN = false;"));
  if (uit.peilRegelHtml() !== "" || uit.peilVoetHtml() !== "" || uit.peilRegelMd() !== "") fout("Met de schakelaar uit moet het label volledig verdwijnen.");
  if (/antonnoe\.github\.io\/peil-nl-fr/.test(peilCode + index)) fout("De tool verwijst naar de openbare Peil-site.");
  const iD = index.indexOf("<strong>Disclaimer:</strong>"), iS = index.indexOf('id="peilStempel"'), iV = index.indexOf('id="peilVoet"'), iA = index.indexOf('id="aannamesCard"');
  if (!(iA > 0 && iA < iD && iD < iS && iS < iV)) fout("Volgorde in het rapport moet zijn: aannames, disclaimer, stempel, voettekstalinea.");
  if (!/<script src="peil\.js">/.test(index)) fout("index.html laadt peil.js niet.");
  if (!/\.peil-stempel\{/.test(css) || !/\.peil-pijl\{/.test(css) || !/\.peil-alinea\{/.test(css)) fout("wizard.css mist de opmaak van stempel of voettekstalinea.");
}

if (fouten.length) {
  console.log(`${fouten.length} afwijking(en) tussen de tool en peil/waarden.json:`);
  fouten.forEach((m) => console.log("FOUT " + m));
  process.exit(1);
}
console.log(`Alle Peil-controles geslaagd (stand ${P.PEIL_STAND}, ${perId.size} parameters in peil/waarden.json).`);
