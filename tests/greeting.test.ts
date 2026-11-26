import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailyLine, greetingTitle, timeGreeting } from '../src/domain/greeting';
import { accountError, cleanOtp, isValidEmail } from '../src/sync/accountRules';
import type { Child, FoodLog } from '../src/domain/types';

const child: Child = {
  id: 'c1', familyId: 'f1', name: 'Ben', birthDate: '2026-04-15', approach: 'brei', milk: 'flasche',
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-11-01', exclusions: [], excludedFoods: [],
};
let n = 0;
const log = (foodId: string, date: string, extra: Partial<FoodLog> = {}): FoodLog => ({
  id: `l${n++}`, childId: 'c1', foodId, date, liking: 0, reaction: 'keine', note: '', ...extra,
});
const base = { child, logs: [] as FoodLog[], startDate: '2026-11-01' };

test('Begrüßung nach Tageszeit, mit und ohne Vornamen', () => {
  assert.equal(timeGreeting(7), 'Guten Morgen');
  assert.equal(timeGreeting(13), 'Hallo');
  assert.equal(timeGreeting(19), 'Guten Abend');
  assert.equal(timeGreeting(23), 'Gute Nacht');
  assert.equal(greetingTitle(8, ' Michaela '), 'Guten Morgen, Michaela!');
  assert.equal(greetingTitle(8, ''), 'Guten Morgen!');
});

test('Vor dem Start: Countdown und erster Löffel', () => {
  assert.match(dailyLine({ ...base, today: '2026-10-25' }).text, /Noch 7 Tage bis zum Beikost-Start von Ben/);
  assert.match(dailyLine({ ...base, today: '2026-10-31' }).text, /Morgen/);
  assert.match(dailyLine({ ...base, today: '2026-11-01' }).text, /Bens erster Löffel/);
});

test('Neues Lebensmittel heute, Meilensteine, gestern geschmeckt', () => {
  assert.match(dailyLine({ ...base, today: '2026-11-04', newFoodId: 'ei', newFoodDay: 1, newFoodTotal: 3 }).text, /Heute neu für Ben: Hühnerei/);
  assert.match(dailyLine({ ...base, today: '2026-11-05', newFoodId: 'ei', newFoodDay: 2, newFoodTotal: 3 }).text, /Tag 2 von 3/);
  // Tag 8 = eine Woche geschafft
  assert.match(dailyLine({ ...base, today: '2026-11-08' }).text, /Eine Woche Beikost mit Ben/);
  const five = ['karotte', 'pastinake', 'kuerbis', 'kartoffel'].map((f, i) => log(f, `2026-11-0${i + 2}`));
  assert.match(dailyLine({ ...base, logs: [...five, log('rind', '2026-11-10')], today: '2026-11-10' }).text, /5 Lebensmittel hat Ben schon entdeckt/);
  assert.doesNotMatch(dailyLine({ ...base, logs: [...five, log('rind', '2026-11-09')], today: '2026-11-10' }).text, /schon entdeckt/);
  assert.match(dailyLine({ ...base, logs: [log('kuerbis', '2026-11-11', { liking: 1 })], today: '2026-11-12' }).text, /Gestern hat Ben Kürbis geschmeckt/);
});

test('Normale Tage: Satz wechselt täglich, enthält den Namen', () => {
  const a = dailyLine({ ...base, today: '2026-11-20' }).text;
  const b = dailyLine({ ...base, today: '2026-11-21' }).text;
  assert.notEqual(a, b);
  assert.match(a, /Ben/);
  assert.equal(a, dailyLine({ ...base, today: '2026-11-20' }).text);
});

test('Konto: E-Mail, Code und verständliche Fehler', () => {
  assert.equal(isValidEmail('mama@beispiel.de'), true);
  assert.equal(isValidEmail('mama@beispiel'), false);
  assert.equal(isValidEmail('ma ma@beispiel.de'), false);
  assert.equal(cleanOtp(' 123 456 '), '123456');
  assert.match(accountError('Token has expired or is invalid'), /abgelaufen/);
  assert.match(accountError('Signups not allowed for otp'), /noch kein Konto/);
  assert.match(accountError('A user with this email address has already been registered'), /schon zu einem Konto/);
  assert.match(accountError('For security purposes, you can only request this after 42 seconds.'), /warte kurz/);
});

import { shoppingText } from '../src/domain/shareText';
test('Einkaufsliste als Text', () => {
  const t = shoppingText('Einkauf 23.–29. Nov.', [{ name: 'Karotte', detail: '500 g' }, { name: 'Hafer' }]);
  assert.equal(t, 'Einkauf 23.–29. Nov.\n\n• Karotte (500 g)\n• Hafer\n\nErstellt mit nimou');
});
