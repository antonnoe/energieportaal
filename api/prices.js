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
    elec:      { value: 0.2001, unit: '€/kWh',   source: 'CRE TRVE Bleu optie Base 6 kVA TTC', date: 'aug 2026', refDate: '2026-08-01', auto: false },
    gas:       { value: 1.40,   unit: '€/m³',     source: 'SDES/DGEC, gemiddelde 2025 (aanname)', date: '2025', refDate: '2026-10-20', auto: false },
    fioul:     { value: 1.13,   unit: '€/L',      source: 'SDES/DGEC, gemiddelde 2025 (aanname)', date: '2025', refDate: '2026-10-20', auto: false },
    pellet:    { value: 0.40,   unit: '€/kg',     source: 'ADEME, prijzen 2024 (aanname)',        date: '2024', refDate: '2026-10-20', auto: false },
    wood:      { value: 90,     unit: '€/stère',  source: 'ADEME, prijzen 2024 (aanname)',        date: '2024', refDate: '2026-10-20', auto: false },
    propaan:   { value: 1.80,   unit: '€/L',      source: 'eigen schatting, geen overheidsbron (aanname)', date: '2026', refDate: '2026-10-20', auto: false },
    petroleum: { value: 2.00,   unit: '€/L',      source: 'eigen schatting, geen overheidsbron (aanname)', date: '2026', refDate: '2026-10-20', auto: false }
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
        prices.elec = { value: Math.round(latestElec * 10000) / 10000, unit: '€/kWh', source: 'CRE Open Data TRVE Bleu optie Base 6 kVA TTC', date: dateLabel, refDate: isoDate, auto: true };
      }
    }
  } catch (e) { /* fallback: waarde uit Peil */ }

  // === STALENESS CHECK ===
  const staleItems = [];
  for (const [key, p] of Object.entries(prices)) {
    if (key === 'updated') continue;
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
        return staleItems.length + ' prijs(zen) ouder dan ' + STALE_DAYS + ' dagen: ' + named.join(', ');
      })()
    : null;

  return res.status(200).json(prices);
}
