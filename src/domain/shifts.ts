/**
 * Familienlogistik im Schichtdienst: Wer kann füttern, wer bringt und holt aus der Kita?
 * Reine Logik ohne React – getestet in tests/shifts.test.ts.
 */
import { parseDay } from './dates';
import type { MealSlot } from './types';
import { t, tr } from '@/i18n';

export type ShiftKind = 'frei' | 'frueh' | 'spaet' | 'nacht' | 'buero';

export interface Caregiver {
  id: string;
  name: string;
  emoji: string;
}

export interface ShiftEntry {
  caregiverId: string;
  date: string;
  kind: ShiftKind;
}

export interface ShiftTime {
  label: string;
  start: string; // HH:MM
  end: string; // HH:MM, kann nach Mitternacht liegen
}

export interface FamilySettings {
  shiftTimes: Record<Exclude<ShiftKind, 'frei'>, ShiftTime>;
  /** Puffer für Arbeitsweg vor und nach der Schicht, in Minuten. */
  commuteMinutes: number;
  /** Kita-Tage (1 = Montag … 5 = Freitag) mit Bring- und Abholzeit. */
  kita: { enabled: boolean; weekdays: number[]; bring: string; pickup: string };
  mealTimes: Record<MealSlot, string>;
}

export const DEFAULT_SETTINGS: FamilySettings = {
  shiftTimes: {
    frueh: { label: 'Früh', start: '05:00', end: '13:30' },
    spaet: { label: 'Spät', start: '14:00', end: '22:30' },
    nacht: { label: 'Nacht', start: '22:00', end: '06:00' },
    buero: { label: 'Büro', start: '08:00', end: '16:30' },
  },
  commuteMinutes: 30,
  kita: { enabled: false, weekdays: [1, 2, 3, 4, 5], bring: '08:00', pickup: '15:00' },
  mealTimes: { mittag: '12:00', nachmittag: '15:30', abend: '18:00' },
};

export const SHIFT_ORDER: ShiftKind[] = ['frei', 'frueh', 'spaet', 'nacht', 'buero'];

export const SHIFT_STYLE: Record<ShiftKind, { short: string; emoji: string }> = tr({
  frei: { short: 'Frei', emoji: '🏡' },
  frueh: { short: 'Früh', emoji: '🌅' },
  spaet: { short: 'Spät', emoji: '🌇' },
  nacht: { short: 'Nacht', emoji: '🌙' },
  buero: { short: 'Büro', emoji: '💼' },
});

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Belegte Minuten-Intervalle eines Dienstes an einem Tag (inkl. Nachtdienst vom Vortag). */
export function busyIntervals(kind: ShiftKind, prevKind: ShiftKind, s: FamilySettings): [number, number][] {
  const out: [number, number][] = [];
  const buf = s.commuteMinutes;
  const add = (k: ShiftKind, fromPrevDay: boolean) => {
    if (k === 'frei') return;
    const t = s.shiftTimes[k];
    const start = toMin(t.start) - buf;
    let end = toMin(t.end) + buf;
    const overnight = toMin(t.end) <= toMin(t.start);
    if (fromPrevDay) {
      if (overnight) out.push([0, end]); // Rest der Nacht bis morgens
      return;
    }
    if (overnight) end = 24 * 60;
    out.push([Math.max(0, start), Math.min(24 * 60, end)]);
  };
  add(prevKind, true);
  add(kind, false);
  return out;
}

export function isAvailable(minute: number, intervals: [number, number][], durationMin = 30): boolean {
  return intervals.every(([a, b]) => minute + durationMin <= a || minute >= b);
}

export type TaskKind = 'kita_bringen' | 'kita_abholen' | MealSlot;

export interface DayTask {
  kind: TaskKind;
  time: string;
  label: string;
  /** Zugeteilte Person oder null = niemand verfügbar (Lücke). */
  caregiverId: string | null;
  /** Alle, die zu dieser Zeit können. */
  available: string[];
}

const TASK_LABEL: Record<TaskKind, string> = tr({
  kita_bringen: 'Kita bringen',
  kita_abholen: 'Kita abholen',
  mittag: 'Mittagessen',
  nachmittag: 'Nachmittag',
  abend: 'Abendessen',
});

/**
 * Plant die Aufgaben eines Tages. An Kita-Tagen isst das Kind mittags in der Kita.
 * Verteilung: Wer kann, und unter den Verfügbaren wer an diesem Tag bisher am wenigsten übernommen hat.
 */
export function planDayTasks(params: {
  date: string;
  caregivers: Caregiver[];
  shifts: ShiftEntry[];
  settings: FamilySettings;
  meals: MealSlot[];
}): DayTask[] {
  const { date, caregivers, shifts, settings, meals } = params;
  const dow = parseDay(date).getUTCDay(); // 0 = So
  const isoDow = dow === 0 ? 7 : dow;
  const prevDate = new Date(parseDay(date).getTime() - 86_400_000).toISOString().slice(0, 10);
  const kindOf = (cid: string, d: string): ShiftKind => shifts.find((x) => x.caregiverId === cid && x.date === d)?.kind ?? 'frei';
  const intervals = Object.fromEntries(
    caregivers.map((c) => [c.id, busyIntervals(kindOf(c.id, date), kindOf(c.id, prevDate), settings)]),
  );
  const kitaDay = settings.kita.enabled && settings.kita.weekdays.includes(isoDow);

  const wanted: { kind: TaskKind; time: string }[] = [];
  if (kitaDay) wanted.push({ kind: 'kita_bringen', time: settings.kita.bring });
  for (const m of meals) {
    if (m === 'mittag' && kitaDay) continue;
    wanted.push({ kind: m, time: settings.mealTimes[m] });
  }
  if (kitaDay) wanted.push({ kind: 'kita_abholen', time: settings.kita.pickup });
  wanted.sort((a, b) => toMin(a.time) - toMin(b.time));

  const load: Record<string, number> = Object.fromEntries(caregivers.map((c) => [c.id, 0]));
  return wanted.map((w) => {
    const available = caregivers.filter((c) => isAvailable(toMin(w.time), intervals[c.id])).map((c) => c.id);
    const chosen = [...available].sort((a, b) => load[a] - load[b])[0] ?? null;
    if (chosen) load[chosen] += 1;
    return { kind: w.kind, time: w.time, label: TASK_LABEL[w.kind], caregiverId: chosen, available };
  });
}

/** Nächster Dienst im Kreislauf beim Antippen. */
export function nextShift(kind: ShiftKind): ShiftKind {
  return SHIFT_ORDER[(SHIFT_ORDER.indexOf(kind) + 1) % SHIFT_ORDER.length];
}
