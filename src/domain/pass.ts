/** Probier-Pass: Meilensteine aus den bereits probierten Lebensmitteln. */
import { FOODS } from '@/data/foods';
import type { FoodLog } from './types';
import { t } from '@/i18n';

export interface Milestone {
  id: string;
  emoji: string;
  title: string;
  reached: boolean;
  progress: string;
}

const ALLERGEN_GROUPS = ['ei', 'milch', 'erdnuss', 'baumnuss', 'fisch', 'gluten', 'soja', 'sesam'] as const;

export function milestones(logs: FoodLog[], childId: string): Milestone[] {
  const tried = new Set(logs.filter((l) => l.childId === childId).map((l) => l.foodId));
  const triedFoods = FOODS.filter((f) => tried.has(f.id));
  const n = triedFoods.length;
  const allergensDone = ALLERGEN_GROUPS.filter((a) => triedFoods.some((f) => f.allergens.includes(a))).length;
  const veg = triedFoods.filter((f) => f.category === 'gemuese').length;
  const fruit = triedFoods.filter((f) => f.category === 'obst').length;
  const iron = triedFoods.filter((f) => f.ironRich).length;
  const step = (id: string, emoji: string, title: string, value: number, goal: number): Milestone => ({
    id, emoji, title, reached: value >= goal, progress: `${Math.min(value, goal)}/${goal}`,
  });
  return [
    step('erster', '🥄', t('Erster Löffel'), n, 1),
    step('zehn', '🌱', t('10 Lebensmittel'), n, 10),
    step('gemuese', '🥦', t('10 Gemüsesorten'), veg, 10),
    step('obst', '🍓', t('10 Obstsorten'), fruit, 10),
    step('eisen', '💪', t('5 eisenreiche Lebensmittel'), iron, 5),
    step('allergene', '🛡️', t('Alle 8 Allergen-Gruppen'), allergensDone, ALLERGEN_GROUPS.length),
    step('fuenfzig', '⭐', t('50 Lebensmittel'), n, 50),
    step('hundert', '🏆', t('Alle 100'), n, FOODS.length),
  ];
}
