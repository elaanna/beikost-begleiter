import { ALLERGEN_GUIDES, type AllergenGuide } from '@/data/allergens';
import { FOOD_BY_ID } from '@/data/foods';
import { addDays } from './dates';
import { buildSchedule, effectiveStartDate } from './planner';
import type { Child, FoodLog } from './types';
import { t } from '@/i18n';

export type AllergenState = 'eingefuehrt' | 'reaktion' | 'geplant' | 'ausgeschlossen' | 'abklaeren';

export interface AllergenStatus {
  guide: AllergenGuide;
  state: AllergenState;
  label: string;
  /** Datum der geplanten Einführung (ISO), falls geplant. */
  plannedDate?: string;
  /** Bereits probierte Lebensmittel mit diesem Allergen. */
  triedFoods: string[];
  /** Zuletzt gegeben (ISO), falls eingeführt. */
  lastDate?: string;
}

export function allergenStatuses(child: Child, logs: FoodLog[]): AllergenStatus[] {
  const own = logs.filter((l) => l.childId === child.id);
  const schedule = buildSchedule(child, logs, 400);
  const start = effectiveStartDate(child);

  return ALLERGEN_GUIDES.map((guide) => {
    const withAllergen = (id: string) => FOOD_BY_ID[id]?.allergens.includes(guide.id);
    const reacted = own.some((l) => withAllergen(l.foodId) && l.reaction !== 'keine');
    const triedFoods = Array.from(new Set(own.filter((l) => withAllergen(l.foodId) && l.reaction === 'keine').map((l) => l.foodId)));

    if (child.exclusions.includes(guide.id)) {
      return { guide, state: 'ausgeschlossen', label: t('Ärztlich bekannte Allergie'), triedFoods };
    }
    if (reacted) return { guide, state: 'reaktion', label: t('Reaktion notiert – mit Kinderarztpraxis besprechen'), triedFoods };
    if (triedFoods.length) {
      const lastDate = own.filter((l) => withAllergen(l.foodId)).map((l) => l.date).sort().pop();
      return { guide, state: 'eingefuehrt', label: t('Schon angeboten'), triedFoods, lastDate };
    }
    if (guide.id === 'erdnuss' && child.atopicDermatitis && !child.peanutCleared) {
      return { guide, state: 'abklaeren', label: t('Vorher ärztlich abklären (Neurodermitis)'), triedFoods };
    }
    const intro = schedule.introductions.find((x) => withAllergen(x.food.id));
    const plannedDate = intro ? addDays(start, intro.fromDay) : undefined;
    return { guide, state: 'geplant', label: plannedDate ? t('Im Plan') : t('Noch nicht im Plan'), plannedDate, triedFoods };
  });
}
