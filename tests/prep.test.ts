import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BABY_RECIPES } from '../src/data/babyRecipes';
import { prepSession, rankForPlan, stepMinutes } from '../src/domain/prepSession';

test('Minuten im Schritt erkennen', () => {
  assert.equal(stepMinutes('Etwa 15 Minuten weich dämpfen.'), 15);
  assert.equal(stepMinutes('10–12 Minuten köcheln'), 10);
  assert.equal(stepMinutes('Weich dämpfen.'), undefined);
});

test('Ablauf: vorbereiten → kochen → abkühlen/einfrieren; Öl wird beim Vorkochen weggelassen', () => {
  const freezable = BABY_RECIPES.filter((r) => r.storage.freeze).slice(0, 2);
  const s = prepSession(freezable);
  const phases = s.map((x) => x.phase);
  assert.equal(phases[0], 'vorbereiten');
  assert.equal(phases[phases.length - 1], 'abschluss');
  assert.ok(phases.indexOf('kochen') > phases.lastIndexOf('vorbereiten'));
  assert.ok(!s.some((x) => /öl (unterrühren|zugeben)/i.test(x.text)), 'Öl-Schritt darf nicht bleiben');
  assert.ok(s.some((x) => /Öl jetzt noch nicht/.test(x.text)));
});

test('Passend zum Plan zuerst', () => {
  const ranked = rankForPlan(BABY_RECIPES.filter((r) => r.storage.freeze), new Set(['pastinake', 'rapsoel']));
  assert.ok(ranked[0].foods.includes('pastinake'));
});
