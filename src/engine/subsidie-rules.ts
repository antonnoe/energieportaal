/**
 * subsidie-rules.ts — Subsidie-beslislogica met stoplicht-badges.
 *
 * Elke subsidie krijgt groen/oranje/rood met uitleg WAAROM.
 * Alle functies zijn puur (geen side-effects, geen netwerk-calls).
 *
 * Subsidies:
 *   - MaPrimeRénov' (Geste + Ampleur)
 *   - CEE (Certificats d'Économies d'Énergie)
 *   - Éco-PTZ (Éco-prêt à taux zéro)
 *   - TVA réduite 5,5%
 *   - Lokale steun
 */

import type {
  SubsidieIntake,
  SubsidieCard,
  SubsidieResult,
  StoplichtStatus,
} from './types.ts';

// ─── MaPrimeRénov' Geste ─────────────────────────────────────────────────────

function evalMaPrimeGeste(intake: SubsidieIntake): SubsidieCard {
  let status: StoplichtStatus = 'green';
  let reason = 'U lijkt in aanmerking te komen voor MaPrimeRénov\' Geste.';

  if (intake.stage === 'gestart') {
    status = 'red';
    reason = 'De werken zijn al gestart — MPR\' moet vóór aanvang worden aangevraagd.';
  } else if (intake.usage === 'secondaire') {
    status = 'red';
    reason = 'MPR\' Geste is alleen voor hoofdverblijfplaatsen (résidence principale).';
  } else if (intake.ageGt2 === 'nee') {
    status = 'red';
    reason = 'Woning moet minimaal 2 jaar oud zijn voor MPR\'.';
  } else if (intake.stage === 'getekend') {
    status = 'amber';
    reason = 'Devis al getekend — neem contact op met uw adviseur. MPR\' moet vóór uitvoering worden goedgekeurd.';
  } else if (intake.workType === 'combo' && intake.mprPath !== 'geste') {
    status = 'amber';
    reason = 'Bij combowerken is MPR\' Ampleur gunstiger. Geste is mogelijk maar geeft lagere steun.';
  } else if (intake.usage === 'onbekend' || intake.ageGt2 === 'onbekend') {
    status = 'amber';
    reason = 'Controleer: woning moet hoofdverblijfplaats zijn en ouder dan 2 jaar.';
  }

  return {
    id: 'mpr-geste',
    title: 'MaPrimeRénov\' Geste',
    shortTitle: 'MPR\' Geste',
    status,
    reason,
    amount: 'Tot €15.000 per actie',
    url: 'https://infofrankrijk.com/ma-prime-renov-in-frankrijk-voorwaarden-werking-en-aandachtspunten/',
    eligible: status !== 'red',
  };
}

// ─── MaPrimeRénov' Ampleur ───────────────────────────────────────────────────

function evalMaPrimeAmpleur(intake: SubsidieIntake): SubsidieCard {
  let status: StoplichtStatus = 'green';
  let reason = 'U lijkt in aanmerking te komen voor MaPrimeRénov\' Ampleur.';

  if (intake.stage === 'gestart') {
    status = 'red';
    reason = 'De werken zijn al gestart — MPR\' Ampleur moet vóór aanvang worden aangevraagd.';
  } else if (intake.usage === 'secondaire' || intake.usage === 'verhuur') {
    status = 'red';
    reason = 'MPR\' Ampleur is alleen voor eigenaar-bewoners van de hoofdverblijfplaats.';
  } else if (intake.ageGt2 === 'nee') {
    status = 'red';
    reason = 'Woning moet minimaal 2 jaar oud zijn.';
  } else if (intake.workType !== 'combo' && intake.workType !== 'onbekend') {
    status = 'amber';
    reason = 'MPR\' Ampleur vereist een combinatie van werken (minstens 2 types). Overweeg uw aanpak.';
  } else if (!intake.heatlossDone) {
    status = 'amber';
    reason = 'Een warmteverliesberekening (audit) is verplicht voor MPR\' Ampleur. Nog niet gedaan.';
  } else if (intake.mprPath === 'geste') {
    status = 'amber';
    reason = 'U heeft "Geste" als MPR-traject gekozen — Ampleur vereist een ander traject.';
  } else if (intake.usage === 'onbekend' || intake.ageGt2 === 'onbekend') {
    status = 'amber';
    reason = 'Controleer: woning moet hoofdverblijfplaats zijn en ouder dan 2 jaar.';
  }

  return {
    id: 'mpr-ampleur',
    title: 'MaPrimeRénov\' Ampleur',
    shortTitle: 'MPR\' Ampleur',
    status,
    reason,
    amount: 'Tot €70.000 (≥50% verbetering)',
    url: 'https://infofrankrijk.com/ma-prime-renov-in-frankrijk-voorwaarden-werking-en-aandachtspunten/',
    eligible: status !== 'red',
  };
}

