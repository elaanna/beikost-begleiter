import { test } from 'node:test';
import assert from 'node:assert/strict';
import { busyIntervals, DEFAULT_SETTINGS, isAvailable, nextShift, planDayTasks, type Caregiver, type FamilySettings } from '../src/domain/shifts';
import { DIGESTION_INFO, DIGESTION_RED_FLAGS } from '../src/domain/digestion';

const mama: Caregiver = { id: 'm', name: 'Mama', emoji: '👩' };
const papa: Caregiver = { id: 'p', name: 'Papa', emoji: '👨' };
const kitaSettings: FamilySettings = { ...DEFAULT_SETTINGS, kita: { ...DEFAULT_SETTINGS.kita, enabled: true } };
// 2026-11-23 ist ein Montag
const MON = '2026-11-23';

test('Frühschicht (05:00–13:30, 30 min Weg) blockiert bis 14:00', () => {
  const iv = busyIntervals('frueh', 'frei', DEFAULT_SETTINGS);
  assert.deepEqual(iv, [[270, 840]]);
  assert.equal(isAvailable(12 * 60, iv), false);
  assert.equal(isAvailable(15 * 60, iv), true);
});

test('Nachtdienst blockiert den Abend und den nächsten Morgen', () => {
  const tonight = busyIntervals('nacht', 'frei', DEFAULT_SETTINGS);
  assert.equal(isAvailable(18 * 60, tonight), true);
  assert.equal(isAvailable(22 * 60, tonight), false);
  const nextMorning = busyIntervals('frei', 'nacht', DEFAULT_SETTINGS);
  assert.equal(isAvailable(6 * 60, nextMorning), false);
  assert.equal(isAvailable(8 * 60, nextMorning), true);
});

test('Papa Früh, Mama Büro, Kita-Tag: Papa holt ab, Mama bringt', () => {
  const tasks = planDayTasks({
    date: MON,
    caregivers: [mama, papa],
    shifts: [{ caregiverId: 'p', date: MON, kind: 'frueh' }, { caregiverId: 'm', date: MON, kind: 'buero' }],
    settings: kitaSettings,
    meals: ['mittag', 'abend'],
  });
  assert.deepEqual(tasks.map((t) => t.kind), ['kita_bringen', 'kita_abholen', 'abend']);
  const bring = tasks.find((t) => t.kind === 'kita_bringen')!;
  assert.equal(bring.caregiverId, null, 'Mama ab 07:30 unterwegs, Papa im Frühdienst: Lücke');
  assert.equal(tasks.find((t) => t.kind === 'kita_abholen')!.caregiverId, 'p');
});

test('Niemand verfügbar ergibt eine Lücke', () => {
  const tasks = planDayTasks({
    date: MON,
    caregivers: [mama, papa],
    shifts: [{ caregiverId: 'p', date: MON, kind: 'buero' }, { caregiverId: 'm', date: MON, kind: 'buero' }],
    settings: DEFAULT_SETTINGS,
    meals: ['mittag'],
  });
  assert.equal(tasks[0].caregiverId, null);
  assert.deepEqual(tasks[0].available, []);
});

test('Aufgaben werden fair verteilt, wenn beide frei haben', () => {
  const tasks = planDayTasks({ date: MON, caregivers: [mama, papa], shifts: [], settings: DEFAULT_SETTINGS, meals: ['mittag', 'nachmittag', 'abend'] });
  const counts = tasks.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.caregiverId!]: (acc[t.caregiverId!] ?? 0) + 1 }), {});
  assert.ok(Math.abs((counts.m ?? 0) - (counts.p ?? 0)) <= 1);
});

test('Wochenende ist kein Kita-Tag', () => {
  const tasks = planDayTasks({ date: '2026-11-28', caregivers: [mama], shifts: [], settings: kitaSettings, meals: ['mittag'] });
  assert.deepEqual(tasks.map((t) => t.kind), ['mittag']);
});

test('Dienst-Kreislauf beim Antippen', () => {
  assert.equal(nextShift('frei'), 'frueh');
  assert.equal(nextShift('buero'), 'frei');
});

test('Verdauung: die App wertet Einträge nicht aus, sie zeigt nur allgemeines Wissen', () => {
  assert.ok(DIGESTION_INFO.length >= 3);
  assert.ok(DIGESTION_RED_FLAGS.some((f) => /Blut/.test(f)));
});
