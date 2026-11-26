import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstBirthdayChanges, morningInfo } from '../src/domain/morning';
import type { Child } from '../src/domain/types';

const child = (birthDate: string, milk: Child['milk'] = 'flasche'): Child => ({
  id: 'c1', familyId: 'f1', name: 'Ben', birthDate, approach: 'brei', milk,
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-11-01', exclusions: [], excludedFoods: [],
});

test('morning stays milk in the purée plan – no breakfast purée', () => {
  const m = morningInfo(child('2026-05-15'), '2026-11-26');
  assert.equal(m.stage, 'milch');
  assert.equal(m.title, 'Frühstück: Fläschchen');
  assert.match(m.text, /keinen Frühstücksbrei|Frühstücksbrei gibt es im Breiplan nicht/);
  assert.equal(morningInfo(child('2026-05-15', 'stillen'), '2026-11-26').title, 'Frühstück: Stillen');
});

test('from about 10 months: gentle hint towards family breakfast', () => {
  const m = morningInfo(child('2026-01-15'), '2026-11-26');
  assert.equal(m.stage, 'uebergang');
  assert.match(m.text, /Ben/);
});

test('first birthday lists what changes, including cow milk from a cup and nut safety', () => {
  const lines = firstBirthdayChanges();
  assert.equal(lines.length, 4);
  assert.ok(lines.some((l) => /Kuhmilch/.test(l)));
  assert.ok(lines.some((l) => /Nüsse/.test(l)));
});
