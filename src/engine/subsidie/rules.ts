/**
 * rules.ts — Subsidy / Finance eligibility rule engine.
 * All functions are pure and deterministic (no network calls here).
 *
 * Modelled on French energy renovation aid rules (2024/2025):
 *  - MaPrimeRénov' Geste (single action)
 *  - MaPrimeRénov' Ampleur (comprehensive)
 *  - CEE (Certificats d'Économies d'Énergie)
 *  - Éco-prêt à taux zéro (Éco-PTZ)
 *  - TVA réduite 5,5 %
 */

export type UsageType = 'rp' | 'secondaire' | 'verhuur' | 'onbekend';
export type AgeType = 'ja' | 'nee' | 'onbekend';
export type StageType = 'voor' | 'offertes' | 'getekend' | 'gestart';
export type WorkType = 'envelop' | 'ventilatie' | 'verwarming' | 'combo' | 'onbekend';
export type MprPath = 'geste' | 'ampleur' | 'onbekend';
export type StoplightStatus = 'green' | 'amber' | 'red';

export interface SubsidieIntake {
  usage: UsageType;
  ageGt2: AgeType;       // woning > 2 jaar oud?
  stage: StageType;      // fase van de werken
  workType: WorkType;
  mprPath: MprPath;
  heatlossDone: boolean; // warmteverliesberekening uitgevoerd?
}

export interface SubsidieCard {
  id: string;
  title: string;
  shortTitle: string;
  status: StoplightStatus;
  reason: string;
  amount: string;
  url: string;
  eligible: boolean;
}

export interface SubsidieResult {
  cards: SubsidieCard[];
  actionPlan: string[];
}

// ─── Individual rule functions ─────────────────────────────────────────────────

function evalMaPrimeGeste(intake: SubsidieIntake): SubsidieCard {
  const { usage, ageGt2, stage, workType, mprPath } = intake;

  let status: StoplightStatus = 'green';
  let reason = 'U lijkt in aanmerking te komen voor MaPrimeRénov\' Geste.';

  if (stage === 'gestart') {
    status = 'red';
    reason = 'De werken zijn al gestart — MPR\' Geste moet vóór aanvang worden aangevraagd.';
  } else if (usage === 'secondaire') {
    status = 'red';
    reason = 'MPR\' Geste is alleen voor hoofdverblijfplaatsen (résidence principale).';
  } else if (workType === 'combo' && mprPath !== 'geste') {
    status = 'amber';
    reason = 'Bij combowerken is MPR\' Ampleur gunstiger. Geste is mogelijk maar geeft lagere steun.';
  } else if (usage === 'onbekend' || ageGt2 === 'onbekend') {
    status = 'amber';
    reason = 'Controleer: woning moet hoofdverblijfplaats zijn en ouder dan 2 jaar.';
  } else if (ageGt2 === 'nee') {
    status = 'red';
    reason = 'Woning moet minimaal 2 jaar oud zijn.';
  } else if (stage === 'getekend') {
    status = 'amber';
    reason = 'Aanbestedingsovereenkomst is al ondertekend — neem contact op met uw adviseur.';
  }

  return {
    id: 'mpr-geste',
    title: 'MaPrimeRénov\' Geste',
    shortTitle: 'MPR\' Geste',
    status,
    reason,
    amount: 'Tot € 15.000 per actie',
    url: 'https://www.maprimerenov.gouv.fr',
    eligible: status !== 'red',
  };
}

function evalMaPrimeAmpleur(intake: SubsidieIntake): SubsidieCard {
  const { usage, ageGt2, stage, workType, mprPath, heatlossDone } = intake;

  let status: StoplightStatus = 'green';
  let reason = 'U lijkt in aanmerking te komen voor MaPrimeRénov\' Ampleur.';

  if (stage === 'gestart') {
    status = 'red';
    reason = 'De werken zijn al gestart — MPR\' Ampleur moet vóór aanvang worden aangevraagd.';
  } else if (usage === 'secondaire' || usage === 'verhuur') {
    status = 'red';
    reason = 'MPR\' Ampleur is alleen voor eigenaar-bewoners van de hoofdverblijfplaats.';
  } else if (workType !== 'combo' && workType !== 'onbekend') {
    status = 'amber';
    reason = 'MPR\' Ampleur vereist een combinatie van werken (minstens 2 types). Overweeg uw aanpak.';
  } else if (!heatlossDone) {
    status = 'amber';
    reason = 'Een warmteverliesberekening (audit) is verplicht voor MPR\' Ampleur. Nog niet gedaan.';
  } else if (mprPath === 'geste') {
    status = 'amber';
    reason = 'U heeft "Geste" als MPR-traject gekozen — Ampleur vereist een ander traject.';
  } else if (usage === 'onbekend' || ageGt2 === 'onbekend') {
    status = 'amber';
    reason = 'Controleer: woning moet hoofdverblijfplaats zijn en ouder dan 2 jaar.';
  } else if (ageGt2 === 'nee') {
    status = 'red';
    reason = 'Woning moet minimaal 2 jaar oud zijn.';
  }

  return {
    id: 'mpr-ampleur',
    title: 'MaPrimeRénov\' Ampleur',
    shortTitle: 'MPR\' Ampleur',
    status,
    reason,
    amount: 'Tot € 70.000 (≥ 50% verbetering)',
    url: 'https://www.maprimerenov.gouv.fr',
    eligible: status !== 'red',
  };
}

