import { RECIPE_BY_ID } from '@/data/allRecipes';
import { diffDays } from './dates';
import type { PlannedMeal } from './types';

export interface StockLike {
  id: string;
  kind: 'gefroren' | 'vorrat';
  name: string;
  recipeId: string | null;
  foodId: string | null;
  portions: number;
  madeOn: string;
}

/** Allgemeine Orientierung für selbst gekochten, eingefrorenen Brei (BZgA): bis zu etwa 2 Monate bei −18 °C. */
export const FREEZER_GUIDE_DAYS = 60;

const core = (ids: string[]) => ids.filter((id) => id !== 'rapsoel' && id !== 'olivenoel').sort().join(',');

/** Eingefrorene Portionen, die zur geplanten Mahlzeit passen (gleiches Rezept oder gleiche Zutaten). */
export function matchingFrozen<T extends StockLike>(meal: PlannedMeal, stock: T[]): T[] {
  const mealCore = core(meal.foodIds);
  return stock.filter((s) => {
    if (s.kind !== 'gefroren' || s.portions <= 0) return false;
    if (meal.recipeId && s.recipeId === meal.recipeId) return true;
    const r = s.recipeId ? RECIPE_BY_ID[s.recipeId] : undefined;
    return !!r && core(r.foods) === mealCore;
  });
}

/** Neutraler Hinweis zum Alter einer Portion – ohne Garantie für die Haltbarkeit. */
export function freezerAge(madeOn: string, today: string): { days: number; beyondGuide: boolean } {
  const days = diffDays(madeOn, today);
  return { days, beyondGuide: days > FREEZER_GUIDE_DAYS };
}

/** Lebensmittel, die laut Vorrat vorhanden sind (für die Einkaufsliste). */
export function pantryFoodIds(stock: StockLike[]): Set<string> {
  return new Set(stock.filter((s) => s.kind === 'vorrat' && s.portions > 0 && s.foodId).map((s) => s.foodId!));
}
