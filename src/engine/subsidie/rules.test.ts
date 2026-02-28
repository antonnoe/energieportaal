import { describe, it, expect } from 'vitest';
import { evaluateSubsidie } from './rules';
import type { SubsidieIntake } from './rules';

const BASE_INTAKE: SubsidieIntake = {
  usage: 'rp',
  ageGt2: 'ja',
  stage: 'voor',
  workType: 'envelop',
  mprPath: 'geste',
  heatlossDone: false,
};

describe('evaluateSubsidie', () => {
  it('returns 5 subsidy cards', () => {
    const result = evaluateSubsidie(BASE_INTAKE);
    expect(result.cards).toHaveLength(5);
    const ids = result.cards.map((c) => c.id);
    expect(ids).toContain('mpr-geste');
    expect(ids).toContain('mpr-ampleur');
    expect(ids).toContain('cee');
    expect(ids).toContain('eco-ptz');
    expect(ids).toContain('tva');
  });

  it('all cards green for ideal rp owner, voor-stage, envelop, geste', () => {
    const result = evaluateSubsidie(BASE_INTAKE);
    const geste = result.cards.find((c) => c.id === 'mpr-geste')!;
    expect(geste.status).toBe('green');
    expect(geste.eligible).toBe(true);
    const cee = result.cards.find((c) => c.id === 'cee')!;
    expect(cee.status).toBe('green');
    const tva = result.cards.find((c) => c.id === 'tva')!;
    expect(tva.status).toBe('green');
  });

  it('MPR Geste is red when stage is gestart', () => {
    const result = evaluateSubsidie({ ...BASE_INTAKE, stage: 'gestart' });
    const geste = result.cards.find((c) => c.id === 'mpr-geste')!;
    expect(geste.status).toBe('red');
    expect(geste.eligible).toBe(false);
  });

  it('MPR Geste is red for secondaire usage', () => {
    const result = evaluateSubsidie({ ...BASE_INTAKE, usage: 'secondaire' });
    const geste = result.cards.find((c) => c.id === 'mpr-geste')!;
    expect(geste.status).toBe('red');
    expect(geste.eligible).toBe(false);
  });

  it('MPR Geste is red when woning < 2 jaar', () => {
    const result = evaluateSubsidie({ ...BASE_INTAKE, ageGt2: 'nee' });
    const geste = result.cards.find((c) => c.id === 'mpr-geste')!;
    expect(geste.status).toBe('red');
  });

  it('MPR Ampleur is amber when heatloss not done', () => {
    const result = evaluateSubsidie({ ...BASE_INTAKE, workType: 'combo', mprPath: 'ampleur', heatlossDone: false });
    const ampleur = result.cards.find((c) => c.id === 'mpr-ampleur')!;
    expect(ampleur.status).toBe('amber');
  });

  it('MPR Ampleur is green when combo + ampleur + heatlossDone', () => {
    const result = evaluateSubsidie({
      ...BASE_INTAKE,
      workType: 'combo',
      mprPath: 'ampleur',
      heatlossDone: true,
    });
    const ampleur = result.cards.find((c) => c.id === 'mpr-ampleur')!;
    expect(ampleur.status).toBe('green');
    expect(ampleur.eligible).toBe(true);
  });

  it('CEE is red when stage is gestart', () => {
    const result = evaluateSubsidie({ ...BASE_INTAKE, stage: 'gestart' });
    const cee = result.cards.find((c) => c.id === 'cee')!;
    expect(cee.status).toBe('red');
  });

  it('Eco-PTZ is red for secondaire usage', () => {
    const result = evaluateSubsidie({ ...BASE_INTAKE, usage: 'secondaire' });
    const ptz = result.cards.find((c) => c.id === 'eco-ptz')!;
    expect(ptz.status).toBe('red');
  });

  it('TVA is red when woning < 2 jaar', () => {
    const result = evaluateSubsidie({ ...BASE_INTAKE, ageGt2: 'nee' });
    const tva = result.cards.find((c) => c.id === 'tva')!;
    expect(tva.status).toBe('red');
  });

  it('generates a non-empty action plan for voor-stage', () => {
    const result = evaluateSubsidie(BASE_INTAKE);
    expect(result.actionPlan.length).toBeGreaterThan(0);
  });

  it('action plan mentions starting after werken gestart', () => {
    const result = evaluateSubsidie({ ...BASE_INTAKE, stage: 'gestart' });
    expect(result.actionPlan.some((s) => s.includes('gestart'))).toBe(true);
  });
});
