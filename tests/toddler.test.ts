import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOOD_BY_ID } from '../src/data/foods';
import { LUNCHBOX_ITEMS, TABLE_OPTIONS, TABLE_RECIPES } from '../src/data/toddler';
import { RECIPE_BY_ID } from '../src/data/allRecipes';
import { currentTableSlot, lunchboxShopping, lunchboxWeek, reofferList, suggestTable, tableDay, tableDays } from '../src/domain/toddler';
import type { Child, FoodLog } from '../src/domain/types';

const child: Child = {
  id: 'c1', familyId: 'f1', name: 'Ben', birthDate: '2025-10-15', approach: 'brei', milk: 'flasche',
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-03-01', exclusions: [], excludedFoods: [], tableSince: null,
};
let n = 0;
const log = (foodId: string, date: string, extra: Partial<FoodLog> = {}): FoodLog => ({
  id: `l${n++}`, childId: 'c1', foodId, date, liking: 0, reaction: 'keine', note: '', ...extra,
});

test('Alle Lebensmittel der Kleinkind-Daten gibt es in der Datenbank', () => {
  const ids = [
    ...TABLE_RECIPES.flatMap((r) => r.foods),
    ...Object.values(TABLE_OPTIONS).flat().flatMap((o) => o.foods),
    ...Object.values(LUNCHBOX_ITEMS).flat().map((x) => x.food),
  ];
  for (const id of ids) assert.ok(FOOD_BY_ID[id], `unbekannt: ${id}`);
  for (const r of TABLE_RECIPES) assert.ok(RECIPE_BY_ID[r.id], `nicht in der Bibliothek: ${r.id}`);
});

test('Übergang wird ab 12 Monaten vorgeschlagen, nicht davor und nicht doppelt', () => {
  assert.equal(suggestTable(child, '2026-10-10'), false); // 11 Monate
  assert.equal(suggestTable(child, '2026-10-20'), true); // 12 Monate
  assert.equal(suggestTable({ ...child, tableSince: '2026-10-20' }, '2026-11-01'), false);
});

test('Tagesplan: 5 Mahlzeiten, Mittag aus Rezepten, Fisch am Donnerstag, stabil pro Tag', () => {
  const d = tableDay(child, [], '2026-11-26'); // Donnerstag
  assert.deepEqual(d.meals.map((m) => m.slot), ['fruehstueck', 'vormittag', 'mittag', 'nachmittag', 'abend']);
  const lunch = d.meals.find((m) => m.slot === 'mittag')!;
  assert.equal(TABLE_RECIPES.find((r) => r.id === lunch.recipeId)?.kind, 'fisch');
  assert.deepEqual(tableDay(child, [], '2026-11-26'), d);
  assert.notDeepEqual(tableDay(child, [], '2026-11-27').meals[0], d.meals[0]);
});

test('Woche: höchstens 2× Fisch und Fleisch nicht jeden Tag', () => {
  const week = tableDays(child, [], '2026-11-23', 7);
  const kinds = week.map((d) => TABLE_RECIPES.find((r) => r.id === d.meals.find((m) => m.slot === 'mittag')!.recipeId)!.kind);
  assert.ok(kinds.filter((k) => k === 'fisch').length <= 2);
  assert.ok(kinds.filter((k) => k === 'fleisch').length <= 3);
});

test('Ausschlüsse werden beachtet: bei Fisch-Allergie kein Fisch, sondern vegetarisch', () => {
  const noFish = { ...child, exclusions: ['fisch' as const, 'ei' as const] };
  for (const d of tableDays(noFish, [], '2026-11-23', 14)) {
    for (const m of d.meals) for (const id of m.foods) {
      assert.ok(!FOOD_BY_ID[id].allergens.some((a) => a === 'fisch' || a === 'ei'), `${m.title} enthält Ausgeschlossenes`);
    }
  }
});

test('Mahlzeit nach Uhrzeit', () => {
  assert.equal(currentTableSlot('07:00'), 'fruehstueck');
  assert.equal(currentTableSlot('10:15'), 'vormittag');
  assert.equal(currentTableSlot('12:30'), 'mittag');
  assert.equal(currentTableSlot('15:30'), 'nachmittag');
  assert.equal(currentTableSlot('19:00'), 'abend');
});

test('Brotdose: 5 Tage, nur Bekanntes wo möglich, nie Ausgeschlossenes; Einkaufsliste', () => {
  const logs = ['brot', 'dinkel', 'frischkaese', 'butter', 'gurke', 'paprika', 'apfel', 'banane'].map((f) => log(f, '2026-11-01'));
  const week = lunchboxWeek({ ...child, exclusions: ['milch'] }, logs, '2026-11-23');
  assert.equal(week.length, 5);
  for (const d of week) {
    for (const x of Object.values(d.items)) assert.ok(!FOOD_BY_ID[x.food].allergens.includes('milch'), x.text);
    assert.ok(['gurke', 'paprika'].includes(d.items.gemuese.food));
    assert.ok(['brot', 'dinkel'].includes(d.items.brot.food));
    assert.ok(d.items.obst.known);
  }
  // Ohne Probiertes: Vorschlag mit Hinweis
  assert.equal(lunchboxWeek(child, [], '2026-11-23')[0].items.obst.known, false);
  assert.notDeepEqual(lunchboxWeek(child, [], '2026-11-23', 1), lunchboxWeek(child, [], '2026-11-23', 0));
  assert.equal(lunchboxShopping(week).reduce((s, x) => s + x.count, 0), 20);
});

test('Noch mal anbieten: zuletzt abgelehnt, ohne späteres Mögen; zählt Angebote', () => {
  const logs = [
    log('brokkoli', '2026-11-01', { liking: -1 }), log('brokkoli', '2026-11-10', { liking: -1 }),
    log('spinat', '2026-11-02', { liking: -1 }), log('spinat', '2026-11-12', { liking: 1 }),
    log('karotte', '2026-11-05', { liking: 1 }),
  ];
  const r = reofferList(child, logs, '2026-11-26');
  assert.deepEqual(r.map((x) => x.foodId), ['brokkoli']);
  assert.equal(r[0].offered, 2);
  assert.equal(r[0].daysAgo, 16);
});
