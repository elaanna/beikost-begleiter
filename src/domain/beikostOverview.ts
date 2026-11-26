/**
 * Beikost-Übersicht (nur Beikost, Milch/Stillen nicht eingerechnet):
 * 1. Vergleich der eingetragenen Lebensmittel mit den Bausteinen der geplanten Mahlzeiten
 *    (Grundrezepte Netzwerk Gesund ins Leben).
 * 2. Lebensmittelgruppen der letzten 7 Tage.
 * 3. Grob geschätzte Nährwerte aus Grundrezept-Mengen – ohne Zielwerte und ohne Bewertung.
 */
import { FOOD_BY_ID } from '@/data/foods';
import { NUTRIENTS_100G } from '@/data/nutrients';
import { addDays, diffDays } from './dates';
import { effectiveStartDate } from './planner';
import type { Child, FoodCategory, FoodLog, PlannedMeal } from './types';
import { tr } from '@/i18n';

export type Group = 'gemuese' | 'staerke' | 'eiweiss' | 'huelsen' | 'obst' | 'milch' | 'fett' | 'nuesse';

export const GROUP_INFO: Record<Group, { label: string; emoji: string }> = tr({
  gemuese: { label: 'Gemüse', emoji: '🥕' },
  staerke: { label: 'Kartoffel & Getreide', emoji: '🌾' },
  eiweiss: { label: 'Fleisch, Fisch & Ei', emoji: '🍗' },
  huelsen: { label: 'Hülsenfrüchte', emoji: '🫘' },
  obst: { label: 'Obst', emoji: '🍎' },
  milch: { label: 'Milchprodukte', emoji: '🥛' },
  fett: { label: 'Öl & Fett', emoji: '🫒' },
  nuesse: { label: 'Nüsse & Samen', emoji: '🥜' },
});

export function groupOf(foodId: string): Group | null {
  const f = FOOD_BY_ID[foodId];
  if (!f) return null;
  if (f.id === 'kartoffel' || f.id === 'suesskartoffel') return 'staerke';
  const map: Record<FoodCategory, Group> = {
    gemuese: 'gemuese', obst: 'obst', getreide: 'staerke', fleisch: 'eiweiss', fisch: 'eiweiss', ei: 'eiweiss',
    huelsenfruechte: 'huelsen', milch: 'milch', fett: 'fett', nuesse_samen: 'nuesse',
  } as Record<FoodCategory, Group>;
  return map[f.category] ?? null;
}

const own = (child: Child, logs: FoodLog[]) => logs.filter((l) => l.childId === child.id && l.reaction === 'keine');

// ---------- 1. Plan-Bausteine heute ----------

export interface MealComponent {
  group: Group;
  planned: string[];
  done: boolean;
}

/** Bausteine einer geplanten Mahlzeit und ob heute ein passendes Lebensmittel eingetragen wurde. */
export function mealComponents(meal: PlannedMeal, child: Child, logs: FoodLog[], date: string): MealComponent[] {
  const today = own(child, logs).filter((l) => l.date === date);
  const loggedGroups = new Set(today.map((l) => groupOf(l.foodId)));
  const loggedIds = new Set(today.map((l) => l.foodId));
  const byGroup = new Map<Group, string[]>();
  for (const id of meal.foodIds) {
    const g = groupOf(id);
    if (g) byGroup.set(g, [...(byGroup.get(g) ?? []), id]);
  }
  return [...byGroup.entries()].map(([group, planned]) => ({
    group,
    planned,
    done: planned.some((id) => loggedIds.has(id)) || loggedGroups.has(group),
  }));
}

// ---------- 2. Gruppen der Woche ----------

export interface WeekGroups {
  days: string[];
  rows: { group: Group; perDay: boolean[]; count: number }[];
  variety: number;
  newThisWeek: number;
}

export function weekGroups(child: Child, logs: FoodLog[], today: string): WeekGroups {
  const mine = own(child, logs);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const inWeek = mine.filter((l) => l.date >= days[0] && l.date <= today);
  const rows = (Object.keys(GROUP_INFO) as Group[]).map((group) => {
    const perDay = days.map((d) => inWeek.some((l) => l.date === d && groupOf(l.foodId) === group));
    return { group, perDay, count: perDay.filter(Boolean).length };
  }).filter((r) => r.count > 0 || ['gemuese', 'staerke', 'eiweiss', 'obst'].includes(r.group));
  const firstSeen = new Map<string, string>();
  for (const l of [...mine].sort((a, b) => a.date.localeCompare(b.date))) if (!firstSeen.has(l.foodId)) firstSeen.set(l.foodId, l.date);
  return {
    days,
    rows,
    variety: new Set(inWeek.map((l) => l.foodId)).size,
    newThisWeek: [...firstSeen.values()].filter((d) => d >= days[0]).length,
  };
}

// ---------- 3. Geschätzte Nährwerte ----------

/** Tagesmengen je Gruppe nach den Grundrezepten (g), aufgeteilt auf alle eingetragenen Lebensmittel der Gruppe. */
const DAY_GRAMS: Record<Group, number> = {
  gemuese: 100, staerke: 70, eiweiss: 30, huelsen: 30, obst: 120, milch: 200, fett: 12, nuesse: 5,
};
const MILK_PRODUCT_GRAMS: Record<string, number> = { joghurt: 50, quark: 30, frischkaese: 15, ricotta: 20, mozzarella: 15 };

export interface NutrientEstimate {
  kcal: number;
  protein: number;
  fat: number;
  iron: number;
}

export function estimateDay(child: Child, logs: FoodLog[], date: string): NutrientEstimate | null {
  const dayLogs = own(child, logs).filter((l) => l.date === date);
  const foods = [...new Set(dayLogs.map((l) => l.foodId))];
  if (!foods.length) return null;
  const sinceStart = diffDays(effectiveStartDate(child), date);
  const scale = sinceStart < 7 ? 0.3 : sinceStart < 14 ? 0.6 : 1;
  const sum: NutrientEstimate = { kcal: 0, protein: 0, fat: 0, iron: 0 };
  const groups = new Map<Group, string[]>();
  for (const id of foods) {
    const g = groupOf(id);
    if (g) groups.set(g, [...(groups.get(g) ?? []), id]);
  }
  for (const [g, ids] of groups) {
    for (const id of ids) {
      const n = NUTRIENTS_100G[id];
      if (!n) continue;
      const grams = (g === 'milch' && MILK_PRODUCT_GRAMS[id] ? MILK_PRODUCT_GRAMS[id] : DAY_GRAMS[g] / ids.length) * scale;
      sum.kcal += (n[0] * grams) / 100;
      sum.protein += (n[1] * grams) / 100;
      sum.fat += (n[2] * grams) / 100;
      sum.iron += (n[3] * grams) / 100;
    }
  }
  return sum;
}

export function estimateWeekAverage(child: Child, logs: FoodLog[], today: string): NutrientEstimate | null {
  const days = Array.from({ length: 7 }, (_, i) => estimateDay(child, logs, addDays(today, -i))).filter((d): d is NutrientEstimate => !!d);
  if (!days.length) return null;
  const avg = (k: keyof NutrientEstimate) => days.reduce((s, d) => s + d[k], 0) / days.length;
  return { kcal: avg('kcal'), protein: avg('protein'), fat: avg('fat'), iron: avg('iron') };
}

/** „Mias“, „Max’“ – Genitiv für Überschriften. */
export function genitive(name: string): string {
  return /[sßxz]$/i.test(name) ? `${name}’` : `${name}s`;
}
