// api/prices.js — Standaard Franse energieprijzen (Vercel serverless)
// Elektriciteit: live van CRE Open Data (tarief réglementé Bleu, optie Base, 6 kVA, TTC); lukt dat niet, dan geldt de waarde uit Peil.
// Overige prijzen: standaardwaarden (aannames met bron en jaar, zie engine/engine.js, PRIJS_INFO). Voor fioul, hout,
// pellets en propaan bestaat geen publieke API; scrapen van winkelsites is vervallen omdat die regionale
// verkoopprijzen de afgesproken standaardwaarden overschreven en bij een gewijzigde pagina stil stuk gaan.
// De waarden hieronder moeten gelijk zijn aan PRIJS_INFO in engine/engine.js; tests/peil.test.mjs bewaakt dat.

const STALE_DAYS = 120; // 4 maanden — markeer als verouderd

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const now = new Date();
  const prices = {
    updated: now.toISOString().slice(0, 10),
    // Elektriciteit: gereguleerd tarief, geldig tot de CRE het wijzigt; refDate is de ingangsdatum en telt niet voor veroudering (regulated).
    elec:      { value: 0.2001, unit: '€/kWh',   source: 'CRE TRVE Bleu optie Base 6 kVA TTC', date: 'aug 2026', refDate: '2026-08-01', regulated: true, auto: false },
    // refDate = einde van de periode waarover de prijs een gemiddelde is (zie PRIJS_INFO.periodeEinde in engine/engine.js).
    gas:       { value: 0.146,  unit: '€/kWh',    source: 'CRE, prix repère verwarmingsprofiel, september tot en met november 2026 (aanname)', date: 'sep tot en met nov 2026', refDate: '2026-11-30', auto: false },
    fioul:     { value: 1.72,   unit: '€/L',      source: 'DGEC, gemiddelde juli tot en met september 2026 (aanname)', date: 'jul tot en met sep 2026', refDate: '2026-09-30', auto: false },
    pellet:    { value: 0.388,  unit: '€/kg',     source: 'SDES, tweede kwartaal 2026 (aanname)', date: '2e kwartaal 2026', refDate: '2026-06-30', auto: false },
    wood:      { value: 85,     unit: '€/stère',  source: 'ADEME 2025, geïndexeerd tot en met september 2026 (raming, aanname)', date: 'okt 2025 tot en met sep 2026', refDate: '2026-09-30', auto: false },
    propaan:   { value: 1.17,   unit: '€/L',      source: 'SDES, juni tot en met augustus 2026 (aanname)', date: 'jun tot en met aug 2026', refDate: '2026-08-31', auto: false },
    petroleum: { value: 2.00,   unit: '€/L',      source: 'eigen schatting, geen overheidsbron (aanname)', date: '2026', refDate: null, auto: false }
  };

  // === ELEKTRICITEIT: live van CRE CSV ===
  try {
    const csvResp = await fetch('https://www.cre.fr/fileadmin/Documents/Open_data/Marches_de_detail/Option_Base.csv');
    if (csvResp.ok) {
      const csv = await csvResp.text();
      const lines = csv.trim().split('\n').map(l => l.trim().replace(/\r/g, ''));
      let latestElec = null, latestDate = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        const cols = lines[i].split(';');
        if (cols.length >= 7 && cols[2] === '6' && cols[1] === '') {
          latestElec = parseFloat(cols[6].replace(',', '.'));
          latestDate = cols[0];
          break;
        }
      }
      if (latestElec && latestElec > 0.05 && latestElec < 0.50) {
        const parts = latestDate ? latestDate.split('/') : [];
        const maanden = ['', 'jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
        const dateLabel = parts.length === 3 ? maanden[parseInt(parts[1])] + ' ' + parts[2] : latestDate;
        const isoDate = parts.length === 3 ? parts[2] + '-' + parts[1].padStart(2,'0') + '-' + parts[0].padStart(2,'0') : prices.elec.refDate;
        prices.elec = { value: Math.round(latestElec * 10000) / 10000, unit: '€/kWh', source: 'CRE Open Data TRVE Bleu optie Base 6 kVA TTC', date: dateLabel, refDate: isoDate, regulated: true, auto: true };
      }
    }
  } catch (e) { /* fallback: waarde uit Peil */ }

  // === STALENESS CHECK ===
  // Een marktprijs is verouderd als het einde van de periode waarover hij gemiddeld is meer dan STALE_DAYS dagen terug ligt.
  // Het gereguleerde stroomtarief geldt tot de volgende wijziging en wordt daarom nooit als verouderd gemarkeerd.
  const staleItems = [];
  for (const [key, p] of Object.entries(prices)) {
    if (key === 'updated') continue;
    if (p.regulated) { p.stale = false; continue; }
    if (p.refDate) {
      const age = Math.floor((now - new Date(p.refDate)) / 86400000);
      p.ageDays = age;
      p.stale = age > STALE_DAYS;
      if (p.stale) staleItems.push(key);
    }
  }
  prices.staleWarning = staleItems.length > 0
    ? (function(){
        var labels={elec:'Elektriciteit',gas:'Aardgas',fioul:'Stookolie',pellet:'Houtpellets',wood:'Stookhout',propaan:'Propaan',petroleum:'Petroleum'};
        var named=staleItems.map(function(k){return labels[k]||k});
        return 'Let op: de standaardprijs voor ' + named.join(', ').toLowerCase() + ' gaat over een periode die meer dan ' + STALE_DAYS + ' dagen geleden eindigde. Vul bij voorkeur de prijs van uw eigen factuur in.';
      })()
    : null;

  return res.status(200).json(prices);
}
