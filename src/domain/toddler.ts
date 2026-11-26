/**
 * Kleinkind-Phase „nimou table“: Übergang ab 12 Monaten, Familien-Tagesplan mit 5 Mahlzeiten,
 * Brotdose und „noch mal anbieten“. Nur Organisation und allgemeine Orientierung – keine Bewertung
 * der Ernährung oder Entwicklung des Kindes.
 */
import { FOOD_BY_ID } from '@/data/foods';
import {
  LUNCH_RHYTHM, LUNCHBOX_ITEMS, LUNCHBOX_PARTS, TABLE_FROM_MONTHS, TABLE_OPTIONS, TABLE_RECIPES, TABLE_SLOTS,
  type LunchboxPart, type TableSlot,
} from '@/data/toddler';
import { addDays, ageInMonths, diffDays } from './dates';
import { blockReason } from './planner';
import type { Child, FoodLog } from './types';

export function isTablePhase(child: Child): boolean {
  return Boolean(child.tableSince);
}

/** Wechsel vorschlagen: ab 12 Monaten, Beikost hat schon begonnen, noch nicht umgestellt. */
export function suggestTable(child: Child, today: string): boolean {
  if (isTablePhase(child)) return false;
  if (ageInMonths(child.birthDate, today) < TABLE_FROM_MONTHS) return false;
  return !child.startDate || child.startDate <= today;
}

const fits = (foods: string[], child: Child, logs: FoodLog[]) =>
  foods.every((id) => {
    const f = FOOD_BY_ID[id];
    return f ? blockReason(f, child, logs) === null : true;
  });

export interface TableMeal {
  slot: TableSlot;
  title: string;
  foods: string[];
  recipeId?: string;
  hint?: string;
}

export interface TableDay {
  date: string;
  meals: TableMeal[];
}

/** Stabiler Tageszähler, damit sich der Plan täglich ändert, aber beim erneuten Öffnen gleich bleibt. */
const dayNumber = (date: string) => diffDays('2026-01-05', date); // ein Montag

function pick<T>(list: T[], start: number, ok: (x: T) => boolean): T | undefined {
  for (let i = 0; i < list.length; i++) {
    const item = list[((start + i) % list.length + list.length) % list.length];
    if (ok(item)) return item;
  }
  return undefined;
}

export function tableDay(child: Child, logs: FoodLog[], date: string): TableDay {
  const n = dayNumber(date);
  const weekday = ((n % 7) + 7) % 7; // 0 = Montag
  const meals: TableMeal[] = [];
  for (const slot of TABLE_SLOTS) {
    if (slot === 'mittag') {
      const kind = LUNCH_RHYTHM[weekday];
      const sameKind = TABLE_RECIPES.filter((r) => r.kind === kind);
      // Gibt es für diese Art nichts Passendes (z. B. Fisch ausgeschlossen), auf vegetarisch ausweichen
      const r = pick(sameKind, Math.floor(n / 7) + weekday, (x) => fits(x.foods, child, logs))
        ?? pick(TABLE_RECIPES.filter((x) => x.kind === 'vegetarisch'), n, (x) => fits(x.foods, child, logs));
      if (r) meals.push({ slot, title: r.name, foods: r.foods, recipeId: r.id, hint: r.safety });
      continue;
    }
    const offset = { fruehstueck: 0, vormittag: 2, nachmittag: 3, abend: 1 }[slot];
    const o = pick(TABLE_OPTIONS[slot], n + offset, (x) => fits(x.foods, child, logs));
    if (o) meals.push({ slot, title: o.title, foods: o.foods, hint: o.hint });
  }
  return { date, meals };
}

export function tableDays(child: Child, logs: FoodLog[], from: string, days: number): TableDay[] {
  return Array.from({ length: days }, (_, i) => tableDay(child, logs, addDays(from, i)));
}

/** Welche Mahlzeit ist gerade dran (nach Uhrzeit)? */
export function currentTableSlot(hm: string): TableSlot {
  if (hm < '09:30') return 'fruehstueck';
  if (hm < '11:30') return 'vormittag';
  if (hm < '14:30') return 'mittag';
  if (hm < '17:00') return 'nachmittag';
  return 'abend';
}

