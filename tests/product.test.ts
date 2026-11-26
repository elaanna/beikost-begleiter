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

// Fehler 26.11.2026: Gummibärchen wurden als „Sieht gut aus / Ohne Zuckerzusatz“ eingestuft
const noExcl = { ...child, exclusions: [] };
const sugarTitle = (r: ReturnType<typeof analyzeProduct>) => r.points.find((x) => x.title.startsWith('Zugesetzter Zucker'))?.title ?? '';

test('Gummibärchen (deutsche Liste, Kategorie, Zuckergehalt): lieber nicht', () => {
  const p: OffProduct = {
    product_name: 'Goldbären', ingredients_text_de: 'Glukosesirup, Zucker, Gelatine, Dextrose, Säuerungsmittel: Citronensäure, Fruchtsaftkonzentrat',
    categories_tags: ['en:snacks', 'en:sweet-snacks', 'en:confectioneries', 'en:gummies'], nutriments: { sugars_100g: 46 },
  };
  const r = analyzeProduct(p, noExcl, logs, 7);
  assert.equal(r.verdict, 'lieber_nicht');
  assert.ok(r.points.some((x) => x.title === 'Süßigkeit'));
  assert.match(sugarTitle(r), /Glukosesirup/);
  assert.match(sugarTitle(r), /Zucker/);
  assert.ok(r.points.some((x) => x.title.startsWith('Sehr zuckerreich (46 g')));
  assert.ok(!r.points.some((x) => x.title === 'Ohne Zuckerzusatz'));
});

test('Zutatenliste nur auf Englisch: Zucker wird trotzdem erkannt', () => {
  const p: OffProduct = { product_name: 'Fruit gums', ingredients_text: 'Glucose syrup, sugar, gelatine, dextrose, citric acid' };
  const r = analyzeProduct(p, noExcl, logs, 7);
  assert.notEqual(r.verdict, 'gut');
  assert.match(sugarTitle(r), /Glukosesirup/);
  assert.match(sugarTitle(r), /Traubenzucker/);
  assert.ok(!r.points.some((x) => x.title === 'Ohne Zuckerzusatz'));
});

test('Französisch, Italienisch, Niederländisch', () => {
  for (const t of ['sirop de glucose, sucre, gélatine', 'sciroppo di glucosio, zucchero', 'glucosestroop, suiker, gelatine']) {
    assert.match(sugarTitle(analyzeProduct({ product_name: 'X', ingredients_text: t }, noExcl, logs, 7)), /Zucker|Glukosesirup/, t);
  }
});

test('Nur Zutaten-Kennungen (Liste in unbekannter Sprache): Zucker aus den Kennungen', () => {
  const p: OffProduct = { product_name: 'Żelki', ingredients_text: 'syrop glukozowy, cukier, żelatyna', ingredients_tags: ['en:glucose-syrup', 'en:sugar', 'en:gelatin'] };
  const r = analyzeProduct(p, noExcl, logs, 7);
  assert.match(sugarTitle(r), /Glukosesirup, Zucker|Zucker, Glukosesirup/);
  assert.ok(!r.points.some((x) => x.title === 'Ohne Zuckerzusatz'));
});

test('Unbekannte Sprache ohne Kennungen: kein „Ohne Zuckerzusatz“, sondern Hinweis', () => {
  const r = analyzeProduct({ product_name: 'Żelki', ingredients_text: 'syrop glukozowy, cukier, żelatyna' }, noExcl, logs, 7);
  assert.ok(!r.points.some((x) => x.title === 'Ohne Zuckerzusatz'));
  assert.ok(r.points.some((x) => x.title === 'Zutatenliste in anderer Sprache'));
  assert.notEqual(r.verdict, 'gut');
});

test('Viel natürlicher Zucker: Hinweis, aber kein „Ohne Zuckerzusatz“-Lob', () => {
  const r = analyzeProduct({ product_name: 'Fruchtriegel', ingredients_text_de: 'Datteln 60 %, Äpfel 40 %', nutriments: { sugars_100g: 55 } }, noExcl, logs, 10);
  assert.ok(r.points.some((x) => x.title.startsWith('Sehr zuckerreich')));
  assert.ok(!r.points.some((x) => x.title === 'Ohne Zuckerzusatz'));
  assert.equal(r.verdict, 'bedacht');
});

test('„no added sugar“ und „sugar-free“ zählen nicht als Zucker', () => {
  const r = analyzeProduct({ product_name: 'Apple puree', ingredients_text_en: 'Apple 100%, no added sugar', nutriments: { sugars_100g: 11 } }, noExcl, logs, 7);
  assert.equal(sugarTitle(r), '');
  assert.ok(r.points.some((x) => x.title === 'Ohne Zuckerzusatz'));
});
