/**
 * Eine Rezeptbibliothek für alles: Beikost-Rezepte plus Familienessen.
 */
import { BABY_RECIPES, type BabyRecipe, type Storage } from './babyRecipes';
import { FAMILY_FROM_MONTHS, RECIPES } from './recipes';

export type { BabyRecipe as LibraryRecipe } from './babyRecipes';

const FAMILY_STORAGE: Storage = {
  fridge: 'Abgedeckt im Kühlschrank bis zum nächsten Tag, nur einmal aufwärmen.',
  freeze: 'Babyportion vor dem Würzen abnehmen und einfrieren; bei −18 °C bis zu 2 Monate.',
  thaw: 'Im Kühlschrank auftauen und gut durcherhitzen. Nicht wieder einfrieren.',
};

const FAMILY_AS_LIBRARY: BabyRecipe[] = RECIPES.map((r) => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  category: 'familie',
  slot: 'mittag',
  minutes: r.minutes,
  fromMonth: FAMILY_FROM_MONTHS,
  consistency: 'Familienkost: weich, zerdrückt oder in greifbaren Stücken',
  foods: r.foods,
  ingredients: r.ingredients,
  steps: r.steps,
  storage: FAMILY_STORAGE,
  baby: r.baby,
}));

export const ALL_RECIPES: BabyRecipe[] = [...BABY_RECIPES, ...FAMILY_AS_LIBRARY];
export const RECIPE_BY_ID: Record<string, BabyRecipe> = Object.fromEntries(ALL_RECIPES.map((r) => [r.id, r]));
