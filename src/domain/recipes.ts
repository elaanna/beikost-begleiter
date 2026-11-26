import { FOOD_BY_ID } from '@/data/foods';
import { ALL_RECIPES, type LibraryRecipe } from '@/data/allRecipes';
import type { RecipeCategory } from '@/data/babyRecipes';
import { ageInMonths } from './dates';
import { blockReason } from './planner';
import type { Allergen, Child, FoodLog, MealSlot } from './types';

export interface RecipeFit {
  recipe: LibraryRecipe;
  /** Grund, warum das Rezept nicht passt (Allergie, Ausschluss, Reaktion). */
  blocked: string | null;
  /** Zutaten, die das Kind noch nicht probiert hat. */
  untried: string[];
  /** Allgemeine Altersorientierung des Rezepts noch nicht erreicht. */
  tooEarly: boolean;
}

export function recipeAllergens(recipe: LibraryRecipe): Allergen[] {
  return Array.from(new Set(recipe.foods.flatMap((id) => FOOD_BY_ID[id]?.allergens ?? [])));
}

/** Rezepte für ein Kind einordnen: blockiert, schon alles probiert, oder noch Neues dabei. */
export function recipeFits(child: Child, logs: FoodLog[], opts: { category?: RecipeCategory; today?: string } = {}): RecipeFit[] {
  const tried = new Set(logs.filter((l) => l.childId === child.id).map((l) => l.foodId));
  const age = opts.today ? ageInMonths(child.birthDate, opts.today) : 99;
  return ALL_RECIPES.filter((r) => !opts.category || r.category === opts.category)
    .map((recipe) => {
      const blockedFood = recipe.foods.map((id) => FOOD_BY_ID[id]).find((f) => f && blockReason(f, child, logs) !== null);
      return {
        recipe,
        blocked: blockedFood ? `${blockedFood.name}: ${blockReason(blockedFood, child, logs)}` : null,
        untried: recipe.foods.filter((id) => !tried.has(id)),
        tooEarly: age < recipe.fromMonth,
      };
    })
    .sort((a, b) => Number(!!a.blocked) - Number(!!b.blocked) || Number(a.tooEarly) - Number(b.tooEarly) || a.untried.length - b.untried.length);
}

/**
 * Tausch-Kandidaten für eine Mahlzeit im Plan: gleiche Mahlzeit, nichts Blockiertes und
 * nur schon probierte Zutaten – so kommt durch einen Tausch nie etwas Neues dazu.
 */
export function swapCandidates(child: Child, logs: FoodLog[], slot: MealSlot, today: string): LibraryRecipe[] {
  return recipeFits(child, logs, { today })
    .filter((f) => f.recipe.slot === slot && !f.blocked && !f.tooEarly && f.untried.length === 0)
    .map((f) => f.recipe);
}

/**
 * Zutaten-Suche (lokal, regelbasiert): Rezepte nach Übereinstimmung mit den gewählten Zutaten.
 * Ausschließlich aus der geprüften Bibliothek, blockierte Rezepte erscheinen nie.
 */
export interface IngredientMatch {
  recipe: LibraryRecipe;
  have: string[];
  missing: string[];
  untried: string[];
}

export function matchByIngredients(child: Child, logs: FoodLog[], foodIds: string[], today: string): IngredientMatch[] {
  const want = new Set(foodIds);
  const basics = new Set(['rapsoel', 'olivenoel']);
  return recipeFits(child, logs, { today })
    .filter((f) => !f.blocked && !f.tooEarly)
    .map((f) => ({
      recipe: f.recipe,
      have: f.recipe.foods.filter((id) => want.has(id)),
      missing: f.recipe.foods.filter((id) => !want.has(id) && !basics.has(id)),
      untried: f.untried,
    }))
    .filter((m) => m.have.length > 0)
    .sort((a, b) => b.have.length - a.have.length || a.missing.length - b.missing.length || a.untried.length - b.untried.length);
}
