import { FOOD_BY_ID } from '@/data/foods';
import { SEASON } from '@/data/season';
import { TIPS, type Tip, type TipPhase } from '@/data/tips';
import { ageInMonths, diffDays, parseDay } from './dates';
import { blockReason, effectiveStartDate } from './planner';
import type { Child, Food, FoodLog } from './types';

/** Welche Tipps gerade passen: Phase aus Startdatum und Alter, Jahreszeit aus dem Datum. */
export function tipPhases(child: Child, today: string): TipPhase[] {
  const sinceStart = diffDays(effectiveStartDate(child), today);
  const phases: TipPhase[] = ['immer'];
  if (sinceStart < 0) phases.push('vorStart');
  else if (sinceStart < 28) phases.push('start');
  else phases.push('laeuft');
  if (ageInMonths(child.birthDate, today) >= 10) phases.push('familie');
  return phases;
}

export function tipsFor(child: Child, today: string): Tip[] {
  const month = parseDay(today).getUTCMonth() + 1;
  const phases = tipPhases(child, today);
  return TIPS.filter((t) => phases.includes(t.phase) && (!t.months || t.months.includes(month)));
}

/** Gleicher Tag → gleicher Tipp; jeden Tag ein anderer. */
export function tipOfDay(child: Child, today: string, offset = 0): Tip {
  const list = tipsFor(child, today);
  const dayNumber = Math.floor(parseDay(today).getTime() / 86_400_000);
  return list[(((dayNumber + offset) % list.length) + list.length) % list.length];
}

export type SeasonStatus = 'probiert' | 'neu';

export interface SeasonItem {
  food: Food;
  stored: boolean;
  status: SeasonStatus;
}

/** Regionales Obst und Gemüse mit Saison in diesem Monat, ohne blockierte Lebensmittel. Probiertes zuerst. */
export function seasonalFoods(child: Child, logs: FoodLog[], today: string): SeasonItem[] {
  const month = parseDay(today).getUTCMonth() + 1;
  const tried = new Set(logs.filter((l) => l.childId === child.id && l.reaction === 'keine').map((l) => l.foodId));
  const items: SeasonItem[] = [];
  for (const [id, s] of Object.entries(SEASON)) {
    const food = FOOD_BY_ID[id];
    if (!food || blockReason(food, child, logs) !== null) continue;
    const fresh = s.frisch.includes(month);
    const stored = !fresh && !!s.lager?.includes(month);
    if (!fresh && !stored) continue;
    items.push({ food, stored, status: tried.has(id) ? 'probiert' : 'neu' });
  }
  return items.sort((a, b) => Number(a.stored) - Number(b.stored) || (a.status === b.status ? 0 : a.status === 'probiert' ? -1 : 1));
}
