// api/prices.js — Actuele Franse energieprijzen (Vercel serverless)
// Elektriciteit + gas: live van CRE Open Data
// Overige: referentiewaarden met staleness-detectie
// Geen publieke API beschikbaar voor fioul, hout, pellet, propaan

const STALE_DAYS = 120; // 4 maanden — markeer als verouderd

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const now = new Date();
  const prices = {
    updated: now.toISOString().slice(0, 10),
    elec:      { value: 0.194,  unit: '€/kWh',   source: 'CRE TRV Base 6kVA TTC',    date: 'feb 2026', refDate: '2026-02-01', auto: false },
    gas:       { value: 0.1051, unit: '€/kWh PCI',source: 'CRE Prix Repère chauffage', date: 'apr 2026', refDate: '2026-04-01', auto: false },
    fioul:     { value: 1.19,   unit: '€/L',      source: 'DGEC Pégase + FioulReduc',  date: 'mrt 2026', refDate: '2026-03-01', auto: false },
    pellet:    { value: 0.60,   unit: '€/kg',     source: 'ADEME + propellet.fr',       date: 'Q1 2026',  refDate: '2026-01-01', auto: false },
    wood:      { value: 85,     unit: '€/stère',  source: 'ADEME Baromètre bois',       date: '2025',     refDate: '2025-09-01', auto: false },
    propaan:   { value: 1.90,   unit: '€/L',      source: 'DGEC Pégase GPL',            date: 'Q1 2026',  refDate: '2026-01-01', auto: false },
    petroleum: { value: 2.00,   unit: '€/L',      source: 'Gemiddeld FR',               date: 'Q1 2026',  refDate: '2026-01-01', auto: false }
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
        if (cols.length >= 7 && cols[2] === '6') {
          latestElec = parseFloat(cols[6]);
          latestDate = cols[0];
          break;
        }
      }
      if (latestElec && latestElec > 0.05 && latestElec < 0.50) {
        const parts = latestDate ? latestDate.split('/') : [];
        const maanden = ['', 'jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
        const dateLabel = parts.length === 3 ? maanden[parseInt(parts[1])] + ' ' + parts[2] : latestDate;
        const isoDate = parts.length === 3 ? parts[2] + '-' + parts[1].padStart(2,'0') + '-' + parts[0].padStart(2,'0') : prices.elec.refDate;
        prices.elec = { value: Math.round(latestElec * 10000) / 10000, unit: '€/kWh', source: 'CRE Open Data TRV Base 6kVA TTC', date: dateLabel, refDate: isoDate, auto: true };
      }
    }
  } catch (e) { /* fallback */ }

  // === GAS: scrape CRE prix repère pagina ===
  try {
    const gasResp = await fetch('https://www.cre.fr/consommateurs/prix-reperes-et-references/prix-repere-de-vente-de-gaz-naturel-a-destination-des-clients-residentiels.html');
    if (gasResp.ok) {
      const html = await gasResp.text();
      const match = html.match(/chauffage[^]*?(\d+[,.]\d{3,4})\s*€\/kWh/i);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (val > 0.05 && val < 0.30) {
          const dateLabel = now.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
          prices.gas = { value: Math.round(val * 10000) / 10000, unit: '€/kWh PCI', source: 'CRE Prix Repère chauffage', date: dateLabel, refDate: now.toISOString().slice(0,10), auto: true };
        }
      }
    }
  } catch (e) { /* fallback */ }

  // === FIOUL: scrape Sodif Fioul E.Leclerc ===
  try {
    const fioulResp = await fetch('https://www.sodif.fioul.leclerc/calcul-prix-fioul');
    if (fioulResp.ok) {
      const html = await fioulResp.text();
      // Zoek de prijs voor 1000-1999L (meest representatief voor huishouden)
      // Patroon in de tabel: "de 1000 à 1999 L" gevolgd door "X.XXX €TTC"
      const match = html.match(/1000\s*[àa]\s*1999\s*L[^]*?(\d+[,.]\d{2,3})\s*€\s*TTC/i);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (val > 0.50 && val < 3.00) {
          const dateLabel = now.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
          prices.fioul = { value: Math.round(val * 1000) / 1000, unit: '€/L', source: 'Sodif Fioul E.Leclerc (1000-1999L, IdF)', date: dateLabel, refDate: now.toISOString().slice(0,10), auto: true };
        }
      }
    }
  } catch (e) { /* fallback */ }

  // === PELLET: scrape Proxi-TotalEnergies ===
  try {
    const pelletResp = await fetch('https://www.proxi-totalenergies.fr/prix-pellets');
    if (pelletResp.ok) {
      const html = await pelletResp.text();
      // Zoek "X,XX € au kg" of "X,XX € / Kg"
      const match = html.match(/(\d+[,.]\d+)\s*€\s*(?:au|\/)\s*[Kk]g/);
      if (match) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (val > 0.20 && val < 1.50) {
          const dateLabel = now.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
          prices.pellet = { value: Math.round(val * 1000) / 1000, unit: '€/kg', source: 'Proxi-TotalEnergies', date: dateLabel, refDate: now.toISOString().slice(0,10), auto: true };
        }
      }
    }
  } catch (e) { /* fallback */ }

  // === PROPAAN: scrape lepropane.com (gemiddelde €/tonne → €/L) ===
  try {
    const propResp = await fetch('https://lepropane.com/citernes/prix/cours');
    if (propResp.ok) {
      const html = await propResp.text();
      // Zoek "prix moyen ... XXXX €"
      const match = html.match(/prix\s*moyen[^.]*?(\d[\d\s]*)\s*€/i);
      if (match) {
        const tonnePrix = parseFloat(match[1].replace(/\s/g, ''));
        // 1 tonne propaan ≈ 1960 liter (dichtheid 0.51 kg/L)
        if (tonnePrix > 1000 && tonnePrix < 5000) {
          const litrePrice = Math.round((tonnePrix / 1960) * 1000) / 1000;
          const dateLabel = now.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
          prices.propaan = { value: litrePrice, unit: '€/L', source: 'lepropane.com (gem. €/t → €/L)', date: dateLabel, refDate: now.toISOString().slice(0,10), auto: true };
        }
      }
    }
  } catch (e) { /* fallback */ }

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
    ? staleItems.length + ' prijs(zen) ouder dan ' + STALE_DAYS + ' dagen: ' + staleItems.join(', ')
    : null;

  return res.status(200).json(prices);
}
