/**
 * dept-zone-map.ts — Département → klimaatzone mapping.
 *
 * Postcode → eerste 2 cijfers → département → zone.
 * Alle ~100 Franse departementen worden hier aan één van de 6 klimaatzones gekoppeld.
 *
 * Zones: med, ouest, paris, centre, est, mont
 */

/**
 * Mapping van département-nummer (string) naar zone-ID.
 * Speciale gevallen: '2A' en '2B' voor Corsica.
 */
export const DEPT_ZONE_MAP: Record<string, string> = {
  // ── Méditerranée (med) — HDD ~1400 ──
  '06': 'med',    // Alpes-Maritimes (Nice)
  '11': 'med',    // Aude (Narbonne, Carcassonne)
  '13': 'med',    // Bouches-du-Rhône (Marseille, Aix)
  '2A': 'med',    // Corse-du-Sud (Ajaccio)
  '2B': 'med',    // Haute-Corse (Bastia)
  '30': 'med',    // Gard (Nîmes)
  '34': 'med',    // Hérault (Montpellier)
  '66': 'med',    // Pyrénées-Orientales (Perpignan)
  '83': 'med',    // Var (Toulon, Saint-Raphaël)
  '84': 'med',    // Vaucluse (Avignon)

  // ── Zuid-West / Atlantisch (ouest) — HDD ~1900 ──
  '09': 'ouest',  // Ariège
  '12': 'ouest',  // Aveyron (Rodez)
  '16': 'ouest',  // Charente (Angoulême)
  '17': 'ouest',  // Charente-Maritime (La Rochelle)
  '24': 'ouest',  // Dordogne (Périgord)
  '31': 'ouest',  // Haute-Garonne (Toulouse)
  '32': 'ouest',  // Gers
  '33': 'ouest',  // Gironde (Bordeaux)
  '40': 'ouest',  // Landes
  '46': 'ouest',  // Lot (Cahors)
  '47': 'ouest',  // Lot-et-Garonne (Agen)
  '64': 'ouest',  // Pyrénées-Atlantiques (Bayonne, Pau)
  '65': 'ouest',  // Hautes-Pyrénées (Tarbes)
  '79': 'ouest',  // Deux-Sèvres (Niort)
  '81': 'ouest',  // Tarn (Albi)
  '82': 'ouest',  // Tarn-et-Garonne (Montauban)
  '85': 'ouest',  // Vendée
  '86': 'ouest',  // Vienne (Poitiers)
  '87': 'ouest',  // Haute-Vienne (Limoges)

  // ── Noord / Parijs (paris) — HDD ~2200 ──
  '02': 'paris',  // Aisne (Laon)
  '14': 'paris',  // Calvados (Caen)
  '22': 'paris',  // Côtes-d'Armor (Saint-Brieuc)
  '27': 'paris',  // Eure (Évreux)
  '28': 'paris',  // Eure-et-Loir (Chartres)
  '29': 'paris',  // Finistère (Brest, Quimper)
  '35': 'paris',  // Ille-et-Vilaine (Rennes)
  '37': 'paris',  // Indre-et-Loire (Tours)
  '41': 'paris',  // Loir-et-Cher (Blois)
  '44': 'paris',  // Loire-Atlantique (Nantes)
  '45': 'paris',  // Loiret (Orléans)
  '49': 'paris',  // Maine-et-Loire (Angers)
  '50': 'paris',  // Manche (Saint-Lô)
  '53': 'paris',  // Mayenne (Laval)
  '56': 'paris',  // Morbihan (Vannes)
  '59': 'paris',  // Nord (Lille)
  '60': 'paris',  // Oise (Beauvais)
  '61': 'paris',  // Orne (Alençon)
  '62': 'paris',  // Pas-de-Calais (Arras)
  '72': 'paris',  // Sarthe (Le Mans)
  '75': 'paris',  // Paris
  '76': 'paris',  // Seine-Maritime (Rouen, Le Havre)
  '77': 'paris',  // Seine-et-Marne (Melun)
  '78': 'paris',  // Yvelines (Versailles)
  '80': 'paris',  // Somme (Amiens)
  '91': 'paris',  // Essonne (Évry)
  '92': 'paris',  // Hauts-de-Seine (Nanterre)
  '93': 'paris',  // Seine-Saint-Denis (Bobigny)
  '94': 'paris',  // Val-de-Marne (Créteil)
  '95': 'paris',  // Val-d'Oise (Cergy-Pontoise)

  // ── Centraal / Bourgogne (centre) — HDD ~2500 ──
  '03': 'centre', // Allier (Moulins)
  '15': 'centre', // Cantal (Aurillac)
  '18': 'centre', // Cher (Bourges)
  '19': 'centre', // Corrèze (Tulle)
  '21': 'centre', // Côte-d'Or (Dijon)
  '23': 'centre', // Creuse (Guéret)
  '36': 'centre', // Indre (Châteauroux)
  '42': 'centre', // Loire (Saint-Étienne)
  '43': 'centre', // Haute-Loire (Le Puy)
  '48': 'centre', // Lozère (Mende)
  '58': 'centre', // Nièvre (Nevers)
  '63': 'centre', // Puy-de-Dôme (Clermont-Ferrand)
  '69': 'centre', // Rhône (Lyon)
  '71': 'centre', // Saône-et-Loire (Mâcon)

  // ── Oost / Elzas-Lotharingen (est) — HDD ~2800 ──
  '08': 'est',    // Ardennes (Charleville-Mézières)
  '10': 'est',    // Aube (Troyes)
  '25': 'est',    // Doubs (Besançon)
  '39': 'est',    // Jura (Lons-le-Saunier)
  '51': 'est',    // Marne (Reims, Châlons)
  '52': 'est',    // Haute-Marne (Chaumont)
  '54': 'est',    // Meurthe-et-Moselle (Nancy)
  '55': 'est',    // Meuse (Bar-le-Duc)
  '57': 'est',    // Moselle (Metz)
  '67': 'est',    // Bas-Rhin (Strasbourg)
  '68': 'est',    // Haut-Rhin (Colmar, Mulhouse)
  '70': 'est',    // Haute-Saône (Vesoul)
  '88': 'est',    // Vosges (Épinal)
  '89': 'est',    // Yonne (Auxerre)
  '90': 'est',    // Territoire de Belfort

  // ── Bergen (mont) — HDD ~3400 ──
  '01': 'mont',   // Ain (Bourg-en-Bresse, Pays de Gex)
  '04': 'mont',   // Alpes-de-Haute-Provence (Digne)
  '05': 'mont',   // Hautes-Alpes (Gap, Briançon)
  '07': 'mont',   // Ardèche (Privas)
  '26': 'mont',   // Drôme (Valence)
  '38': 'mont',   // Isère (Grenoble)
  '73': 'mont',   // Savoie (Chambéry)
  '74': 'mont',   // Haute-Savoie (Annecy)
};

