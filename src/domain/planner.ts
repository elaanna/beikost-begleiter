import { FOODS, FOOD_BY_ID } from '@/data/foods';
import { addDays, diffDays } from './dates';
import { computeStartWindow } from './startWindow';
import type { Child, Food, FoodLog, MealSlot, PlanDay, PlannedMeal } from './types';

/**
 * Wie viele Tage ein neues Lebensmittel hintereinander angeboten wird.
 * Allergene: 3 Tage, jeweils nur ein neues Allergen (ASCIA 2024; Solid Starts: Einführung nach der 3. Portion abgeschlossen).
 * Übrige Lebensmittel: 2 Tage. Eine feste 3- bis 5-Tage-Wartezeit ist wissenschaftlich nicht belegt
 * (Samady et al., JAMA Netw Open 2020) und steht nicht in den deutschen Empfehlungen; die Wiederholung
 * dient hier der Gewöhnung und Beobachtung.
 */
export const DAYS_ALLERGEN = 3;
export const DAYS_OTHER = 2;
export const introDays = (food: Food) => (food.allergens.length > 0 ? DAYS_ALLERGEN : DAYS_OTHER);

/**
 * Erhaltung nach der Einführung: Allergene regelmäßig weitergeben, etwa 2× pro Woche (ASCIA 2024).
 * Fisch 1–2× pro Woche anstelle von Fleisch (Netzwerk Gesund ins Leben 2024).
 * Wochentage relativ zum Beikoststart (0–6).
 */
export const MAINTENANCE: Record<string, { weekdays: number[]; slot: 'protein' | 'mittag' | 'snack' }> = {
  ei: { weekdays: [1, 4], slot: 'protein' },
  erdnuss: { weekdays: [0, 3], slot: 'snack' },
  sesam: { weekdays: [1, 5], slot: 'mittag' },
  mandel: { weekdays: [2, 6], slot: 'snack' },
  cashew: { weekdays: [1, 4], slot: 'snack' },
  haselnuss: { weekdays: [0, 5], slot: 'snack' },
  walnuss: { weekdays: [3, 6], slot: 'snack' },
  tofu: { weekdays: [0, 6], slot: 'mittag' },
};

/** Fischtage (1–2× pro Woche, Gesund ins Leben 2024); die Fischsorte rotiert. */
export const FISH_WEEKDAYS = [2, 5];
/** Ab diesem Tag nach Start kommt der Milch-Getreide-Brei am Abend dazu. */
export const EVENING_FROM_DAY = 30;
/** Ab diesem Tag nach Start kommt der Getreide-Obst-Brei am Nachmittag dazu. */
export const AFTERNOON_FROM_DAY = 60;

export function effectiveStartDate(child: Child): string {
  return child.startDate ?? computeStartWindow(child.birthDate, child.milk).suggested;
}

/**
 * Gründe, warum ein Lebensmittel für dieses Kind gerade nicht eingeplant wird.
 * Leeres Ergebnis = darf eingeplant werden.
 */
export function blockReason(food: Food, child: Child, logs: FoodLog[]): string | null {
  if (child.excludedFoods.includes(food.id)) return 'Von euch ausgeschlossen';
  const allergen = food.allergens.find((a) => child.exclusions.includes(a));
  if (allergen) return 'Enthält ein ausgeschlossenes Allergen';
  if (food.id === 'erdnuss' && child.atopicDermatitis && !child.peanutCleared) {
    return 'Bei Neurodermitis erst ärztlich abklären';
  }
  const reacted = logs.some((l) => l.childId === child.id && l.foodId === food.id && l.reaction !== 'keine');
  if (reacted) return 'Reaktion notiert – pausiert, bitte ärztlich abklären';
  return null;
}

/** Reihenfolge, in der neue Lebensmittel eingeführt werden. */
export function introductionSequence(child: Child, logs: FoodLog[]): Food[] {
  return FOODS.map((f, i) => ({ f, i }))
    .filter(({ f }) => blockReason(f, child, logs) === null)
    .sort((a, b) => a.f.fromWeek - b.f.fromWeek || a.i - b.i)
    .map(({ f }) => f);
}

