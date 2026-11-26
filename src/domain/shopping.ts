import { CATEGORY_LABEL, FOOD_BY_ID } from '@/data/foods';
import type { Food, PlanDay } from './types';
import { t } from '@/i18n';

const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL);

export interface ShoppingItem {
  food: Food;
  /** An wie vielen Mahlzeiten das Lebensmittel im Zeitraum vorkommt. */
  servings: number;
}

export interface PrepTask {
  title: string;
  detail: string;
}

/** Fasst einen Plan zu einer Einkaufsliste zusammen, gruppiert nach Kategorie. */
export function shoppingList(days: PlanDay[]): ShoppingItem[] {
  const counts = new Map<string, number>();
  for (const day of days) {
    for (const meal of day.meals) {
      for (const id of meal.foodIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([id, servings]) => ({ food: FOOD_BY_ID[id], servings }))
    .filter((x) => x.food)
    .sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.food.category) - CATEGORY_ORDER.indexOf(b.food.category) ||
        a.food.name.localeCompare(b.food.name, 'de'),
    );
}

/** Vorkoch-Vorschläge: Gemüse, das mehrfach vorkommt, portionsweise einfrieren. */
export function prepTasks(days: PlanDay[]): PrepTask[] {
  const tasks: PrepTask[] = [];
  for (const item of shoppingList(days)) {
    const f = item.food;
    if (item.servings >= 3 && (f.category === 'gemuese' || f.category === 'fleisch')) {
      tasks.push({
        title: t('{0}: {1} Portionen vorkochen', { 0: f.name, 1: item.servings }),
        detail: t('Weich garen, pürieren bzw. portionieren und in Eiswürfelformen einfrieren. Aufgetaut nur einmal erwärmen.'),
      });
    }
  }
  const eggDays = days.filter((d) => d.meals.some((m) => m.foodIds.includes('ei'))).length;
  if (eggDays > 0) {
    tasks.push({
      title: t('Eier hart kochen ({0}×)', { 0: eggDays }),
      detail: t('Etwa 10 Minuten kochen, bis Eiweiß und Eigelb vollständig fest sind.'),
    });
  }
  return tasks;
}
