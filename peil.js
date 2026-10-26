// peil.js: Peil-label (stempel en voettekstalinea) bij de uitkomst. Alleen zichtbaar als PEIL_LABEL_AAN true is.
// Peil is het parameterregister van Communities Abroad (privé). De waarden staan als kopie in peil/waarden.json;
// tests/peil.test.mjs bewaakt dat de tool daarmee overeenkomt. Bij elke controle alleen PEIL_STAND aanpassen (en peil/waarden.json).
// PEIL-BLOK-BEGIN
const PEIL_STAND = "2026-10-24";
// Schakelaar voor het Peil-label (stempel en voettekstalinea). Zolang false toont de tool niets over Peil.
const PEIL_LABEL_AAN = false; // uit sinds 26-10-2026: vier marktprijzen verlopen (geldig t/m 2025) en zeven bedragen nog niet primair vastgesteld; pas weer aan na ijking in Peil
const PEIL_UITLEG_URL = "https://infofrankrijk.com/ons-manifest-hoe-wij-werken/";
// Toolkaart van deze tool; de Peil-stempel linkt hiernaartoe (het manifest blijft de link in de voettekstalinea).
const PEIL_KAART_URL = "https://communitiesabroad.com/manifest/tool/energieportaal";
const MAANDEN_NL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
function peilStandNl() {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(PEIL_STAND);
  return m ? `${parseInt(m[3], 10)} ${MAANDEN_NL[parseInt(m[2], 10) - 1]} ${m[1]}` : PEIL_STAND;
}
const PEIL_MERK = `<span class="peil-merk" aria-hidden="true">&#10003;</span>`;
const MAANDEN_KORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function peilStandKort() {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(PEIL_STAND);
  return m ? `${parseInt(m[3], 10)} ${MAANDEN_KORT[parseInt(m[2], 10) - 1]} ${m[1]}` : PEIL_STAND;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
// Compacte stempelknop: merkteken met dubbele ring en vinkje, twee korte regels, het geheel is één link naar het manifest.
function peilRegelHtml() {
  if (!PEIL_LABEL_AAN) return "";
  const aria = `Bedragen gecontroleerd tegen Peil, stand ${peilStandNl()}, bekijk wat er gecontroleerd is`;
  return `<div class="peil-stempel-rij"><a class="peil-stempel" href="${PEIL_KAART_URL}" target="_blank" rel="noopener" aria-label="${escapeHtml(aria)}"><svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="18.5" fill="#fff" stroke="#800000" stroke-width="1.6"/><circle cx="20" cy="20" r="14.5" fill="none" stroke="#800000" stroke-width="1"/><path d="M13.5 20.5 L18 25 L26.5 15.5" fill="none" stroke="#800000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="peil-stempel__tk" aria-hidden="true"><span class="peil-stempel__t1">Gecontroleerd tegen Peil</span><span class="peil-stempel__t2">stand ${escapeHtml(peilStandKort())}<span class="peil-pijl" aria-hidden="true">&#8599;</span></span></span></a></div>`;
}
function peilRegelMd() {
  if (!PEIL_LABEL_AAN) return "";
  return `[Bedragen gecontroleerd tegen Peil, stand ${peilStandNl()}](${PEIL_UITLEG_URL})`;
}
function peilVoetHtml() {
  if (!PEIL_LABEL_AAN) return "";
  return `${PEIL_MERK}<strong>Over de bedragen in deze tool.</strong> Alle wettelijke tarieven, bedragen en grenzen komen uit Peil, het register waarin wij deze gegevens bijhouden. Elk daarvan is gecontroleerd bij de officiële bron, de laatste controle was op ${escapeHtml(peilStandNl())}. Waar de tool met een aanname of schatting rekent, staat dat bij de uitkomst. <a href="${PEIL_UITLEG_URL}" target="_blank" rel="noopener">Lees in ons manifest hoe wij werken</a>`;
}
// PEIL-BLOK-EIND
document.addEventListener("DOMContentLoaded", function () {
  const stempel = document.getElementById("peilStempel");
  if (stempel) { stempel.innerHTML = peilRegelHtml(); stempel.hidden = !PEIL_LABEL_AAN; }
  const voet = document.getElementById("peilVoet");
  if (voet) { voet.innerHTML = peilVoetHtml(); voet.hidden = !PEIL_LABEL_AAN; }
});
