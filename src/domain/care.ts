/**
 * Organisationshilfen: Abwechslung, eisenreiche Lebensmittel im Überblick, Trinken.
 *
 * Bewusst ohne Bewertung des einzelnen Kindes (keine Zielwerte, keine Ampel, kein „zu wenig“):
 * Die App dokumentiert und informiert, sie erkennt keinen Nährstoffmangel und plant keine
 * individuelle Allergievorbeugung.
 *
 * - Abwechslung: schon angebotene Lebensmittel, die länger nicht dabei waren.
 * - Eisenreiche Lebensmittel: neutrale Übersicht der letzten 7 Tage.
 * - Trinken: Allgemeine Empfehlung, spätestens mit dem dritten Brei Wasser anzubieten (Gesund ins Leben / KKH).
 */
import { FOOD_BY_ID } from '@/data/foods';
import { addDays, diffDays } from './dates';
import { AFTERNOON_FROM_DAY, effectiveStartDate } from './planner';
import type { Child, Food, FoodLog } from './types';

/** Ab so vielen Tagen erscheint ein schon angebotenes Lebensmittel unter „Mal wieder anbieten?“. */
export const REVISIT_DAYS = 10;

export interface Revisit {
  foodId: string;
  lastDate: string;
  daysSince: number;
  liked: boolean;
}

/**
 * Schon angebotene Lebensmittel, die länger nicht dabei waren (Lieblinge zuerst).
 * Lebensmittel mit notierter Reaktion oder Ausschluss erscheinen nie.
 */
export function revisitFoods(child: Child, logs: FoodLog[], today: string, minDays = REVISIT_DAYS): Revisit[] {
  const own = logs.filter((l) => l.childId === child.id && l.date <= today);
  const byFood = new Map<string, FoodLog[]>();
  for (const l of own) byFood.set(l.foodId, [...(byFood.get(l.foodId) ?? []), l]);
  const out: Revisit[] = [];
  for (const [foodId, list] of byFood) {
    const food = FOOD_BY_ID[foodId];
    if (!food || child.excludedFoods.includes(foodId) || food.allergens.some((a) => child.exclusions.includes(a))) continue;
    if (list.some((l) => l.reaction !== 'keine')) continue;
    const lastDate = list.map((l) => l.date).sort().pop()!;
    const daysSince = diffDays(lastDate, today);
    if (daysSince < minDays) continue;
    out.push({ foodId, lastDate, daysSince, liked: list.some((l) => l.liking === 1) && !list.some((l) => l.liking === -1) });
  }
  return out.sort((a, b) => Number(b.liked) - Number(a.liked) || b.daysSince - a.daysSince);
}

export const isIronSource = (food: Food | undefined): boolean =>
  !!food && (food.ironRich === true || food.category === 'fisch');

export interface IronWeek {
  /** Tage der letzten 7 (inkl. heute) mit mindestens einem eisenreichen Lebensmittel. */
  days: number;
  /** Je Tag (ältester zuerst): eisenreiches Lebensmittel eingetragen ja/nein. */
  perDay: { date: string; iron: boolean }[];
  /** false, solange noch kein eisenreiches Lebensmittel eingetragen ist. */
  active: boolean;
}

export function ironWeek(child: Child, logs: FoodLog[], today: string): IronWeek {
  const own = logs.filter((l) => l.childId === child.id && l.reaction === 'keine');
  const active = own.some((l) => isIronSource(FOOD_BY_ID[l.foodId]));
  const perDay = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    return { date, iron: own.some((l) => l.date === date && isIronSource(FOOD_BY_ID[l.foodId])) };
  });
  return { days: perDay.filter((d) => d.iron).length, perDay, active };
}

/** Trinken wird Thema, sobald der dritte Brei (Nachmittag) im Plan ist – oder ab 12 Monaten die Kuhmilch. */
export function drinkStage(child: Child, today: string): 'noch_nicht' | 'wasser' | 'kuhmilch' {
  const start = effectiveStartDate(child);
  const ageDays = diffDays(child.birthDate, today);
  if (ageDays >= 365) return 'kuhmilch';
  if (diffDays(start, today) >= AFTERNOON_FROM_DAY) return 'wasser';
  return 'noch_nicht';
}