interface Schedule {
  /** Lebensmittel, das ab fromDay für `days` Tage neu angeboten wird */
  introductions: { food: Food; fromDay: number; days: number }[];
}

/**
 * Meilensteine nach dem Breiplan-Schema: ab welchem Tag welche Lebensmittelgruppe
 * spätestens bekannt sein sollte. Woche 1 Gemüse, Woche 2 Kartoffel und Öl,
 * Woche 3–4 Fleisch, vor dem Abendbrei Getreide und Milch, vor dem Nachmittagsbrei Obst.
 */
const MILESTONES: { fromDay: number; matches: (f: Food) => boolean }[] = [
  { fromDay: 6, matches: (f) => f.id === 'kartoffel' },
  { fromDay: 9, matches: (f) => f.category === 'fett' && f.allergens.length === 0 },
  { fromDay: 12, matches: (f) => f.category === 'fleisch' },
  { fromDay: 15, matches: (f) => f.category === 'fleisch' || f.category === 'huelsenfruechte' },
  { fromDay: 21, matches: (f) => f.id === 'ei' },
  { fromDay: EVENING_FROM_DAY - 2, matches: (f) => f.category === 'getreide' && f.id !== 'reis' },
  { fromDay: EVENING_FROM_DAY + 3, matches: (f) => f.id === 'vollmilch' },
  { fromDay: 35, matches: (f) => f.category === 'fisch' },
  { fromDay: AFTERNOON_FROM_DAY - 9, matches: (f) => f.category === 'obst' },
  { fromDay: AFTERNOON_FROM_DAY - 6, matches: (f) => f.category === 'obst' },
];

/** Legt fest, an welchem Tag (relativ zum Start) welches Lebensmittel neu dazukommt. */
export function buildSchedule(child: Child, logs: FoodLog[], horizonDays: number): Schedule {
  const queue = introductionSequence(child, logs);
  const introductions: Schedule['introductions'] = [];
  const done = new Set<number>();

  let day = 0;
  while (day < horizonDays && queue.length > 0) {
    const allowed = (f: Food) => f.fromWeek * 7 <= day;

    // 1. Fälligen Meilenstein erfüllen, falls möglich
    let idx = -1;
    for (let m = 0; m < MILESTONES.length && idx === -1; m++) {
      if (done.has(m) || MILESTONES[m].fromDay > day) continue;
      const candidate = queue.findIndex((f) => MILESTONES[m].matches(f) && allowed(f));
      const stillPossible = queue.some((f) => MILESTONES[m].matches(f));
      // Erfüllt, oder gar nicht erfüllbar (z. B. Allergen ausgeschlossen) -> erledigt
      if (candidate !== -1 || !stillPossible) done.add(m);
      idx = candidate;
    }
    // 2. Sonst nächstes Lebensmittel der Grundreihenfolge
    if (idx === -1) idx = queue.findIndex(allowed);
    if (idx === -1) {
      day += 1; // noch nichts Neues erlaubt -> Bekanntes wiederholen
      continue;
    }

    const [food] = queue.splice(idx, 1);
    const days = introDays(food);
    introductions.push({ food, fromDay: day, days });
    day += days;
  }
  return { introductions };
}

function preferredSlot(food: Food, active: Set<MealSlot>): MealSlot {
  const wanted: MealSlot =
    food.category === 'getreide' && food.id !== 'reis'
      ? 'abend'
      : food.category === 'milch'
        ? 'abend'
        : food.category === 'obst' || food.category === 'nuesse_samen'
          ? 'nachmittag'
          : 'mittag';
  if (active.has(wanted)) return wanted;
  if (wanted === 'nachmittag' && active.has('abend')) return 'abend';
  return 'mittag';
}

function pick<T>(items: T[], seed: number): T | undefined {
  if (items.length === 0) return undefined;
  return items[((seed % items.length) + items.length) % items.length];
}

