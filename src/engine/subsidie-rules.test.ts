/**
 * subsidie-rules.test.ts — Unit tests voor subsidie-beslislogica.
 * Test elke stoplicht-combinatie.
 */

import { describe, it, expect } from 'vitest';
import { evaluateSubsidie } from './subsidie-rules.ts';
import type { SubsidieIntake } from './types.ts';

function makeIntake(overrides: Partial<SubsidieIntake> = {}): SubsidieIntake {
  return {
    usage: 'rp',
    ageGt2: 'ja',
    stage: 'voor',
    workType: 'envelop',
    mprPath: 'geste',
    heatlossDone: false,
    ...overrides,
  };
}

describe('evaluateSubsidie', () => {
  it('geeft 6 kaarten terug (incl. lokale steun)', () => {
    const result = evaluateSubsidie(makeIntake());
    expect(result.cards).toHaveLength(6);
    expect(result.cards.map((c) => c.id)).toContain('lokaal');
  });

  it('geeft een actieplan terug', () => {
    const result = evaluateSubsidie(makeIntake());
    expect(result.actionPlan.length).toBeGreaterThan(0);
  });
});

// ─── MaPrimeRénov' Geste ─────────────────────────────────────────────────────

describe('MaPrimeRénov\' Geste', () => {
  function getGeste(intake: Partial<SubsidieIntake> = {}) {
    return evaluateSubsidie(makeIntake(intake)).cards.find((c) => c.id === 'mpr-geste')!;
  }

  it('groen bij résidence principale, >2j, vóór start', () => {
    const card = getGeste({ usage: 'rp', ageGt2: 'ja', stage: 'voor' });
    expect(card.status).toBe('green');
    expect(card.eligible).toBe(true);
  });

  it('rood als werken al gestart', () => {
    const card = getGeste({ stage: 'gestart' });
    expect(card.status).toBe('red');
    expect(card.eligible).toBe(false);
  });

  it('rood bij secondaire woning', () => {
    const card = getGeste({ usage: 'secondaire' });
    expect(card.status).toBe('red');
  });

  it('rood als woning < 2 jaar', () => {
    const card = getGeste({ ageGt2: 'nee' });
    expect(card.status).toBe('red');
  });

  it('oranje bij devis getekend', () => {
    const card = getGeste({ stage: 'getekend' });
    expect(card.status).toBe('amber');
  });

  it('oranje bij onbekend gebruik', () => {
    const card = getGeste({ usage: 'onbekend' });
    expect(card.status).toBe('amber');
  });
});

// ─── MaPrimeRénov' Ampleur ───────────────────────────────────────────────────

describe('MaPrimeRénov\' Ampleur', () => {
  function getAmpleur(intake: Partial<SubsidieIntake> = {}) {
    return evaluateSubsidie(makeIntake(intake)).cards.find((c) => c.id === 'mpr-ampleur')!;
  }

  it('rood als werken gestart', () => {
    const card = getAmpleur({ stage: 'gestart' });
    expect(card.status).toBe('red');
  });

  it('rood bij secondaire of verhuur', () => {
    expect(getAmpleur({ usage: 'secondaire' }).status).toBe('red');
    expect(getAmpleur({ usage: 'verhuur' }).status).toBe('red');
  });

  it('rood als woning < 2 jaar', () => {
    expect(getAmpleur({ ageGt2: 'nee' }).status).toBe('red');
  });

  it('oranje als geen combowerk', () => {
    const card = getAmpleur({ workType: 'verwarming', mprPath: 'ampleur' });
    expect(card.status).toBe('amber');
  });

  it('oranje als warmteverliesberekening niet gedaan', () => {
    const card = getAmpleur({ workType: 'combo', mprPath: 'ampleur', heatlossDone: false });
    expect(card.status).toBe('amber');
  });

  it('groen bij combowerk, audit gedaan, résidence principale', () => {
    const card = getAmpleur({
      workType: 'combo',
      mprPath: 'ampleur',
      heatlossDone: true,
      usage: 'rp',
      ageGt2: 'ja',
      stage: 'voor',
    });
    expect(card.status).toBe('green');
  });
});