// ─── CEE ─────────────────────────────────────────────────────────────────────

function evalCEE(intake: SubsidieIntake): SubsidieCard {
  let status: StoplichtStatus = 'green';
  let reason = 'CEE-premies zijn cumuleerbaar met MPR\' en staan open voor alle woningen >2 jaar.';

  if (intake.stage === 'getekend') {
    status = 'red';
    reason = 'CEE vereist inschrijving VÓÓR het tekenen van de devis. Contract al getekend = te laat.';
  } else if (intake.stage === 'gestart') {
    status = 'red';
    reason = 'CEE moet worden aangevraagd vóór aanvang van de werken.';
  } else if (intake.ageGt2 === 'nee') {
    status = 'red';
    reason = 'Woning moet ouder dan 2 jaar zijn voor CEE.';
  } else if (intake.ageGt2 === 'onbekend') {
    status = 'amber';
    reason = 'Controleer of uw woning ouder is dan 2 jaar.';
  }

  return {
    id: 'cee',
    title: 'CEE (Certificats d\'Économies d\'Énergie)',
    shortTitle: 'CEE',
    status,
    reason,
    amount: 'Variabel (via energieleverancier)',
    url: 'https://infofrankrijk.com/cee-en-primes-energie-energiebesparingspremies-in-frankrijk-uitgelegd/',
    eligible: status !== 'red',
  };
}

// ─── Éco-PTZ ─────────────────────────────────────────────────────────────────

function evalEcoPtz(intake: SubsidieIntake): SubsidieCard {
  let status: StoplichtStatus = 'green';
  let reason = 'Éco-PTZ is een rentevrije lening tot €50.000 — cumuleerbaar met MPR\'.';

  if (intake.usage === 'secondaire') {
    status = 'red';
    reason = 'Éco-PTZ is alleen voor hoofdverblijfplaatsen (résidence principale).';
  } else if (intake.ageGt2 === 'nee') {
    status = 'red';
    reason = 'Woning moet ouder dan 2 jaar zijn voor Éco-PTZ.';
  } else if (intake.stage === 'gestart') {
    status = 'red';
    reason = 'Éco-PTZ moet vóór aanvang worden aangevraagd.';
  } else if (intake.usage === 'onbekend' || intake.ageGt2 === 'onbekend') {
    status = 'amber';
    reason = 'Controleer of uw woning een hoofdverblijfplaats is en ouder dan 2 jaar.';
  }

  return {
    id: 'eco-ptz',
    title: 'Éco-prêt à taux zéro (Éco-PTZ)',
    shortTitle: 'Éco-PTZ',
    status,
    reason,
    amount: 'Tot €50.000 rentevrij',
    url: 'https://infofrankrijk.com/eco-ptz-renteloze-lening-voor-energierenovatie-in-frankrijk/',
    eligible: status !== 'red',
  };
}

// ─── TVA 5,5% ────────────────────────────────────────────────────────────────