const SLOT_ORDER: MealSlot[] = ['mittag', 'nachmittag', 'abend'];

/** Erstellt den Plan für einen Zeitraum ab `fromDate` über `days` Tage. */
export function planDays(child: Child, logs: FoodLog[], fromDate: string, days: number): PlanDay[] {
  const start = effectiveStartDate(child);
  const lastIndex = diffDays(start, addDays(fromDate, days - 1));
  const schedule = buildSchedule(child, logs, Math.max(0, lastIndex + 1));
  const blocked = (id: string) => {
    const f = FOOD_BY_ID[id];
    return !f || blockReason(f, child, logs) !== null;
  };
  const isBlw = child.approach === 'blw';
  const PROTEIN: Food['category'][] = ['fleisch', 'fisch', 'ei', 'huelsenfruechte'];
  const isProteinIntroAt = (d: number) =>
    schedule.introductions.some((x) => d >= x.fromDay && d - x.fromDay < x.days && PROTEIN.includes(x.food.category));

  const result: PlanDay[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(fromDate, i);
    const dayIndex = diffDays(start, date);
    if (dayIndex < 0) {
      result.push({ date, meals: [] });
      continue;
    }

    const active = new Set<MealSlot>(['mittag']);
    if (dayIndex >= EVENING_FROM_DAY) active.add('abend');
    if (dayIndex >= AFTERNOON_FROM_DAY) active.add('nachmittag');

    const introduced = schedule.introductions.filter((x) => x.fromDay <= dayIndex);
    const current = introduced.find((x) => dayIndex - x.fromDay < x.days);
    const known = introduced
      .filter((x) => x !== current)
      .map((x) => x.food)
      .filter((f) => !blocked(f.id));
    const knownOf = (cats: Food['category'][]) => known.filter((f) => cats.includes(f.category));

    const meals: PlannedMeal[] = [];
    const newSlot = current ? preferredSlot(current.food, active) : undefined;

    for (const slot of SLOT_ORDER) {
      if (!active.has(slot)) continue;
      const foods: string[] = [];

      if (slot === 'mittag') {
        const veg = pick(knownOf(['gemuese']).filter((f) => f.id !== 'kartoffel'), dayIndex);
        if (veg) foods.push(veg.id);
        if (known.some((f) => f.id === 'kartoffel')) foods.push('kartoffel');
        else if (known.some((f) => f.id === 'reis') && dayIndex % 4 === 0) foods.push('reis');
        // Eiweiß: Erhaltungs-Allergene (Ei, Fisch) an festen Wochentagen, sonst Fleisch oder Linsen
        const weekday = dayIndex % 7;
        const due = known.filter((f) => MAINTENANCE[f.id]?.weekdays.includes(weekday));
        const dueProtein = due.filter((f) => MAINTENANCE[f.id].slot === 'protein');
        const fishKnown = knownOf(['fisch']);
        if (fishKnown.length && FISH_WEEKDAYS.includes(weekday)) {
          const fish = pick(fishKnown, Math.floor(dayIndex / 7) * FISH_WEEKDAYS.length + FISH_WEEKDAYS.indexOf(weekday));
          if (fish) dueProtein.push(fish);
        }
        const newIsProtein = isProteinIntroAt(dayIndex);
        for (const f of dueProtein) foods.push(f.id); // Allergen-Erhaltung hat Vorrang
        for (const f of due.filter((x) => MAINTENANCE[x.id].slot === 'mittag')) foods.push(f.id);
        if (!newIsProtein && dueProtein.length === 0) {
          const other = knownOf(['fleisch', 'huelsenfruechte']);
          const protein = pick(other, dayIndex);
          if (protein) foods.push(protein.id);
        }
        // Snack-Allergene (Nussmus) wandern in den Mittag, solange es noch keinen Abend-/Nachmittagsbrei gibt
        if (!active.has('abend')) {
          for (const f of due.filter((x) => MAINTENANCE[x.id].slot === 'snack')) foods.push(f.id);
        }
        if (known.some((f) => f.id === 'rapsoel')) foods.push('rapsoel');
      }

      if (slot === 'abend') {
        const grain = pick(knownOf(['getreide']).filter((f) => f.id !== 'reis'), dayIndex);
        if (grain) foods.push(grain.id);
        if (!blocked('vollmilch') && known.some((f) => f.id === 'vollmilch')) foods.push('vollmilch');
        const fruit = pick(knownOf(['obst']), dayIndex + 1);
        if (fruit && dayIndex % 2 === 0) foods.push(fruit.id);
        if (!active.has('nachmittag')) {
          for (const f of known.filter((x) => MAINTENANCE[x.id]?.slot === 'snack' && MAINTENANCE[x.id].weekdays.includes(dayIndex % 7))) {
            foods.push(f.id);
          }
        }
      }

      if (slot === 'nachmittag') {
        const grain = pick(knownOf(['getreide']).filter((f) => f.id !== 'reis'), dayIndex + 2);
        if (grain) foods.push(grain.id);
        const fruit = pick(knownOf(['obst']), dayIndex);
        if (fruit) foods.push(fruit.id);
        // Nussmus-Allergene nach Einführung etwa 2× pro Woche weitergeben
        for (const f of known.filter((x) => MAINTENANCE[x.id]?.slot === 'snack' && MAINTENANCE[x.id].weekdays.includes(dayIndex % 7))) {
          foods.push(f.id);
        }
        if (known.some((f) => f.id === 'joghurt') && dayIndex % 3 === 0) foods.push('joghurt');
      }

      let newFoodId: string | undefined;
      let newFoodDay: number | undefined;
      if (current && newSlot === slot) {
        newFoodId = current.food.id;
        newFoodDay = dayIndex - current.fromDay + 1;
        if (!foods.includes(newFoodId)) foods.unshift(newFoodId);
      }

      if (foods.length === 0) continue;
      // Abend- und Nachmittagsbrei brauchen eine Getreidebasis (BLW: mindestens zwei Lebensmittel)
      const hasGrain = foods.some((id) => FOOD_BY_ID[id]?.category === 'getreide');
      if (slot !== 'mittag' && !hasGrain && !(isBlw && foods.length >= 2)) continue;
      meals.push({
        slot,
        title: mealTitle(slot, isBlw, foods),
        foodIds: Array.from(new Set(foods)),
        newFoodId,
        newFoodDay,
      });
    }

    result.push({ date, meals });
  }
  return result;
}

