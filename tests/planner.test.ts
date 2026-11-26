import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planDays, buildSchedule, blockReason, DAYS_ALLERGEN, DAYS_OTHER, MAINTENANCE } from '../src/domain/planner';
import { computeStartWindow } from '../src/domain/startWindow';
import { shoppingList, prepTasks } from '../src/domain/shopping';
import { addDays, ageInMonths, weekStart } from '../src/domain/dates';
import { FOOD_BY_ID, FOODS } from '../src/data/foods';
import type { Child, FoodLog } from '../src/domain/types';

const baseChild: Child = {
  id: 'c1', familyId: 'f1', name: 'Test', birthDate: '2026-06-15',
  approach: 'brei', milk: 'flasche', atopicDermatitis: false, peanutCleared: false,
  startDate: '2026-11-16', exclusions: [], excludedFoods: [],
};

test('Startfenster: Beginn 5. bis Beginn 7. Monat', () => {
  const w = computeStartWindow('2026-06-15', 'flasche');
  assert.equal(w.earliest, '2026-10-15');
  assert.equal(w.latest, '2026-12-15');
});

test('Startfenster: gestillte Kinder -> Vorschlag nach vollendetem 6. Monat (S3 Stilldauer)', () => {
  const w = computeStartWindow('2026-06-15', 'stillen');
  assert.equal(w.suggested, '2026-12-15');
  assert.match(w.note, /S3-Leitlinie Stilldauer/);
});

test('Monatsende wird korrekt behandelt', () => {
  const w = computeStartWindow('2026-01-31', 'flasche');
  assert.equal(w.earliest, '2026-05-31');
  assert.equal(w.latest, '2026-07-31');
});

test('Vor dem Start gibt es keine Mahlzeiten', () => {
  const days = planDays(baseChild, [], '2026-11-09', 7);
  assert.ok(days.every((d) => d.meals.length === 0));
});

test('Allergene werden 3 Tage, andere Lebensmittel 2 Tage hintereinander angeboten', () => {
  const sched = buildSchedule(baseChild, [], 400);
  for (const x of sched.introductions) {
    assert.equal(x.days, x.food.allergens.length ? DAYS_ALLERGEN : DAYS_OTHER, x.food.id);
  }
  const days = planDays(baseChild, [], baseChild.startDate!, 4);
  assert.deepEqual(days.slice(0, 2).map((d) => d.meals[0].newFoodDay), [1, 2]);
  assert.notEqual(days[2].meals[0].newFoodId, days[0].meals[0].newFoodId);
});

test('Nie zwei neue Lebensmittel gleichzeitig', () => {
  const sched = buildSchedule(baseChild, [], 400);
  for (let i = 1; i < sched.introductions.length; i++) {
    const prev = sched.introductions[i - 1];
    assert.ok(sched.introductions[i].fromDay >= prev.fromDay + prev.days);
  }
});

test('Eingeführte Allergene werden danach mindestens 2× pro Woche angeboten (ASCIA), Fisch 1–2×', () => {
  const s = baseChild.startDate!;
  const days = planDays(baseChild, [], s, 200);
  const sched = buildSchedule(baseChild, [], 200);
  for (const id of Object.keys(MAINTENANCE)) {
    const intro = sched.introductions.find((x) => x.food.id === id);
    if (!intro) continue;
    const from = intro.fromDay + intro.days;
    const min = 2;
    for (let w = from; w + 7 <= days.length; w += 7) {
      const count = days.slice(w, w + 7).filter((d) => d.meals.some((m) => m.foodIds.includes(id))).length;
      assert.ok(count >= min, `${id}: nur ${count}× in Woche ab Tag ${w}`);
    }
  }
});

test('Erste Woche nur Mittagsbrei, Abendbrei nach ca. 1 Monat, Nachmittag nach ca. 2 Monaten', () => {
  const s = baseChild.startDate!;
  assert.deepEqual(planDays(baseChild, [], s, 7).flatMap((d) => d.meals.map((m) => m.slot)).filter((x, i, a) => a.indexOf(x) === i), ['mittag']);
  const w5 = planDays(baseChild, [], addDays(s, 30), 1)[0];
  assert.ok(w5.meals.some((m) => m.slot === 'abend'));
  const w9 = planDays(baseChild, [], addDays(s, 60), 1)[0];
  assert.ok(w9.meals.some((m) => m.slot === 'nachmittag'));
});

test('Kein Lebensmittel vor seiner frühesten Woche', () => {
  const days = planDays(baseChild, [], baseChild.startDate!, 120);
  days.forEach((d, i) => {
    for (const m of d.meals) {
      if (m.newFoodId) assert.ok(FOOD_BY_ID[m.newFoodId].fromWeek * 7 <= i, `${m.newFoodId} an Tag ${i}`);
    }
  });
});

test('Ausgeschlossene Allergene tauchen nie im Plan auf (Kritikpunkt Allergieprofil)', () => {
  const child = { ...baseChild, exclusions: ['milch', 'ei'] as Child['exclusions'] };
  const ids = planDays(child, [], child.startDate!, 150).flatMap((d) => d.meals.flatMap((m) => m.foodIds));
  for (const id of ids) {
    const f = FOOD_BY_ID[id];
    assert.ok(!f.allergens.includes('milch') && !f.allergens.includes('ei'), id);
  }
});

