import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ask, searchFoods } from '../src/domain/askFood';
import { portionFor } from '../src/domain/portions';
import type { Child } from '../src/domain/types';

const child: Child = {
  id: 'c1', familyId: 'f1', name: 'Mia', birthDate: '2026-06-15', approach: 'brei', milk: 'flasche',
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-10-20', exclusions: [], excludedFoods: [],
};
const TODAY = '2026-11-26';

test('Honig wird immer mit Nein beantwortet', () => {
  const a = ask('Darf mein Baby Honig?', child, [], TODAY);
  assert.equal(a[0].kind, 'avoid');
  assert.match(a[0].headline, /Nein/);
});

test('Synonyme: Möhre findet Karotte, Hähnchen findet Huhn', () => {
  assert.equal(searchFoods('Möhre').foods[0].id, 'karotte');
  assert.equal(searchFoods('hähnchen').foods[0].id, 'huhn');
  assert.equal(searchFoods('Erdnussbutter').foods[0].id, 'erdnuss');
});

test('Bereits eingeplantes Lebensmittel: Ja', () => {
  const a = ask('Karotte', child, [], TODAY).find((x) => x.kind === 'food')!;
  assert.equal(a.kind === 'food' && a.tone, 'ja');
});

test('Später geplantes Lebensmittel: bald, mit Datum', () => {
  const a = ask('Chiasamen', child, [], TODAY).find((x) => x.kind === 'food')!;
  assert.equal(a.kind === 'food' && a.tone, 'bald');
  assert.match(a.detail, /Im Plan ab/);
});

test('Ausgeschlossenes Allergen: pausiert', () => {
  const a = ask('Ei', { ...child, exclusions: ['ei'] }, [], TODAY).find((x) => x.kind === 'food')!;
  assert.equal(a.kind === 'food' && a.tone, 'pausiert');
});

test('Vor dem Beikoststart: noch nicht', () => {
  const a = ask('Karotte', { ...child, startDate: '2026-12-20' }, [], TODAY).find((x) => x.kind === 'food')!;
  assert.equal(a.kind === 'food' && a.tone, 'bald');
});

test('Nüsse: Tabu-Antwort und Nussmus-Treffer', () => {
  const a = ask('Nüsse', child, [], TODAY);
  assert.equal(a[0].kind, 'avoid');
});

test('Portion: erste Woche wenige Löffel, später 100 g Gemüse', () => {
  const w1 = portionFor('mittag', 2, ['karotte']);
  assert.match(w1.lines[0].amount, /Löffel/);
  const w4 = portionFor('mittag', 25, ['karotte', 'kartoffel', 'rind', 'rapsoel']);
  assert.deepEqual(w4.lines.map((l) => l.amount), ['100 g', '50 g', '30 g', '1 EL']);
  assert.equal(portionFor('abend', 40, ['hafer', 'vollmilch']).lines[0].amount, '200 ml');
});
