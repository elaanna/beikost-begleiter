import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateDay, genitive, groupOf, mealComponents, weekGroups } from '../src/domain/beikostOverview';
import { NUTRIENTS_100G } from '../src/data/nutrients';
import { FOODS } from '../src/data/foods';
import type { Child, FoodLog, PlannedMeal } from '../src/domain/types';

const child: Child = {
  id: 'c1', familyId: 'f1', name: 'Mia', birthDate: '2026-04-15', approach: 'brei', milk: 'flasche',
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-09-01', exclusions: [], excludedFoods: [],
};
let n = 0;
const log = (foodId: string, date: string, extra: Partial<FoodLog> = {}): FoodLog => ({
  id: `l${n++}`, childId: 'c1', foodId, date, liking: 0, reaction: 'keine', note: '', ...extra,
});

test('Jedes Lebensmittel hat Nährwert-Schätzwerte und eine Gruppe', () => {
  for (const f of FOODS) {
    assert.ok(NUTRIENTS_100G[f.id], `Nährwerte fehlen: ${f.id}`);
    assert.ok(groupOf(f.id), `Gruppe fehlt: ${f.id}`);
  }
});

test('Plan-Bausteine: eingetragene Gruppen werden abgehakt', () => {
  const meal: PlannedMeal = { slot: 'mittag', title: 'Gemüse-Kartoffel-Fleisch-Brei', foodIds: ['karotte', 'kartoffel', 'rind', 'rapsoel'] };
  const comps = mealComponents(meal, child, [log('karotte', '2026-11-26'), log('kartoffel', '2026-11-26')], '2026-11-26');
  assert.deepEqual(comps.map((c) => [c.group, c.done]), [['gemuese', true], ['staerke', true], ['eiweiss', false], ['fett', false]]);
});

test('Woche: Gruppen pro Tag, Vielfalt und neu Entdecktes', () => {
  const logs = [log('karotte', '2026-11-01'), log('karotte', '2026-11-25'), log('apfel', '2026-11-26'), log('rind', '2026-11-24')];
  const w = weekGroups(child, logs, '2026-11-26');
  assert.equal(w.variety, 3);
  assert.equal(w.newThisWeek, 2);
  assert.equal(w.rows.find((r) => r.group === 'gemuese')!.count, 1);
});

test('Nährwerte: grobe Schätzung, ohne Reaktionen, in der Startphase kleiner', () => {
  const day = [log('karotte', '2026-11-26'), log('kartoffel', '2026-11-26'), log('rind', '2026-11-26'), log('rapsoel', '2026-11-26')];
  const est = estimateDay(child, day, '2026-11-26')!;
  // 100 g Karotte + 70 g Kartoffel + 30 g Rind + 12 g Öl ≈ 41 + 54 + 40 + 106 kcal
  assert.ok(est.kcal > 200 && est.kcal < 280, String(est.kcal));
  assert.ok(est.iron > 1.2 && est.iron < 1.8, String(est.iron));
  const early = estimateDay({ ...child, startDate: '2026-11-24' }, day, '2026-11-26')!;
  assert.ok(early.kcal < est.kcal / 2);
  assert.equal(estimateDay(child, [log('ei', '2026-11-26', { reaction: 'haut' })], '2026-11-26'), null);
});

test('Genitiv für Überschriften', () => {
  assert.equal(genitive('Mia'), 'Mias');
  assert.equal(genitive('Max'), 'Max’');
  assert.equal(genitive('Baby'), 'Babys');
});