test('Erdnuss bei Neurodermitis erst nach ärztlicher Abklärung (S3, Empfehlung A)', () => {
  const child = { ...baseChild, atopicDermatitis: true };
  assert.match(blockReason(FOOD_BY_ID.erdnuss, child, []) ?? '', /ärztlich/);
  const ids = planDays(child, [], child.startDate!, 150).flatMap((d) => d.meals.flatMap((m) => m.foodIds));
  assert.ok(!ids.includes('erdnuss'));
  const cleared = { ...child, peanutCleared: true };
  const ids2 = planDays(cleared, [], cleared.startDate!, 150).flatMap((d) => d.meals.flatMap((m) => m.foodIds));
  assert.ok(ids2.includes('erdnuss'));
});

test('Ei wird nach Einführung jede Woche angeboten', () => {
  const days = planDays(baseChild, [], baseChild.startDate!, 140);
  const firstEgg = days.findIndex((d) => d.meals.some((m) => m.foodIds.includes('ei')));
  assert.ok(firstEgg >= 21, 'Ei nicht vor Woche 4');
  for (let w = firstEgg + 7; w + 7 < days.length; w += 7) {
    const week = days.slice(w, w + 7);
    assert.ok(week.some((d) => d.meals.some((m) => m.foodIds.includes('ei'))), `keine Ei-Gabe in Woche ab Tag ${w}`);
  }
});

test('Fisch 1–2× pro Woche nach der ersten Fischeinführung (Gesund ins Leben)', () => {
  const days = planDays(baseChild, [], baseChild.startDate!, 200);
  const sched = buildSchedule(baseChild, [], 200);
  const first = sched.introductions.find((x) => FOOD_BY_ID[x.food.id].category === 'fisch')!;
  for (let w = first.fromDay + first.days; w + 7 <= days.length; w += 7) {
    const n = days.slice(w, w + 7).filter((d) => d.meals.some((m) => m.foodIds.some((id) => FOOD_BY_ID[id].category === 'fisch' && id !== m.newFoodId))).length;
    // Einführungstage eines neuen Fischs zählen nicht mit
    assert.ok(n >= 1 && n <= 2, `Fisch ${n}× in Woche ab Tag ${w}`);
  }
});

test('Datenbank: ca. 100 Lebensmittel, eindeutige IDs, vollständige Angaben', () => {
  assert.ok(FOODS.length >= 95, `nur ${FOODS.length}`);
  assert.equal(new Set(FOODS.map((f) => f.id)).size, FOODS.length);
  for (const f of FOODS) {
    assert.ok(f.name && f.emoji && f.brei && f.finger && f.shopUnit, f.id);
    if (f.chokingRisk === 'hoch') assert.ok(f.hint, `${f.id}: hohes Risiko braucht Hinweis`);
  }
});

test('Nach notierter Reaktion wird das Lebensmittel pausiert', () => {
  const s = baseChild.startDate!;
  const firstNew = planDays(baseChild, [], s, 1)[0].meals[0].newFoodId!;
  const logs: FoodLog[] = [{ id: 'l1', childId: 'c1', foodId: firstNew, date: s, liking: 0, reaction: 'haut', note: '' }];
  const ids = planDays(baseChild, logs, s, 60).flatMap((d) => d.meals.flatMap((m) => m.foodIds));
  assert.ok(!ids.includes(firstNew));
});

test('Jedes Lebensmittel wird höchstens einmal eingeführt', () => {
  const sched = buildSchedule(baseChild, [], 400);
  const ids = sched.introductions.map((x) => x.food.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, FOODS.length);
});

test('Einkaufsliste und Vorkochliste aus dem Wochenplan', () => {
  const days = planDays(baseChild, [], addDays(baseChild.startDate!, 35), 7);
  const list = shoppingList(days);
  assert.ok(list.length > 3);
  assert.ok(list.every((i) => i.servings > 0));
  assert.ok(prepTasks(days).length > 0);
});

test('Datumshilfen', () => {
  assert.equal(weekStart('2026-11-25'), '2026-11-23');
  assert.equal(weekStart('2026-11-29'), '2026-11-23');
  assert.equal(ageInMonths('2026-06-15', '2026-11-14'), 4);
  assert.equal(ageInMonths('2026-06-15', '2026-11-15'), 5);
});

test('Familienrezepte: alle Zutaten existieren, Allergien blockieren das Rezept', async () => {
  const { RECIPES } = await import('../src/data/recipes');
  const { recipeFits } = await import('../src/domain/recipes');
  for (const r of RECIPES) for (const id of r.foods) assert.ok(FOOD_BY_ID[id], `${r.id}: ${id} fehlt`);
  const child = { ...baseChild, exclusions: ['fisch'] as Child['exclusions'] };
  const fits = recipeFits(child, []);
  assert.ok(fits.find((f) => f.recipe.id === 'lachs-ofengemuese')!.blocked);
  assert.equal(fits.find((f) => f.recipe.id === 'gemuesesuppe')!.blocked, null);
});
