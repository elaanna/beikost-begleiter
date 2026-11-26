import { RECIPE_BY_ID } from '@/data/allRecipes';
import { FOOD_BY_ID } from '@/data/foods';
import { blockReason } from './planner';
import type { Child, FoodLog, MealSlot, PlanDay } from './types';

export interface SwapEntry {
  date: string;
  slot: MealSlot;
  recipeId: string;
}

/**
 * Getauschte Mahlzeiten in den Plan übernehmen.
 * Sicherheitsregeln: Einführungstage (neues Lebensmittel) werden nie ersetzt, und ein Tausch wird
 * ignoriert, sobald eine Zutat inzwischen blockiert ist (z. B. nach einer notierten Reaktion).
 */
export function applySwaps(days: PlanDay[], swaps: SwapEntry[], child: Child, logs: FoodLog[]): PlanDay[] {
  if (!swaps.length) return days;
  return days.map((day) => ({
    ...day,
    meals: day.meals.map((meal) => {
      if (meal.newFoodId) return meal;
      const swap = swaps.find((s) => s.date === day.date && s.slot === meal.slot);
      const recipe = swap ? RECIPE_BY_ID[swap.recipeId] : undefined;
      if (!recipe) return meal;
      const blocked = recipe.foods.some((id) => {
        const f = FOOD_BY_ID[id];
        return !f || blockReason(f, child, logs) !== null;
      });
      if (blocked) return meal;
      return { ...meal, title: recipe.name, foodIds: recipe.foods, recipeId: recipe.id };
    }),
  }));
}
