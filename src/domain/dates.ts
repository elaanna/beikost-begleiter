import { getLang } from '@/i18n';
// Datumsfunktionen auf Basis von ISO-Tagen (yyyy-mm-dd), zeitzonenstabil über UTC.

const DAY_MS = 86_400_000;

export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayIso(now: Date = new Date()): string {
  // Lokales Datum des Geräts, nicht UTC.
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  return toIso(new Date(parseDay(iso).getTime() + days * DAY_MS));
}

export function addMonths(iso: string, months: number): string {
  const d = parseDay(iso);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return toIso(target);
}

export function diffDays(fromIso: string, toIsoDay: string): number {
  return Math.round((parseDay(toIsoDay).getTime() - parseDay(fromIso).getTime()) / DAY_MS);
}

/** Montag der Woche, in der das Datum liegt. */
export function weekStart(iso: string): string {
  const dow = parseDay(iso).getUTCDay(); // 0 = Sonntag
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(iso, offset);
}

/** Alter in vollendeten Monaten. */
export function ageInMonths(birthIso: string, onIso: string): number {
  const b = parseDay(birthIso);
  const o = parseDay(onIso);
  let months = (o.getUTCFullYear() - b.getUTCFullYear()) * 12 + (o.getUTCMonth() - b.getUTCMonth());
  if (o.getUTCDate() < b.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

const WEEKDAYS = { de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const MONTHS = {
  de: ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** „Mo, 23. Nov.“ bzw. „Mon, 23 Nov“ */
export function formatDay(iso: string, withWeekday = true): string {
  const d = parseDay(iso);
  const l = getLang();
  const base = l === 'en' ? `${d.getUTCDate()} ${MONTHS.en[d.getUTCMonth()]}` : `${d.getUTCDate()}. ${MONTHS.de[d.getUTCMonth()]}`;
  return withWeekday ? `${WEEKDAYS[l][d.getUTCDay()]}, ${base}` : base;
}

export function formatDayLong(iso: string): string {
  const d = parseDay(iso);
  return getLang() === 'en'
    ? `${d.getUTCDate()} ${MONTHS.en[d.getUTCMonth()]} ${d.getUTCFullYear()}`
    : `${d.getUTCDate()}. ${MONTHS.de[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const MONTHS_LONG = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** „Juni 2026“ – für den Geburtsmonat (die App speichert keinen genauen Geburtstag). */
export function formatMonth(iso: string): string {
  const d = parseDay(iso);
  return `${MONTHS_LONG[getLang()][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Datensparsamkeit: Aus einem Monat wird ein Stellvertreter-Datum in der Monatsmitte.
 * Für Alter und Zeitfenster reicht das (Abweichung höchstens etwa zwei Wochen).
 */
export function monthToBirthDate(year: number, month0: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}-15`;
}

/** Die letzten n Monate bis einschließlich des aktuellen, neueste zuerst. */
export function recentMonths(today: string, n: number): { year: number; month0: number; iso: string }[] {
  const d = parseDay(today);
  return Array.from({ length: n }, (_, i) => {
    const m = d.getUTCMonth() - i;
    const year = d.getUTCFullYear() + Math.floor(m / 12);
    const month0 = ((m % 12) + 12) % 12;
    return { year, month0, iso: monthToBirthDate(year, month0) };
  });
}