// ─── CEE ─────────────────────────────────────────────────────────────────────

describe('CEE', () => {
  function getCEE(intake: Partial<SubsidieIntake> = {}) {
    return evaluateSubsidie(makeIntake(intake)).cards.find((c) => c.id === 'cee')!;
  }

  it('rood als devis al getekend', () => {
    expect(getCEE({ stage: 'getekend' }).status).toBe('red');
  });

  it('rood als werken gestart', () => {
    expect(getCEE({ stage: 'gestart' }).status).toBe('red');
  });

  it('rood als woning < 2 jaar', () => {
    expect(getCEE({ ageGt2: 'nee' }).status).toBe('red');
  });

  it('oranje als leeftijd onbekend', () => {
    expect(getCEE({ ageGt2: 'onbekend' }).status).toBe('amber');
  });

  it('groen in ideale situatie', () => {
    expect(getCEE({ stage: 'voor', ageGt2: 'ja' }).status).toBe('green');
  });
});

// ─── Éco-PTZ ─────────────────────────────────────────────────────────────────

describe('Éco-PTZ', () => {
  function getPTZ(intake: Partial<SubsidieIntake> = {}) {
    return evaluateSubsidie(makeIntake(intake)).cards.find((c) => c.id === 'eco-ptz')!;
  }

  it('rood bij secondaire woning', () => {
    expect(getPTZ({ usage: 'secondaire' }).status).toBe('red');
  });

  it('rood als woning < 2 jaar', () => {
    expect(getPTZ({ ageGt2: 'nee' }).status).toBe('red');
  });

  it('rood als werken gestart', () => {
    expect(getPTZ({ stage: 'gestart' }).status).toBe('red');
  });

  it('oranje bij onbekend gebruik', () => {
    expect(getPTZ({ usage: 'onbekend' }).status).toBe('amber');
  });

  it('groen in ideale situatie', () => {
    expect(getPTZ({ usage: 'rp', ageGt2: 'ja', stage: 'voor' }).status).toBe('green');
  });
});

// ─── TVA 5,5% ────────────────────────────────────────────────────────────────

describe('TVA 5,5%', () => {
  function getTVA(intake: Partial<SubsidieIntake> = {}) {
    return evaluateSubsidie(makeIntake(intake)).cards.find((c) => c.id === 'tva')!;
  }

  it('rood als woning < 2 jaar', () => {
    expect(getTVA({ ageGt2: 'nee' }).status).toBe('red');
  });

  it('oranje als werken gestart', () => {
    expect(getTVA({ stage: 'gestart' }).status).toBe('amber');
  });

  it('oranje als werktype onbekend', () => {
    expect(getTVA({ workType: 'onbekend' }).status).toBe('amber');
  });

  it('groen in ideale situatie', () => {
    expect(getTVA({ ageGt2: 'ja', stage: 'voor', workType: 'envelop' }).status).toBe('green');
  });
});

// ─── Lokale steun ────────────────────────────────────────────────────────────

describe('Lokale steun', () => {
  it('is altijd oranje', () => {
    const result = evaluateSubsidie(makeIntake());
    const lokaal = result.cards.find((c) => c.id === 'lokaal')!;
    expect(lokaal.status).toBe('amber');
    expect(lokaal.eligible).toBe(true);
  });
});

// ─── Actieplan ───────────────────────────────────────────────────────────────

describe('Actieplan', () => {
  it('bevat stappen bij stage=voor', () => {
    const result = evaluateSubsidie(makeIntake({ stage: 'voor' }));
    expect(result.actionPlan.some((s) => s.includes('RGE'))).toBe(true);
  });

  it('noemt audit bij heatlossDone=false', () => {
    const result = evaluateSubsidie(makeIntake({ stage: 'voor', heatlossDone: false }));
    expect(result.actionPlan.some((s) => s.includes('warmteverliesberekening'))).toBe(true);
  });

  it('bevat beperkte opties bij stage=gestart', () => {
    const result = evaluateSubsidie(makeIntake({ stage: 'gestart' }));
    expect(result.actionPlan.some((s) => s.includes('niet meer aanvraagbaar'))).toBe(true);
  });
});
