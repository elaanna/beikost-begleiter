// Zentrale Typen der App. Alles hier ist plattformunabhängig und testbar.

export type FeedingApproach = 'brei' | 'blw' | 'gemischt';
export type MilkFeeding = 'stillen' | 'flasche' | 'beides';

/** Die 14 EU-Hauptallergene, soweit sie in der Beikost eine Rolle spielen. */
export type Allergen =
  | 'ei'
  | 'milch'
  | 'erdnuss'
  | 'baumnuss'
  | 'fisch'
  | 'gluten'
  | 'soja'
  | 'sesam'
  | 'sellerie'
  | 'senf';

export type FoodCategory =
  | 'gemuese'
  | 'obst'
  | 'getreide'
  | 'fleisch'
  | 'fisch'
  | 'milch'
  | 'ei'
  | 'huelsenfruechte'
  | 'nuesse_samen'
  | 'fett';

export type ChokingRisk = 'niedrig' | 'mittel' | 'hoch';

export interface Food {
  id: string;
  name: string;
  /** Symbol für die Darstellung in der App. */
  emoji: string;
  category: FoodCategory;
  /** Frühester sinnvoller Zeitpunkt relativ zum Beikoststart in Wochen (0 = ab Start). */
  fromWeek: number;
  allergens: Allergen[];
  ironRich?: boolean;
  /** Zubereitung als Brei. */
  brei: string;
  /** Zubereitung als Fingerfood (BLW). */
  finger: string;
  chokingRisk: ChokingRisk;
  /** Sicherheitshinweis, falls vorhanden. */
  hint?: string;
  /** Einkaufseinheit für die Einkaufsliste. */
  shopUnit: string;
  /** Monate mit Saison in Deutschland (1–12). Leer = ganzjährig verfügbar. */
  season?: number[];
}

export type Reaction = 'keine' | 'haut' | 'verdauung' | 'erbrechen' | 'atemwege';
export type Liking = -1 | 0 | 1;

export interface Child {
  id: string;
  familyId: string;
  name: string;
  birthDate: string; // ISO yyyy-mm-dd
  approach: FeedingApproach;
  milk: MilkFeeding;
  /** Mittelschwere bis schwere Neurodermitis (atopische Dermatitis). */
  atopicDermatitis: boolean;
  /** Erdnuss wurde ärztlich abgeklärt (relevant bei Neurodermitis). */
  peanutCleared: boolean;
  /** Tatsächlicher oder geplanter Beikoststart (ISO). */
  startDate: string | null;
  exclusions: Allergen[];
  excludedFoods: string[];
  /** Seit wann das Kind am Familientisch isst (Kleinkind-Phase „nimou table“, ISO); null/fehlt = Beikost-Phase. */
  tableSince?: string | null;
}

export interface FoodLog {
  id: string;
  childId: string;
  foodId: string;
  date: string; // ISO yyyy-mm-dd
  liking: Liking;
  reaction: Reaction;
  note: string;
}

export type MealSlot = 'mittag' | 'abend' | 'nachmittag';

export interface PlannedMeal {
  slot: MealSlot;
  title: string;
  foodIds: string[];
  /** Lebensmittel, das an diesem Tag neu eingeführt oder wiederholt wird. */
  newFoodId?: string;
  newFoodDay?: number; // 1..3
  /** Gesetzt, wenn die Mahlzeit gegen ein Rezept getauscht wurde. */
  recipeId?: string;
}

export interface PlanDay {
  date: string;
  meals: PlannedMeal[];
}
