/**
 * Familienkalender: U-Untersuchungen, Impftermine, Kita-Eingewöhnung – reine Terminorganisation.
 * Die App bewertet nichts und empfiehlt keine Impfungen; sie zeigt Zeiträume aus der Kinder-Richtlinie des G-BA
 * und erinnert an Termine, die die Familie selbst einträgt.
 */
import { addDays, addMonths, diffDays } from './dates';
import type { Child } from './types';
import { t, tr } from '@/i18n';

export type AppointmentKind = 'u' | 'impfung' | 'kita' | 'sonstiges';

export interface Appointment {
  id: string;
  childId: string;
  kind: AppointmentKind;
  title: string;
  date: string;
  /** HH:MM, freiwillig. */
  time: string | null;
  note: string;
  /** Am Vortag um 18 Uhr erinnern. */
  remind: boolean;
}

export const APPOINTMENT_KINDS: { id: AppointmentKind; emoji: string; label: string }[] = tr([
  { id: 'u', emoji: '🩺', label: 'U-Untersuchung' },
  { id: 'impfung', emoji: '💉', label: 'Impftermin' },
  { id: 'kita', emoji: '🎒', label: 'Kita-Eingewöhnung' },
  { id: 'sonstiges', emoji: '📌', label: 'Anderer Termin' },
]);

export const kindInfo = (kind: AppointmentKind) => APPOINTMENT_KINDS.find((k) => k.id === kind) ?? APPOINTMENT_KINDS[3];

/**
 * Früherkennungsuntersuchungen laut Kinder-Richtlinie des G-BA (Stand 2026).
 * „3.–4. Lebensmonat“ = vom vollendeten 2. bis zum vollendeten 4. Monat. U1 und U2 finden meist in der Klinik statt.
 * U10/U11 sind keine Kassenleistung des G-BA-Programms und liegen außerhalb der Zielgruppe.
 */
export const U_CHECKS: { id: string; label: string; from: { months?: number; days?: number }; to: { months?: number; days?: number } }[] = [
  { id: 'U3', label: '4.–5. Lebenswoche', from: { days: 21 }, to: { days: 35 } },
  { id: 'U4', label: '3.–4. Lebensmonat', from: { months: 2 }, to: { months: 4 } },
  { id: 'U5', label: '6.–7. Lebensmonat', from: { months: 5 }, to: { months: 7 } },
  { id: 'U6', label: '10.–12. Lebensmonat', from: { months: 9 }, to: { months: 12 } },
  { id: 'U7', label: '21.–24. Lebensmonat', from: { months: 20 }, to: { months: 24 } },
  { id: 'U7a', label: '34.–36. Lebensmonat', from: { months: 33 }, to: { months: 36 } },
  { id: 'U8', label: '46.–48. Lebensmonat', from: { months: 45 }, to: { months: 48 } },
  { id: 'U9', label: '60.–64. Lebensmonat', from: { months: 59 }, to: { months: 64 } },
];

export const CALENDAR_SOURCES = [
  { label: 'G-BA: Früherkennungsuntersuchungen bei Kindern (Kinder-Richtlinie)', url: 'https://www.g-ba.de/institution/themenschwerpunkte/frueherkennung/kinder/' },
  { label: 'Bundesgesundheitsministerium: Früherkennungsuntersuchungen bei Kindern', url: 'https://www.bundesgesundheitsministerium.de/themen/praevention/kindergesundheit/frueherkennungsuntersuchung-bei-kindern/seite' },
  { label: 'Bundesgesundheitsministerium: Schutzimpfungen (STIKO-Empfehlungen)', url: 'https://www.bundesgesundheitsministerium.de/themen/praevention/impfungen/schutzimpfungen/' },
];

export type WindowState = 'vorbei' | 'jetzt' | 'bald' | 'spaeter';

export interface UWindow {
  id: string;
  label: string;
  from: string;
  to: string;
  state: WindowState;
  /** Ein passender Termin ist schon eingetragen. */
  booked: Appointment | null;
}

const shift = (birth: string, p: { months?: number; days?: number }) => addDays(addMonths(birth, p.months ?? 0), p.days ?? 0);

/** „U5“ im Titel eines U-Termins erkennen (auch „U 5“, „u7a“). */
export function matchesCheck(a: Appointment, id: string): boolean {
  if (a.kind !== 'u') return false;
  const norm = a.title.toLowerCase().replace(/\bu\s+(\d)/g, 'u$1');
  return new RegExp(`(^|[^a-z0-9])${id.toLowerCase()}($|[^a-z0-9])`).test(norm);
}

/**
 * Zeiträume der U-Untersuchungen für ein Kind. Das Geburtsdatum ist nur auf den Monat genau bekannt (Monatsmitte),
 * deshalb zeigt die App die Zeiträume als Monate an.
 */
export function uWindows(child: Child, today: string, appointments: Appointment[] = [], soonDays = 30): UWindow[] {
  const own = appointments.filter((a) => a.childId === child.id);
  return U_CHECKS.map((u) => {
    const from = shift(child.birthDate, u.from);
    const to = shift(child.birthDate, u.to);
    const state: WindowState = to < today ? 'vorbei' : from <= today ? 'jetzt' : diffDays(today, from) <= soonDays ? 'bald' : 'spaeter';
    return { id: u.id, label: t(u.label), from, to, state, booked: own.find((a) => matchesCheck(a, u.id)) ?? null };
  });
}

/** Kommende Termine eines Kindes, nächste zuerst. */
export function upcoming(appointments: Appointment[], childId: string, today: string): Appointment[] {
  return appointments
    .filter((a) => a.childId === childId && a.date >= today)
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')));
}

/**
 * Was „Heute“ zeigt: der nächste eigene Termin in den kommenden 14 Tagen –
 * sonst eine U-Untersuchung, deren Zeitraum gerade läuft oder bald beginnt und für die noch kein Termin eingetragen ist.
 */
export function calendarHint(child: Child, appointments: Appointment[], today: string):
  | { type: 'termin'; appointment: Appointment; inDays: number }
  | { type: 'u'; window: UWindow }
  | null {
  const next = upcoming(appointments, child.id, today)[0];
  if (next && diffDays(today, next.date) <= 14) return { type: 'termin', appointment: next, inDays: diffDays(today, next.date) };
  const open = uWindows(child, today, appointments, 14).find((w) => (w.state === 'jetzt' || w.state === 'bald') && !w.booked);
  return open ? { type: 'u', window: open } : null;
}

/** Zeitpunkt der Erinnerung: am Vortag um 18 Uhr (lokale Zeit). */
export function reminderAt(a: Appointment): Date {
  const [y, m, d] = addDays(a.date, -1).split('-').map(Number);
  return new Date(y, m - 1, d, 18, 0, 0);
}

/** Text der Erinnerung; diskret = ohne Art des Termins und ohne Namen (Sperrbildschirm). */
export function appointmentReminderText(a: Appointment, childName: string, discreet: boolean): { title: string; body: string } {
  if (discreet) return { title: t('Morgen steht ein Termin an'), body: t('Tippe hier für Details.') };
  const when = a.time ? t('morgen um {0}', { 0: a.time }) : t('morgen');
  return { title: t('{0} {1}', { 0: kindInfo(a.kind).emoji, 1: a.title || kindInfo(a.kind).label }), body: t('{0} für {1}', { 0: when, 1: childName }) };
}