function mealTitle(slot: MealSlot, blw: boolean, foodIds: string[]): string {
  if (blw) {
    return slot === 'mittag' ? 'Mittagessen (Fingerfood)' : slot === 'abend' ? 'Abendessen (Fingerfood)' : 'Snack am Nachmittag';
  }
  if (slot === 'mittag') {
    const cats = foodIds.map((id) => FOOD_BY_ID[id]?.category);
    const carb = foodIds.includes('kartoffel') ? 'Kartoffel-' : foodIds.includes('reis') ? 'Reis-' : '';
    const protein = cats.includes('fisch') ? 'Fisch-' : cats.includes('fleisch') ? 'Fleisch-' : foodIds.includes('ei') ? 'Ei-'
      : cats.includes('huelsenfruechte') ? 'Linsen-' : '';
    return `Gemüse-${carb}${protein}Brei`;
  }
  if (slot === 'abend') return 'Milch-Getreide-Brei';
  return 'Getreide-Obst-Brei';
}

export const SLOT_LABEL: Record<MealSlot, string> = {
  mittag: 'Mittag',
  nachmittag: 'Nachmittag',
  abend: 'Abend',
};

/** Zubereitungstext passend zum Ansatz. */
export function preparationFor(food: Food, child: Child): string {
  if (child.approach === 'blw') return food.finger;
  if (child.approach === 'brei') return food.brei;
  return `Brei: ${food.brei}\nFingerfood: ${food.finger}`;
}
