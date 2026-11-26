/**
 * Vorkoch-Sonntag: mehrere einfrierbare Rezepte in einem geführten Ablauf.
 * Reihenfolge: alles vorbereiten → kochen → schnell abkühlen, portionieren, beschriften, einfrieren.
 * Hygiene nach BfR (schnell abkühlen, erst abgekühlt einfrieren, beschriften) und den Gefrier-Hinweisen der Rezepte
 * (Öl erst nach dem Auftauen zugeben).
 */
import type { BabyRecipe } from '@/data/babyRecipes';
import { t } from '@/i18n';

export interface PrepStep {
  phase: 'vorbereiten' | 'kochen' | 'abschluss';
  recipeId?: string;
  recipeName?: string;
  text: string;
  /** Erkannte Zeitangabe im Schritt (Minuten) – für den Timer. */
  minutes?: number;
}

const OIL = /(raps|oliven|lein)?öl\s+(unterrühren|zugeben|dazugeben|unterheben)|öl\s+dazu/i;

export function stepMinutes(text: string): number | undefined {
  const m = text.match(/(\d{1,3})\s*(?:[–-]\s*\d{1,3}\s*)?(?:Minuten|Min\.)/i);
  return m ? Number(m[1]) : undefined;
}

export function prepSession(recipes: BabyRecipe[]): PrepStep[] {
  const steps: PrepStep[] = [];
  for (const r of recipes) {
    const first = r.steps[0];
    if (first) steps.push({ phase: 'vorbereiten', recipeId: r.id, recipeName: r.name, text: first, minutes: stepMinutes(first) });
  }
  for (const r of recipes) {
    for (const s of r.steps.slice(1)) {
      // Öl erst nach dem Auftauen – beim Vorkochen also weglassen
      const text = OIL.test(s) ? t('Öl jetzt noch nicht zugeben – erst nach dem Auftauen, direkt vor dem Füttern.') : s;
      steps.push({ phase: 'kochen', recipeId: r.id, recipeName: r.name, text, minutes: OIL.test(s) ? undefined : stepMinutes(s) });
    }
  }
  steps.push(
    { phase: 'abschluss', text: t('Alles möglichst schnell abkühlen lassen, zum Beispiel im kalten Wasserbad – erst abgekühlt einfrieren.') },
    { phase: 'abschluss', text: t('In kleine Portionen füllen (Eiswürfelform oder Gläschen) und mit Inhalt und Datum beschriften.') },
    { phase: 'abschluss', text: t('Bei −18 °C einfrieren. Zum Füttern im Kühlschrank oder Wasserbad auftauen, gut durcherhitzen, nicht wieder einfrieren.') },
  );
  return steps;
}

/** Rezepte, die zum Plan der nächsten Tage passen, zuerst (meiste Überschneidung mit geplanten Lebensmitteln). */
export function rankForPlan(recipes: BabyRecipe[], plannedFoods: Set<string>): BabyRecipe[] {
  const score = (r: BabyRecipe) => r.foods.filter((f) => plannedFoods.has(f)).length / Math.max(1, r.foods.length);
  return [...recipes].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name, 'de'));
}