// ---------- Brotdose ----------

export interface LunchboxDay {
  date: string;
  /** `known: false` = noch nicht probiert → erst zu Hause anbieten, nicht in der Kita. */
  items: Record<LunchboxPart, { id: string; text: string; food: string; known: boolean }>;
}

/**
 * Brotdosen für Montag–Freitag. Nur schon Probiertes, sobald es das in einer Gruppe gibt (in die Kita nur Bekanntes);
 * sonst ein Vorschlag mit Hinweis „erst zu Hause probieren“. Nie Ausgeschlossenes; `shuffle` mischt neu.
 */
export function lunchboxWeek(child: Child, logs: FoodLog[], monday: string, shuffle = 0): LunchboxDay[] {
  const tried = new Set(logs.filter((l) => l.childId === child.id && l.reaction === 'keine').map((l) => l.foodId));
  const week = Math.floor(dayNumber(monday) / 7);
  return Array.from({ length: 5 }, (_, d) => {
    const date = addDays(monday, d);
    const items = {} as LunchboxDay['items'];
    LUNCHBOX_PARTS.forEach((part, pi) => {
      const pool = LUNCHBOX_ITEMS[part].filter((x) => {
        const f = FOOD_BY_ID[x.food];
        return !f || blockReason(f, child, logs) === null;
      });
      // In die Kita nur Bekanntes: sobald es in der Gruppe etwas Probiertes gibt, nur daraus wählen
      const known = pool.filter((x) => tried.has(x.food));
      const list = known.length ? known : pool.length ? pool : LUNCHBOX_ITEMS[part];
      const item = list[(d + week + shuffle * (pi + 1) + pi) % list.length];
      items[part] = { ...item, known: tried.has(item.food) };
    });
    return { date, items };
  });
}

/** Einkaufsliste für die Brotdosen der Woche (zusammengefasst). */
export function lunchboxShopping(days: LunchboxDay[]): { text: string; count: number }[] {
  const m = new Map<string, number>();
  for (const d of days) for (const part of LUNCHBOX_PARTS) m.set(d.items[part].text, (m.get(d.items[part].text) ?? 0) + 1);
  return [...m.entries()].map(([text, count]) => ({ text, count })).sort((a, b) => a.text.localeCompare(b.text, 'de'));
}

// ---------- Noch mal anbieten ----------

export interface Reoffer {
  foodId: string;
  offered: number;
  lastDate: string;
  daysAgo: number;
}

/**
 * Lebensmittel, die zuletzt „lieber nicht“ waren und seitdem nicht geschmeckt haben –
 * zum entspannten Wieder-Anbieten. Zählt, wie oft schon angeboten (ohne Zielzahl).
 */
export function reofferList(child: Child, logs: FoodLog[], today: string): Reoffer[] {
  const mine = logs.filter((l) => l.childId === child.id && l.reaction === 'keine');
  const byFood = new Map<string, FoodLog[]>();
  for (const l of mine) byFood.set(l.foodId, [...(byFood.get(l.foodId) ?? []), l]);
  const out: Reoffer[] = [];
  for (const [foodId, ls] of byFood) {
    const sorted = [...ls].sort((a, b) => a.date.localeCompare(b.date));
    const lastDislike = sorted.filter((l) => l.liking === -1).pop();
    if (!lastDislike) continue;
    const likedAfter = sorted.some((l) => l.liking === 1 && l.date >= lastDislike.date && l !== lastDislike);
    if (likedAfter) continue;
    const f = FOOD_BY_ID[foodId];
    if (!f || blockReason(f, child, logs) !== null) continue;
    const last = sorted[sorted.length - 1].date;
    out.push({ foodId, offered: sorted.length, lastDate: last, daysAgo: diffDays(last, today) });
  }
  // Am längsten nicht angeboten zuerst
  return out.sort((a, b) => b.daysAgo - a.daysAgo);
}
