/**
 * Tagesablauf im ersten Jahr: Milch und Brei zusammen, damit Eltern jeden Tag den ganzen Tag sehen.
 *
 * Grundlage (Gesund ins Leben, Verbraucherzentrale „Ernährungsfahrplan 1. Lebensjahr“):
 * – Weiter nach Bedarf stillen bzw. Säuglingsmilch „analog zu den Stillmahlzeiten“.
 * – Der Mittagsbrei ersetzt nach und nach die Milchmahlzeit mittags, später der Abendbrei die am Abend,
 *   etwa einen Monat danach der Nachmittagsbrei die am Nachmittag.
 * – Morgens (und nachts) bleibt es im ersten Jahr bei Milch; ab etwa 10 Monaten kann das Familienfrühstück beginnen.
 * Reine Orientierung: keine Mengen für Milch (Stillen nach Bedarf, Fläschchen laut Packung), keine Bewertung.
 */
import { ageInMonths } from './dates';
import { FAMILY_BREAKFAST_FROM_MONTHS } from './morning';
import type { Child, MealSlot, PlannedMeal } from './types';
import { t, tr } from '@/i18n';

export type RhythmKind = 'milch' | 'brei' | 'fruehstueck';

export interface RhythmEntry {
  id: 'morgen' | MealSlot | 'nacht';
  /** Uhrzeit (HH:MM) oder null bei „nach dem Aufwachen“ / „nachts“. */
  time: string | null;
  when: string;
  kind: RhythmKind;
  title: string;
  detail: string;
  /** Bei Brei: die geplante Mahlzeit (zum Öffnen und Abhaken). */
  meal?: PlannedMeal;
}

const ORDER: MealSlot[] = ['mittag', 'nachmittag', 'abend'];
const WHEN: Record<MealSlot, string> = tr({ mittag: 'Mittags', nachmittag: 'Nachmittags', abend: 'Abends' });

export function milkLabel(child: Child): string {
  return child.milk === 'stillen' ? t('Stillen') : child.milk === 'flasche' ? t('Fläschchen') : t('Stillen oder Fläschchen');
}

export function milkDetail(child: Child): string {
  if (child.milk === 'stillen') return t('Nach Bedarf');
  if (child.milk === 'flasche') return t('Menge laut Packung, nach Bedarf');
  return t('Stillen nach Bedarf, Fläschchen laut Packung');
}

/**
 * Den Tag als Abfolge: morgens Milch, dann mittags, nachmittags und abends Brei oder Milch –
 * je nachdem, welche Breie schon im Plan sind –, nachts Milch nach Bedarf.
 */
export function dayRhythm(child: Child, meals: PlannedMeal[], mealTimes: Record<MealSlot, string>, today: string, water: boolean): RhythmEntry[] {
  const milk = milkLabel(child);
  const detail = milkDetail(child);
  const months = ageInMonths(child.birthDate, today);
  const entries: RhythmEntry[] = [];

  entries.push(
    months >= FAMILY_BREAKFAST_FROM_MONTHS
      ? { id: 'morgen', time: null, when: t('Morgens'), kind: 'fruehstueck', title: t('{0} oder erstes Familienfrühstück', { 0: milk }), detail: t('Zum Beispiel Brot mit Butter oder Haferflocken mit Milch – ohne Eile.') }
      : { id: 'morgen', time: null, when: t('Morgens & vormittags'), kind: 'milch', title: milk, detail },
  );

  for (const slot of ORDER) {
    const meal = meals.find((m) => m.slot === slot);
    const when = WHEN[slot];
    if (meal) {
      entries.push({ id: slot, time: mealTimes[slot], when, kind: 'brei', title: meal.title, detail: water ? t('Dazu Wasser aus dem Becher') : t('Danach nach Bedarf {0}', { 0: milk }), meal });
    } else {
      entries.push({ id: slot, time: mealTimes[slot], when, kind: 'milch', title: milk, detail: t('Hier kommt später ein Brei dazu') });
    }
  }

  if (months < 12) entries.push({ id: 'nacht', time: null, when: t('Nachts'), kind: 'milch', title: milk, detail: t('Nach Bedarf') });
  return entries;
}

/** Welcher Eintrag gerade „dran“ ist – nach Uhrzeit. Ein Eintrag gilt ab etwa 30 Minuten vor seiner Zeit. */
export function currentRhythmId(entries: RhythmEntry[], nowHm: string): RhythmEntry['id'] {
  const timed = entries.filter((e) => e.time);
  let id: RhythmEntry['id'] = 'morgen';
  for (const e of timed) if (nowHm >= shift(e.time!, -30)) id = e.id;
  const last = timed[timed.length - 1];
  if (last && entries.some((e) => e.id === 'nacht') && nowHm >= shift(last.time!, 180)) return 'nacht';
  return id;
}

function shift(hm: string, minutes: number): string {
  const [h, m] = hm.split(':').map(Number);
  const total = Math.max(0, Math.min(23 * 60 + 59, h * 60 + m + minutes));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
