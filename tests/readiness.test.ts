import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countObserved, READINESS_DECISION, READINESS_GENERAL, READINESS_SIGNS_LIST, type Observation } from '../src/domain/readiness';
import { allergenStatuses } from '../src/domain/allergenStatus';
import { ALLERGEN_GUIDES } from '../src/data/allergens';
import { FOOD_BY_ID } from '../src/data/foods';
import type { Child, FoodLog } from '../src/domain/types';

test('Reifezeichen: nur Beobachtungen zählen, kein Urteil „bereit“ in den Texten', () => {
  const answers = Object.fromEntries(READINESS_SIGNS_LIST.map((q, i) => [q.id, (i < 3 ? 'beobachtet' : 'noch_nicht') as Observation]));
  assert.equal(countObserved(answers), 3);
  const texts = [READINESS_DECISION, READINESS_GENERAL, ...READINESS_SIGNS_LIST.map((q) => q.question + q.help)].join(' ');
  assert.doesNotMatch(texts, /ist bereit|wirkt bereit|nicht bereit/i);
  assert.match(READINESS_DECISION, /keine Einschätzung/);
});

const child: Child = {
  id: 'c1', familyId: 'f1', name: 'Mia', birthDate: '2026-06-15', approach: 'brei', milk: 'flasche',
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-10-20', exclusions: [], excludedFoods: [],
};

test('Allergen-Guide: jedes Einstiegs-Lebensmittel existiert und enthält das Allergen', () => {
  assert.equal(ALLERGEN_GUIDES.length, 8);
  for (const g of ALLERGEN_GUIDES) for (const id of g.starterFoods) {
    assert.ok(FOOD_BY_ID[id], id);
    assert.ok(FOOD_BY_ID[id].allergens.includes(g.id), `${id} enthält ${g.id} nicht`);
  }
});

test('Allergen-Status: eingeführt, Reaktion, ausgeschlossen, abklären, geplant', () => {
  const logs: FoodLog[] = [
    { id: '1', childId: 'c1', foodId: 'ei', date: '2026-11-10', liking: 1, reaction: 'keine', note: '' },
    { id: '2', childId: 'c1', foodId: 'lachs', date: '2026-11-12', liking: 0, reaction: 'haut', note: '' },
  ];
  const s = allergenStatuses({ ...child, exclusions: ['soja'], atopicDermatitis: true }, logs);
  const by = (id: string) => s.find((x) => x.guide.id === id)!;
  assert.equal(by('ei').state, 'eingefuehrt');
  assert.equal(by('fisch').state, 'reaktion');
  assert.equal(by('soja').state, 'ausgeschlossen');
  assert.equal(by('erdnuss').state, 'abklaeren');
  assert.equal(by('sesam').state, 'geplant');
  assert.ok(by('sesam').plannedDate);
});