function evalCEE(intake: SubsidieIntake): SubsidieCard {
  const { ageGt2, stage } = intake;

  let status: StoplightStatus = 'green';
  let reason = 'CEE-premies zijn cumuleerbaar met MPR\' en staan open voor alle woningen.';

  if (stage === 'gestart') {
    status = 'red';
    reason = 'CEE moet worden aangevraagd vóór aanvang van de werken.';
  } else if (stage === 'getekend') {
    status = 'amber';
    reason = 'Contract al ondertekend? Controleer of uw aannemer de CEE-aanvraag al heeft ingediend.';
  } else if (ageGt2 === 'nee') {
    status = 'red';
    reason = 'Woning moet ouder dan 2 jaar zijn voor CEE.';
  } else if (ageGt2 === 'onbekend') {
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
    url: 'https://www.ecologie.gouv.fr/dispositif-des-certificats-deconomies-denergie',
    eligible: status !== 'red',
  };
}

function evalEcoPtz(intake: SubsidieIntake): SubsidieCard {
  const { usage, ageGt2, stage } = intake;

  let status: StoplightStatus = 'green';
  let reason = 'Éco-PTZ is een rentevrije lening — cumuleerbaar met MPR\'.';

  if (stage === 'gestart') {
    status = 'red';
    reason = 'Éco-PTZ moet vóór aanvang worden aangevraagd.';
  } else if (usage === 'secondaire') {
    status = 'red';
    reason = 'Éco-PTZ is alleen voor hoofdverblijfplaatsen.';
  } else if (ageGt2 === 'nee') {
    status = 'red';
    reason = 'Woning moet ouder dan 2 jaar zijn.';
  } else if (usage === 'onbekend' || ageGt2 === 'onbekend') {
    status = 'amber';
    reason = 'Controleer of uw woning een hoofdverblijfplaats is en ouder dan 2 jaar.';
  }

  return {
    id: 'eco-ptz',
    title: 'Éco-prêt à taux zéro (Éco-PTZ)',
    shortTitle: 'Éco-PTZ',
    status,
    reason,
    amount: 'Tot € 50.000 rentevrij',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F19905',
    eligible: status !== 'red',
  };
}

function evalTvaReduite(intake: SubsidieIntake): SubsidieCard {
  const { usage, ageGt2, stage } = intake;

  let status: StoplightStatus = 'green';
  let reason = 'TVA 5,5% geldt voor alle erkende renovatiewerken aan woningen > 2 jaar.';

  if (stage === 'gestart') {
    status = 'amber';
    reason = 'Werken gestart — controleer of uw aannemer het verlaagd tarief al heeft toegepast.';
  } else if (ageGt2 === 'nee') {
    status = 'red';
    reason = 'Woning moet ouder dan 2 jaar zijn voor TVA 5,5%.';
  } else if (usage === 'onbekend' || ageGt2 === 'onbekend') {
    status = 'amber';
    reason = 'Controleer of uw woning ouder is dan 2 jaar.';
  }

  return {
    id: 'tva',
    title: 'TVA réduite 5,5 %',
    shortTitle: 'TVA 5,5%',
    status,
    reason,
    amount: '5,5% i.p.v. 20% BTW',
    url: 'https://www.impots.gouv.fr/particulier/les-travaux-de-renovation-energetique',
    eligible: status !== 'red',
  };
}

// ─── Action plan generator ────────────────────────────────────────────────────

function buildActionPlan(intake: SubsidieIntake, cards: SubsidieCard[]): string[] {
  const plan: string[] = [];

  if (intake.stage === 'voor' || intake.stage === 'offertes') {
    plan.push('1. Vraag een gecertificeerde energieadviseur (Mon Accompagnateur Rénov\') aan via France Rénov\'.');
    if (!intake.heatlossDone) {
      plan.push('2. Laat een warmteverliesberekening (audit énergétique) uitvoeren — verplicht voor MPR\' Ampleur.');
    }
    const eligible = cards.filter((c) => c.eligible).map((c) => c.shortTitle);
    if (eligible.length > 0) {
      plan.push(`${!intake.heatlossDone ? '3' : '2'}. Dien een aanvraag in bij: ${eligible.join(', ')} — doe dit VOOR aanvang van de werken.`);
    }
    plan.push(`${!intake.heatlossDone ? '4' : '3'}. Kies een RGE-gecertificeerde aannemer.`);
    plan.push(`${!intake.heatlossDone ? '5' : '4'}. Voer de werken uit en bewaar alle facturen voor verrekening.`);
  } else if (intake.stage === 'getekend') {
    plan.push('1. Contract ondertekend — controleer of CEE al door de aannemer is aangevraagd.');
    plan.push('2. MPR\' kan nog aangevraagd worden indien vóór aanvang van de werken.');
  } else if (intake.stage === 'gestart') {
    plan.push('1. Werken gestart — de meeste premies zijn helaas niet meer aanvraagbaar.');
    plan.push('2. Controleer bij uw aannemer of CEE en TVA 5,5% correct zijn verwerkt.');
  }

  return plan;
}

// ─── Main evaluate function ───────────────────────────────────────────────────

export function evaluateSubsidie(intake: SubsidieIntake): SubsidieResult {
  const cards: SubsidieCard[] = [
    evalMaPrimeGeste(intake),
    evalMaPrimeAmpleur(intake),
    evalCEE(intake),
    evalEcoPtz(intake),
    evalTvaReduite(intake),
  ];

  const actionPlan = buildActionPlan(intake, cards);

  return { cards, actionPlan };
}
