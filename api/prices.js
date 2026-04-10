// api/prices.js — Actuele Franse energieprijzen (Vercel serverless)
// Fetcht elektriciteit live van CRE Open Data CSV
// Gas en overige bronnen: web-scraping of fallback naar bekende waarden

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const prices = {
    updated: new Date().toISOString().slice(0, 10),
    elec: { value: 0.194, unit: '€/kWh', source: 'CRE TRV Base 6kVA TTC', date: 'feb 2026', auto: false },
    gas: { value: 0.1051, unit: '€/kWh PCI', source: 'CRE Prix Repère chauffage', date: 'apr 2026', auto: false },
    fioul: { value: 1.19, unit: '€/L', source: 'DGEC Pégase + FioulReduc', date: 'mrt 2026', auto: false },
    pellet: { value: 0.60, unit: '€/kg', source: 'ADEME + propellet.fr', date: 'Q1 2026', auto: false },
    wood: { value: 85, unit: '€/stère', source: 'ADEME Baromètre bois', date: '2025', auto: false },
    propaan: { value: 1.90, unit: '€/L', source: 'DGEC Pégase GPL', date: 'Q1 2026', auto: false },
    petroleum: { value: 2.00, unit: '€/L', source: 'Gemiddeld FR', date: 'Q1 2026', auto: false }
  };

  // === ELEKTRICITEIT: live van CRE CSV ===
  try {
    const csvResp = await fetch('https://www.cre.fr/fileadmin/Documents/Open_data/Marches_de_detail/Option_Base.csv');
    if (csvResp.ok) {
      const csv = await csvResp.text();
      const lines = csv.trim().split('\n').map(l => l.trim().replace(/\r/g, ''));
      // Zoek de laatste regel voor 6 kVA (kolom 3 = puissance)
      let latestElec = null;
      let latestDate = null;
      for (let i = lines.length - 1; i >= 0; i--) {
        const cols = lines[i].split(';');
        if (cols.length >= 7 && cols[2] === '6') {
          latestElec = parseFloat(cols[6]); // TTC kWh
          latestDate = cols[0]; // dd/mm/yyyy
          break;
        }
      }
      if (latestElec && latestElec > 0.05 && latestElec < 0.50) {
        const parts = latestDate ? latestDate.split('/') : [];
        const maanden = ['', 'jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
        const dateLabel = parts.length === 3 ? maanden[parseInt(parts[1])] + ' ' + parts[2] : latestDate;
        prices.elec = {
          value: Math.round(latestElec * 10000) / 10000,
          unit: '€/kWh',
          source: 'CRE Open Data TRV Base 6kVA TTC',
          date: dateLabel,
          auto: true
        };
      }
    }
  } catch (e) {
    // Fallback: gebruik hardcoded waarde
  }

  // === GAS: scrape CRE prix repère pagina ===
  try {
    const gasResp = await fetch('https://www.cre.fr/consommateurs/prix-reperes-et-references/prix-repere-de-vente-de-gaz-naturel-a-destination-des-clients-residentiels.html');
    if (gasResp.ok) {
      const html = await gasResp.text();
      // Zoek naar het chauffage-tarief in de pagina: "0,XXXX €/kWh" patroon
      const match = html.match(/chauffage[^]*?(\d+[,.]\d{3,4})\s*€\/kWh/i);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (val > 0.05 && val < 0.30) {
          prices.gas = {
            value: Math.round(val * 10000) / 10000,
            unit: '€/kWh PCI',
            source: 'CRE Prix Repère chauffage (auto)',
            date: new Date().toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }),
            auto: true
          };
        }
      }
    }
  } catch (e) {
    // Fallback: gebruik hardcoded waarde
  }

  return res.status(200).json(prices);
}