function evalTvaReduite(intake: SubsidieIntake): SubsidieCard {
  let status: StoplichtStatus = 'green';
  let reason = 'TVA 5,5% geldt automatisch voor erkende renovatiewerken aan woningen >2 jaar.';

  if (intake.ageGt2 === 'nee') {
    status = 'red';
    reason = 'Woning moet ouder dan 2 jaar zijn voor TVA 5,5%.';
  } else if (intake.stage === 'gestart') {
    status = 'amber';
    reason = 'Werken gestart — controleer of uw aannemer het verlaagd tarief al heeft toegepast.';
  } else if (intake.workType === 'onbekend') {
    status = 'amber';
    reason = 'Type werk onzeker — niet alle werkzaamheden komen in aanmerking voor TVA 5,5%.';
  } else if (intake.ageGt2 === 'onbekend') {
    status = 'amber';
    reason = 'Controleer of uw woning ouder is dan 2 jaar.';
  }

  return {
    id: 'tva',
    title: 'TVA réduite 5,5%',
    shortTitle: 'TVA 5,5%',
    status,
    reason,
    amount: '5,5% i.p.v. 20% BTW',
    url: 'https://infofrankrijk.com/tva-a-55-bij-renovatie-in-frankrijk-wanneer-geldt-het-lage-btw-tarief/',
    eligible: status !== 'red',
  };
}

// ─── Lokale steun ────────────────────────────────────────────────────────────

function evalLokaalSteun(): SubsidieCard {
  return {
    id: 'lokaal',
    title: 'Lokale subsidies (gemeente/departement/regio)',
    shortTitle: 'Lokaal',
    status: 'amber',
    reason: 'Lokale subsidies variëren per gemeente en regio. Neem contact op met uw mairie of ADIL.',
    amount: 'Variabel per gemeente',
    url: 'https://infofrankrijk.com/lokale-subsidies-voor-energierenovatie-in-frankrijk-zo-vindt-u-wat-er-geldt/',
    eligible: true,
  };
}

// ─── Actieplan generator ─────────────────────────────────────────────────────

function buildActionPlan(intake: SubsidieIntake, cards: SubsidieCard[]): string[] {
  const plan: string[] = [];

  if (intake.stage === 'voor' || intake.stage === 'offertes') {
    plan.push('1. Vraag een gecertificeerde energieadviseur (Mon Accompagnateur Rénov\') aan via France Rénov\'.');

    if (!intake.heatlossDone) {
      plan.push('2. Laat een warmteverliesberekening (audit énergétique) uitvoeren — verplicht voor MPR\' Ampleur.');
    }

    const stepBase = intake.heatlossDone ? 2 : 3;
    const eligible = cards.filter((c) => c.eligible).map((c) => c.shortTitle);

    if (eligible.length > 0) {
      plan.push(`${stepBase}. Dien een aanvraag in bij: ${eligible.join(', ')} — doe dit VOOR aanvang van de werken.`);
    }

    plan.push(`${stepBase + 1}. Kies een RGE-gecertificeerde aannemer (verplicht voor subsidies).`);
    plan.push(`${stepBase + 2}. Voer de werken uit en bewaar alle facturen voor verrekening.`);
  } else if (intake.stage === 'getekend') {
    plan.push('1. Contract ondertekend — CEE is waarschijnlijk niet meer mogelijk (vereist inschrijving vóór tekenen).');
    plan.push('2. MPR\' kan nog aangevraagd worden als de werken nog niet zijn gestart.');
    plan.push('3. Éco-PTZ kan ook nog worden aangevraagd vóór start werken.');
  } else if (intake.stage === 'gestart') {
    plan.push('1. Werken gestart — de meeste premies zijn helaas niet meer aanvraagbaar.');
    plan.push('2. Controleer bij uw aannemer of TVA 5,5% correct is verwerkt op de factuur.');
    plan.push('3. Informeer bij uw mairie naar eventuele lokale steun die achteraf kan worden aangevraagd.');
  }

  return plan;
}

// ─── Hoofdfunctie ────────────────────────────────────────────────────────────

/**
 * Evalueer alle subsidies op basis van de intake.
 * Retourneert kaarten met stoplicht-status + een actieplan.
 */
export function evaluateSubsidie(intake: SubsidieIntake): SubsidieResult {
  const cards: SubsidieCard[] = [
    evalMaPrimeGeste(intake),
    evalMaPrimeAmpleur(intake),
    evalCEE(intake),
    evalEcoPtz(intake),
    evalTvaReduite(intake),
    evalLokaalSteun(),
  ];

  const actionPlan = buildActionPlan(intake, cards);

  return { cards, actionPlan };
}