/**
 * Haal de zone-ID op vanuit een postcode.
 * Postcode → eerste 2 cijfers → département → zone.
 *
 * Speciale gevallen:
 *   - Corsica: postcode begint met '20' → '2A' of '2B'
 *     (postcodes 20000–20199 = 2A, 20200+ = 2B)
 *   - DOM-TOM (97x): default naar 'med'
 */
export function getZoneIdFromPostcode(postcode: string): string {
  const trimmed = postcode.trim();
  if (trimmed.length < 2) return 'paris'; // fallback

  const prefix = trimmed.substring(0, 2);

  // Corsica
  if (prefix === '20') {
    const numPostcode = parseInt(trimmed, 10);
    if (numPostcode >= 20200) {
      return DEPT_ZONE_MAP['2B'] ?? 'med';
    }
    return DEPT_ZONE_MAP['2A'] ?? 'med';
  }

  // DOM-TOM
  if (prefix === '97') {
    return 'med'; // tropisch, benaderen als warm klimaat
  }

  return DEPT_ZONE_MAP[prefix] ?? 'paris'; // fallback naar paris
}

/**
 * Haal département-nummer op uit een postcode.
 */
export function getDepartementFromPostcode(postcode: string): string {
  const trimmed = postcode.trim();
  if (trimmed.length < 2) return '';

  const prefix = trimmed.substring(0, 2);

  // Corsica
  if (prefix === '20') {
    const numPostcode = parseInt(trimmed, 10);
    return numPostcode >= 20200 ? '2B' : '2A';
  }

  return prefix;
}
