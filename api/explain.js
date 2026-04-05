// api/explain.js — Vercel serverless function for AI explanation
// Uses Anthropic Claude to explain energy results in plain Dutch

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key niet geconfigureerd.' });
  }

  try {
    const data = req.body;
    const zoneNames = {
      med: 'Middellandse Zeekust', ouest: 'Zuid-West / Atlantisch',
      paris: 'Noord / Parijs', centre: 'Centraal Frankrijk',
      est: 'Oost-Frankrijk', mont: 'Berggebied'
    };
    const heatNames = {
      hp: 'warmtepomp', elec: 'elektrische verwarming', gas: 'gasketel',
      fioul: 'stookolieketel', pellet: 'pelletketel', wood: 'houtkachel'
    };

    const prompt = `Je bent een energieadviseur voor Nederlandse huiseigenaren in Frankrijk. 
Leg in 4-6 zinnen uit wat de resultaten van deze energieberekening betekenen. 
Gebruik gewone taal, geen jargon. Geef 1-2 concrete tips voor besparing.
Wees eerlijk en praktisch. Geen overdrijvingen.

Gegevens:
- Zone: ${zoneNames[data.zone] || data.zone}
- Volume: ${data.volume} m³, aanwezig ${data.presentDays} dagen/jaar
- Hoofdverwarming: ${heatNames[data.mainType] || data.mainType}
- Bijverwarming: ${heatNames[data.auxType] || data.auxType || 'geen'}
- Isolatie muren U=${data.wallU}, dak U=${data.roofU}, vloer U=${data.floorU}, ramen U=${data.winU}
- Totale jaarkosten: €${Math.round(data.totalCost)}
- Per maand: €${Math.round(data.perMonth)}
- Warmtevraag: ${Math.round(data.heatDemand)} kWh/jaar
- Transmissieverlies H=${Math.round(data.debug?.UA || 0)} W/K
- Ventilatieverlies H=${Math.round(data.debug?.HventEff || 0)} W/K
- Kosten verwarming: €${Math.round(data.costs?.verwarming || 0)}
- Kosten warm water: €${Math.round(data.costs?.tapwater || 0)}
- Kosten apparaten: €${Math.round(data.costs?.apparaten || 0)}

Antwoord in het Nederlands. Maximaal 150 woorden.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const result = await response.json();
    const text = result.content?.[0]?.text || 'Geen uitleg beschikbaar.';

    return res.status(200).json({ explanation: text });
  } catch (err) {
    return res.status(500).json({ error: 'Fout bij het genereren van de uitleg: ' + err.message });
  }
}
