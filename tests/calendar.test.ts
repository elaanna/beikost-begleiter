import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appointmentReminderText, calendarHint, matchesCheck, reminderAt, uWindows, type Appointment } from '../src/domain/calendar';
import { allergenKeepUp } from '../src/domain/allergenStatus';
import type { Child, FoodLog } from '../src/domain/types';

const child: Child = {
  id: 'c1', familyId: 'f1', name: 'Ben', birthDate: '2026-05-15', approach: 'brei', milk: 'flasche',
  atopicDermatitis: false, peanutCleared: false, startDate: '2026-10-15', exclusions: [], excludedFoods: [],
};
const appt = (p: Partial<Appointment>): Appointment => ({ id: 'a1', childId: 'c1', kind: 'u', title: 'U5', date: '2026-12-10', time: null, note: '', remind: true, ...p });

test('U windows follow the G-BA months of life (birth mid-May → U5 from mid-October to mid-December)', () => {
  const w = uWindows(child, '2026-11-27');
  const u5 = w.find((x) => x.id === 'U5')!;
  assert.equal(u5.from, '2026-10-15');
  assert.equal(u5.to, '2026-12-15');
  assert.equal(u5.state, 'jetzt');
  assert.equal(w.find((x) => x.id === 'U4')!.state, 'vorbei');
  assert.equal(w.find((x) => x.id === 'U6')!.state, 'spaeter');
  assert.equal(w.find((x) => x.id === 'U6')!.from, '2027-02-15');
});

test('a U appointment is recognised by its title', () => {
  assert.ok(matchesCheck(appt({ title: 'U 5 bei Dr. Meier' }), 'U5'));
  assert.ok(!matchesCheck(appt({ title: 'U5' }), 'U7'));
  assert.ok(!matchesCheck(appt({ title: 'U7a' }), 'U7'));
  assert.ok(matchesCheck(appt({ title: 'u7a' }), 'U7a'));
  assert.ok(!matchesCheck(appt({ kind: 'impfung', title: 'U5' }), 'U5'));
});

test('Heute hint: own appointment within 14 days first, else an open U window without appointment', () => {
  const soon = calendarHint(child, [appt({ kind: 'kita', title: 'Kita', date: '2026-12-01' })], '2026-11-27');
  assert.equal(soon?.type, 'termin');
  const u = calendarHint(child, [], '2026-11-27');
  assert.equal(u?.type, 'u');
  assert.equal(u?.type === 'u' && u.window.id, 'U5');
  // U5 booked (in 13 days) → shows that appointment instead of the window
  const booked = calendarHint(child, [appt({ date: '2026-12-10' })], '2026-11-27');
  assert.equal(booked?.type, 'termin');
  // booked but far away → nothing nags
  assert.equal(calendarHint(child, [appt({ date: '2026-12-14' })], '2026-11-27'), null);
});

test('reminder the day before at 18:00, discreet text hides kind and name', () => {
  const at = reminderAt(appt({ date: '2026-12-10' }));
  assert.equal(at.getDate(), 9);
  assert.equal(at.getHours(), 18);
  const open = appointmentReminderText(appt({ time: '09:30' }), 'Ben', false);
  assert.match(open.title, /U5/);
  assert.match(open.body, /09:30/);
  const discreet = appointmentReminderText(appt({}), 'Ben', true);
  assert.doesNotMatch(discreet.title + discreet.body, /U5|Ben/);
});

const log = (foodId: string, date: string, reaction: FoodLog['reaction'] = 'keine'): FoodLog => ({ id: `${foodId}-${date}`, childId: 'c1', foodId, date, liking: 0, reaction, note: '' });

test('keep allergens going: introduced and tolerated, not given for 7+ days', () => {
  const logs = [log('ei', '2026-11-10'), log('ei', '2026-11-12'), log('lachs', '2026-11-24')];
  const items = allergenKeepUp(child, logs, '2026-11-27');
  assert.deepEqual(items.map((i) => i.guide.id), ['ei']);
  assert.equal(items[0].days, 15);
  assert.equal(items[0].foodId, 'ei');
  // planned for today → no hint
  assert.deepEqual(allergenKeepUp(child, logs, '2026-11-27', ['ei']), []);
});

test('keep allergens going: never for reactions or known allergies', () => {
  assert.deepEqual(allergenKeepUp(child, [log('ei', '2026-11-01'), log('ei', '2026-11-02', 'haut')], '2026-11-27'), []);
  assert.deepEqual(allergenKeepUp({ ...child, exclusions: ['ei'] }, [log('ei', '2026-11-01')], '2026-11-27'), []);
});
