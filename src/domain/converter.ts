import { DISH_TYPES, FIRST_STEP, INGREDIENT_RULES, STAGE_INFO, type IngredientRule, type Stage } from '@/data/familyConverter';
import { t } from '@/i18n';

export interface Conversion {
  steps: string[];
  never: IngredientRule[];
  adapt: IngredientRule[];
  notes: IngredientRule[];
}

/** Babyvariante eines Familiengerichts – rein regelbasiert, gleiche Eingabe ergibt immer dieselbe Ausgabe. */
export function convertDish(dishId: string, stage: Stage, ruleIds: string[]): Conversion | null {
  const dish = DISH_TYPES.find((d) => d.id === dishId);
  if (!dish) return null;
  const rules = INGREDIENT_RULES.filter((r) => ruleIds.includes(r.id));
  return {
    steps: [t(FIRST_STEP), ...dish.steps[stage], STAGE_INFO[stage].text, t('Lauwarm servieren und nur im Sitzen und unter Aufsicht essen lassen.')],
    never: rules.filter((r) => r.level === 'nie'),
    adapt: rules.filter((r) => r.level === 'anpassen'),
    notes: rules.filter((r) => r.level === 'hinweis'),
  };
}
