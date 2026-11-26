import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeProduct, labelMonths, type OffProduct } from '../src/domain/productCheck';
import type { Child, FoodLog } from '../src/domain/types';

const child: Child = {
  id: 'c1', familyId: 'f1', name: 'Ben', birthDate: '2026-04-15', approach: 'brei', milk: 'flasche',
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-09-01', exclusions: ['milch'], excludedFoods: [],
};
const logs: FoodLog[] = [{ id: 'l1', childId: 'c1', foodId: 'dinkel', date: '2026-10-01', liking: 0, reaction: 'keine', note: '' }];

test('Packungsalter wird erkannt', () => {
  assert.equal(labelMonths('Apfel-Banane ab dem 5. Monat'), 4);
  assert.equal(labelMonths('Kekse nach dem 8. Monat'), 8);
  assert.equal(labelMonths('Hirse ab 6 Monaten'), 6);
  assert.equal(labelMonths('Kinderkekse ab 1 Jahr'), 12);
  assert.equal(labelMonths('Quetschie 12+'), 12);
  assert.equal(labelMonths('Apfelmus'), null);
});

test('Quetschie ohne Zuckerzusatz: sieht gut aus', () => {
  const p: OffProduct = { product_name: 'Quetschie Apfel-Banane', ingredients_text_de: 'Apfel 70 %, Banane 30 %', allergens_tags: [], additives_tags: [], nutriments: { salt_100g: 0.01 } };
  const r = analyzeProduct(p, child, logs, 7);
  assert.equal(r.verdict, 'gut');
  assert.ok(r.points.some((x) => x.title === 'Ohne Zuckerzusatz'));
  assert.ok(r.points.some((x) => x.title === 'Kurze Zutatenliste'));
});

test('Babykekse mit Zucker, Maltodextrin und Milch: lieber nicht für Ben', () => {
  const p: OffProduct = {
    product_name: 'Dinkel-Babykekse ab dem 10. Monat',
    ingredients_text_de: 'Dinkelmehl, Zucker, Maltodextrin, Butter (Milch), Backtriebmittel',
    allergens_tags: ['en:gluten', 'en:milk'], additives_tags: ['en:e500'], nutriments: { salt_100g: 0.2 },
  };
  const r = analyzeProduct(p, child, logs, 7);
  assert.equal(r.verdict, 'lieber_nicht');
  const titles = r.points.map((x) => x.title).join(' | ');
  assert.match(titles, /erst ab 9 Monaten/);
  assert.match(titles, /Zugesetzter Zucker: Maltodextrin, Zucker|Zugesetzter Zucker: .*Zucker/);
  assert.match(titles, /Enthält Milch/);
  assert.ok(r.points.find((x) => x.title === 'Enthält Milch')!.text.includes('Ben'));
  assert.equal(r.points[0].level, 'nein');
});

test('Honig im ersten Jahr ist ein klares Nein, danach nur Zuckerhinweis', () => {
  const p: OffProduct = { product_name: 'Haferkeks', ingredients_text_de: 'Hafer, Honig', allergens_tags: [] };
  assert.equal(analyzeProduct(p, { ...child, exclusions: [] }, logs, 9).verdict, 'lieber_nicht');
  assert.equal(analyzeProduct(p, { ...child, exclusions: [] }, logs, 14).verdict, 'bedacht');
});

test('Ohne Zutatenliste: zu wenig Angaben', () => {
  assert.equal(analyzeProduct({ product_name: 'X' }, child, logs, 7).verdict, 'unklar');
});

test('Milchzucker und zuckerfrei zählen nicht als Zuckerzusatz', () => {
  const p: OffProduct = { product_name: 'Joghurt', ingredients_text_de: 'Joghurt, Milchzucker, zuckerfrei', allergens_tags: [] };
  assert.ok(!analyzeProduct(p, { ...child, exclusions: [] }, logs, 9).points.some((x) => x.title.startsWith('Zugesetzter Zucker')));
});
