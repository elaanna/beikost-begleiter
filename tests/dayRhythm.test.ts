import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentRhythmId, dayRhythm } from '../src/domain/dayRhythm';
import type { Child, PlannedMeal } from '../src/domain/types';

const child = (birthDate: string, milk: Child['milk'] = 'flasche'): Child => ({
  id: 'c1', familyId: 'f1', name: 'Ben', birthDate, approach: 'brei', milk,
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-11-01', exclusions: [], excludedFoods: [],
});
const times = { mittag: '12:00', nachmittag: '15:30', abend: '18:00' };
const meal = (slot: PlannedMeal['slot'], title: string): PlannedMeal => ({ slot, title, foodIds: ['pastinake'] } as PlannedMeal);

test('only lunch purée so far: morning, afternoon, evening and night stay milk', () => {
  const e = dayRhythm(child('2026-05-15'), [meal('mittag', 'Pastinakenbrei')], times, '2026-11-28', false);
  assert.deepEqual(e.map((x) => `${x.id}:${x.kind}`), ['morgen:milch', 'mittag:brei', 'nachmittag:milch', 'abend:milch', 'nacht:milch']);
  assert.equal(e[0].title, 'Fläschchen');
  assert.match(e[0].detail, /Packung/);
  assert.equal(e[1].time, '12:00');
});

test('all three purées: milk only in the morning and at night, water with purées', () => {
  const e = dayRhythm(child('2026-03-15', 'stillen'), [meal('mittag', 'A'), meal('nachmittag', 'B'), meal('abend', 'C')], times, '2026-11-28', true);
  assert.deepEqual(e.filter((x) => x.kind === 'milch').map((x) => x.id), ['morgen', 'nacht']);
  assert.equal(e[0].title, 'Stillen');
  assert.match(e[1].detail, /Wasser/);
});

test('from about 10 months the morning offers a first family breakfast', () => {
  const e = dayRhythm(child('2026-01-15'), [], times, '2026-11-28', false);
  assert.equal(e[0].kind, 'fruehstueck');
});

test('current entry follows the clock', () => {
  const e = dayRhythm(child('2026-05-15'), [meal('mittag', 'A')], times, '2026-11-28', false);
  assert.equal(currentRhythmId(e, '07:00'), 'morgen');
  assert.equal(currentRhythmId(e, '11:40'), 'mittag');
  assert.equal(currentRhythmId(e, '16:00'), 'nachmittag');
  assert.equal(currentRhythmId(e, '18:30'), 'abend');
  assert.equal(currentRhythmId(e, '22:00'), 'nacht');
});
