import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seasonalFoods, tipOfDay, tipsFor } from '../src/domain/daily';
import { TIPS } from '../src/data/tips';
import { FOOD_BY_ID } from '../src/data/foods';
import { SEASON } from '../src/data/season';
import type { Child, FoodLog } from '../src/domain/types';

const child: Child = {
  id: 'c1', familyId: 'f1', name: 'Mia', birthDate: '2026-05-15', approach: 'brei', milk: 'flasche',
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-11-01', exclusions: [], excludedFoods: [],
};
const log = (foodId: string, extra: Partial<FoodLog> = {}): FoodLog => ({
  id: foodId, childId: 'c1', foodId, date: '2026-11-10', liking: 0, reaction: 'keine', note: '', ...extra,
});

test('Tipp des Tages: gleicher Tag gleicher Tipp, nächster Tag ein anderer', () => {
  const a = tipOfDay(child, '2026-11-26');
  assert.equal(tipOfDay(child, '2026-11-26').id, a.id);
  assert.notEqual(tipOfDay(child, '2026-11-27').id, a.id);
  assert.notEqual(tipOfDay(child, '2026-11-26', 1).id, a.id);
});

test('Tipps passen zu Phase und Jahreszeit', () => {
  const ids = tipsFor(child, '2026-11-26').map((t) => t.id);
  assert.ok(ids.includes('s1'));          // erste Wochen
  assert.ok(!ids.includes('v1'));         // vor dem Start nicht mehr
  assert.ok(!ids.includes('j1'));         // Sommer-Tipp nicht im November
  assert.ok(ids.includes('j3'));          // Wintergemüse
  const before = tipsFor({ ...child, startDate: '2026-12-20' }, '2026-11-26').map((t) => t.id);
  assert.ok(before.includes('v1'));
});

test('Saison: November ohne Sommerobst, Lagerware markiert, Probiertes zuerst', () => {
  const items = seasonalFoods(child, [log('pastinake')], '2026-11-26');
  const ids = items.map((i) => i.food.id);
  assert.ok(ids.includes('pastinake') && ids.includes('gruenkohl'));
  assert.ok(!ids.includes('erdbeere') && !ids.includes('zucchini'));
  assert.equal(items.find((i) => i.food.id === 'apfel')?.stored, true);
  assert.equal(items[0].food.id, 'pastinake');
});

test('Saison: blockierte Lebensmittel erscheinen nicht', () => {
  const items = seasonalFoods(child, [log('karotte', { reaction: 'haut' })], '2026-11-26');
  assert.ok(!items.some((i) => i.food.id === 'karotte'));
});

test('Daten: alle Saison-Lebensmittel existieren, Tipp-IDs eindeutig', () => {
  for (const id of Object.keys(SEASON)) assert.ok(FOOD_BY_ID[id], id);
  assert.equal(new Set(TIPS.map((t) => t.id)).size, TIPS.length);
});
