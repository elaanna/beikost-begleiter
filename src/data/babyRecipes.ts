/**
 * Beikost-Rezepte nach den Grundrezepten des Netzwerks Gesund ins Leben
 * (veröffentlicht u. a. von BZgA/kindergesundheit-info.de und KKH).
 * Eigene Formulierungen. Vor dem Launch fachlich prüfen lassen (Konzept, Kap. 9).
 * Mengen sind Zubereitungsmengen, keine Verzehrvorgabe: Das Kind bestimmt, wie viel es isst.
 */
import type { MealSlot } from '@/domain/types';

export type RecipeCategory =
  | 'gemuesebrei' | 'gemuese_kartoffel' | 'gemuese_fleisch' | 'vegetarisch'
  | 'milch_getreide' | 'getreide_obst' | 'fingerfood' | 'fruehstueck' | 'familie' | 'kleinkind';

export const CATEGORY_INFO: Record<RecipeCategory, { label: string; emoji: string }> = {
  gemuesebrei: { label: 'Gemüsebrei', emoji: '🥕' },
  gemuese_kartoffel: { label: 'Gemüse-Kartoffel-Brei', emoji: '🥔' },
  gemuese_fleisch: { label: 'Gemüse-Fleisch-Brei', emoji: '🍗' },
  vegetarisch: { label: 'Vegetarischer Brei', emoji: '🌾' },
  milch_getreide: { label: 'Milch-Getreide-Brei', emoji: '🥛' },
  getreide_obst: { label: 'Getreide-Obst-Brei', emoji: '🍐' },
  fingerfood: { label: 'Fingerfood & BLW', emoji: '✋' },
  fruehstueck: { label: 'Frühstück & Snacks', emoji: '🥣' },
  familie: { label: 'Familienessen', emoji: '🍽️' },
  kleinkind: { label: 'Kleinkind ab 1 Jahr', emoji: '🧒' },
};

export interface Storage {
  fridge: string;
  /** null = nicht zum Einfrieren geeignet */
  freeze: string | null;
  thaw?: string;
}

export interface BabyRecipe {
  id: string;
  name: string;
  emoji: string;
  category: RecipeCategory;
  /** Mahlzeit im Breiplan, für die das Rezept als Tausch passt. */
  slot?: MealSlot;
  minutes: number;
  /** Allgemeine Orientierung ab Lebensmonat (keine individuelle Empfehlung). */
  fromMonth: number;
  consistency: string;
  foods: string[];
  ingredients: string[];
  steps: string[];
  storage: Storage;
  safety?: string;
  /** Nur Familienessen: was für das Baby anders gemacht wird. */
  baby?: string;
}

const FREEZE_BREI: Storage = {
  fridge: 'Abgedeckt im Kühlschrank bis zum nächsten Tag.',
  freeze: 'Direkt nach dem Pürieren abkühlen lassen und portionsweise einfrieren; bei −18 °C bis zu 2 Monate.',
  thaw: 'Über Nacht im Kühlschrank oder direkt im Wasserbad auftauen, gut durcherhitzen. Öl erst nach dem Auftauen zugeben. Nicht wieder einfrieren.',
};
const FRESH_ONLY: Storage = {
  fridge: 'Am besten frisch zubereiten. Reste nicht aufheben.',
  freeze: null,
};

export const BABY_RECIPES: BabyRecipe[] = [
  {
    id: 'pastinakenbrei', name: 'Erster Pastinakenbrei', emoji: '🥕', category: 'gemuesebrei', slot: 'mittag',
    minutes: 20, fromMonth: 5, consistency: 'Ganz fein püriert, glatt',
    foods: ['pastinake', 'rapsoel'],
    ingredients: ['100 g Pastinake', '1 EL Rapsöl', 'etwas Wasser'],
    steps: ['Pastinake schälen, würfeln und in wenig Wasser weich dämpfen.', 'Mit etwas Kochwasser sehr fein pürieren.', 'Rapsöl unterrühren.'],
    storage: FREEZE_BREI,
  },
  {
    id: 'kuerbis-kartoffel', name: 'Kürbis-Kartoffel-Brei', emoji: '🎃', category: 'gemuese_kartoffel', slot: 'mittag',
    minutes: 25, fromMonth: 5, consistency: 'Fein püriert',
    foods: ['kuerbis', 'kartoffel', 'rapsoel'],
    ingredients: ['100 g Hokkaido-Kürbis', '50 g Kartoffel', '1,5 EL Obstsaft oder Obstpüree', '1 EL Rapsöl'],
    steps: ['Kürbis und Kartoffel würfeln, zusammen weich dämpfen.', 'Mit Saft und etwas Kochwasser pürieren.', 'Rapsöl unterrühren.'],
    storage: FREEZE_BREI,
  },
  {
    id: 'karotte-kartoffel-rind', name: 'Karotte-Kartoffel-Rind', emoji: '🥩', category: 'gemuese_fleisch', slot: 'mittag',
    minutes: 30, fromMonth: 6, consistency: 'Fein püriert, später gröber',
    foods: ['karotte', 'kartoffel', 'rind', 'rapsoel'],
    ingredients: ['100 g Karotten', '50 g Kartoffel', '30 g mageres Rindfleisch', '1,5 EL Obstsaft', '1 EL Rapsöl'],
    steps: ['Fleisch klein schneiden und in wenig Wasser ca. 10 Minuten garen.', 'Karotten und Kartoffel dazugeben, alles weich garen.', 'Mit Saft fein pürieren, Rapsöl unterrühren.'],
    storage: { ...FREEZE_BREI, freeze: 'Am besten Fleischpüree getrennt in kleinen Portionen einfrieren; bei −18 °C bis zu 2 Monate.' },
    safety: 'Fleisch immer vollständig durchgaren.',
  },
  {
    id: 'zucchini-huhn', name: 'Zucchini-Kartoffel-Hähnchen', emoji: '🍗', category: 'gemuese_fleisch', slot: 'mittag',
    minutes: 30, fromMonth: 6, consistency: 'Fein püriert, später gröber',
    foods: ['zucchini', 'kartoffel', 'huhn', 'rapsoel'],
    ingredients: ['100 g Zucchini', '50 g Kartoffel', '30 g Hähnchen (Keule)', '1,5 EL Obstsaft', '1 EL Rapsöl'],
    steps: ['Hähnchen würfeln und durchgaren.', 'Zucchini und Kartoffel weich dämpfen.', 'Alles mit Saft pürieren, Rapsöl unterrühren.'],
    storage: FREEZE_BREI,
    safety: 'Geflügel vollständig durchgaren.',
  },
  {
    id: 'brokkoli-lachs', name: 'Brokkoli-Kartoffel-Lachs', emoji: '🐟', category: 'gemuese_fleisch', slot: 'mittag',
    minutes: 25, fromMonth: 6, consistency: 'Fein püriert',
    foods: ['brokkoli', 'kartoffel', 'lachs', 'rapsoel'],
    ingredients: ['100 g Brokkoli', '50 g Kartoffel', '30 g Lachs (grätenfrei)', '1 EL Rapsöl'],
    steps: ['Kartoffel weich kochen, Brokkoli und Lachs die letzten 8 Minuten mitdämpfen.', 'Lachs auf Gräten prüfen.', 'Alles pürieren, Rapsöl unterrühren.'],
    storage: FREEZE_BREI,
    safety: 'Fisch vollständig garen und sorgfältig auf Gräten prüfen.',
  },
  {
    id: 'suesskartoffel-hafer', name: 'Süßkartoffel-Hafer-Brei (vegetarisch)', emoji: '🍠', category: 'vegetarisch', slot: 'mittag',
    minutes: 25, fromMonth: 6, consistency: 'Fein püriert',
    foods: ['suesskartoffel', 'kartoffel', 'hafer', 'orange', 'rapsoel'],
    ingredients: ['100 g Süßkartoffel', '50 g Kartoffel', '10 g zarte Haferflocken', '3,5 EL Orangensaft', '1 EL Rapsöl'],
    steps: ['Süßkartoffel und Kartoffel weich dämpfen.', 'Haferflocken in 2–3 EL heißem Wasser quellen lassen.', 'Alles mit dem Saft pürieren, Rapsöl unterrühren.'],
    storage: FREEZE_BREI,
  },
  {
    id: 'kuerbis-hirse', name: 'Kürbis-Hirse-Brei (vegetarisch)', emoji: '🌾', category: 'vegetarisch', slot: 'mittag',
    minutes: 25, fromMonth: 6, consistency: 'Fein püriert',
    foods: ['kuerbis', 'kartoffel', 'hirse', 'apfel', 'rapsoel'],
    ingredients: ['100 g Kürbis', '50 g Kartoffel', '10 g Hirseflocken', '3,5 EL Vitamin-C-reicher Apfelsaft', '1 EL Rapsöl'],
    steps: ['Kürbis und Kartoffel weich dämpfen.', 'Hirseflocken einrühren und kurz quellen lassen.', 'Mit Saft pürieren, Rapsöl unterrühren.'],
    storage: FREEZE_BREI,
  },
  {
    id: 'milch-hafer-apfel', name: 'Milch-Hafer-Brei mit Apfel', emoji: '🥛', category: 'milch_getreide', slot: 'abend',
    minutes: 10, fromMonth: 6, consistency: 'Glatt, cremig',
    foods: ['vollmilch', 'hafer', 'apfel'],
    ingredients: ['200 ml Vollmilch (3,5 %)', '20 g zarte Haferflocken', '2 EL Apfelpüree'],
    steps: ['Milch erhitzen, Haferflocken einrühren.', 'Unter Rühren aufkochen und kurz quellen lassen.', 'Apfelpüree unterrühren, abkühlen lassen.'],
    storage: FRESH_ONLY,
    safety: 'Nur pasteurisierte oder H-Milch verwenden, keine Rohmilch. Milchbrei frisch zubereiten.',
  },
  {
    id: 'milch-griess-birne', name: 'Grießbrei mit Birne', emoji: '🍐', category: 'milch_getreide', slot: 'abend',
    minutes: 10, fromMonth: 6, consistency: 'Glatt, cremig',
    foods: ['vollmilch', 'dinkel', 'birne'],
    ingredients: ['200 ml Vollmilch (3,5 %)', '20 g Vollkorngrieß', '2 EL Birnenpüree'],
    steps: ['Milch erhitzen, Grieß einrieseln lassen.', 'Unter Rühren 2–3 Minuten quellen lassen.', 'Birnenpüree unterrühren.'],
    storage: FRESH_ONLY,
    safety: 'Nur pasteurisierte oder H-Milch verwenden.',
  },
  {
    id: 'apfel-hafer', name: 'Apfel-Hafer-Brei', emoji: '🍎', category: 'getreide_obst', slot: 'nachmittag',
    minutes: 10, fromMonth: 7, consistency: 'Fein bis leicht stückig',
    foods: ['hafer', 'apfel', 'rapsoel'],
    ingredients: ['20 g zarte Haferflocken', '90 ml Wasser', '100 g Apfel', '1 TL Rapsöl'],
    steps: ['Haferflocken in Wasser aufkochen und quellen lassen.', 'Apfel fein reiben oder dünsten und pürieren.', 'Alles mischen, Rapsöl unterrühren.'],
    storage: FREEZE_BREI,
  },
  {
    id: 'birne-hirse', name: 'Birne-Hirse-Brei', emoji: '🍐', category: 'getreide_obst', slot: 'nachmittag',
    minutes: 10, fromMonth: 7, consistency: 'Fein bis leicht stückig',
    foods: ['hirse', 'birne', 'rapsoel'],
    ingredients: ['20 g Hirseflocken', '90 ml Wasser', '100 g reife Birne', '1 TL Rapsöl'],
    steps: ['Hirseflocken in heißes Wasser rühren und quellen lassen.', 'Birne schälen und zerdrücken.', 'Mischen, Rapsöl unterrühren.'],
    storage: FREEZE_BREI,
  },
  {
    id: 'banane-dinkel', name: 'Bananen-Dinkel-Brei', emoji: '🍌', category: 'getreide_obst', slot: 'nachmittag',
    minutes: 5, fromMonth: 7, consistency: 'Zerdrückt',
    foods: ['dinkel', 'banane', 'rapsoel'],
    ingredients: ['20 g Dinkelflocken', '90 ml Wasser', '100 g Banane', '1 TL Rapsöl'],
    steps: ['Flocken in heißem Wasser quellen lassen.', 'Banane mit der Gabel zerdrücken und unterrühren.', 'Rapsöl dazugeben.'],
    storage: { fridge: 'Frisch essen – Banane wird schnell braun.', freeze: 'Getreideanteil einfrieren und Banane erst nach dem Auftauen frisch dazugeben.' },
  },
  {
    id: 'ofen-suesskartoffel', name: 'Weiche Süßkartoffel-Sticks', emoji: '🍠', category: 'fingerfood', slot: 'mittag',
    minutes: 30, fromMonth: 6, consistency: 'Fingerdicke Stifte, mit Zunge am Gaumen zerdrückbar',
    foods: ['suesskartoffel', 'rapsoel'],
    ingredients: ['1 Süßkartoffel', '1 TL Rapsöl'],
    steps: ['Süßkartoffel in fingerdicke Stifte schneiden.', 'Mit Öl mischen und bei 200 °C ca. 25 Minuten backen, bis sie ganz weich sind.', 'Abkühlen lassen und Weichheit zwischen zwei Fingern prüfen.'],
    storage: { fridge: 'Im Kühlschrank 1 Tag, vor dem Essen kurz erwärmen.', freeze: 'Gebacken einfrieren; bei −18 °C bis zu 2 Monate.', thaw: 'Im Ofen aufbacken, bis sie durch und weich sind.' },
    safety: 'Nur im Sitzen und unter Aufsicht essen lassen.',
  },
  {
    id: 'brokkoli-baeumchen', name: 'Brokkoli-Bäumchen', emoji: '🥦', category: 'fingerfood', slot: 'mittag',
    minutes: 10, fromMonth: 6, consistency: 'Große Röschen mit Stiel als Griff, sehr weich',
    foods: ['brokkoli'],
    ingredients: ['einige große Brokkoliröschen'],
    steps: ['Röschen mit langem Stiel abschneiden.', 'Ca. 8 Minuten dämpfen, bis sie sehr weich sind.', 'Abkühlen lassen.'],
    storage: { fridge: 'Im Kühlschrank 1 Tag.', freeze: null },
    safety: 'Nur im Sitzen und unter Aufsicht essen lassen.',
  },
  {
    id: 'bananen-pancakes', name: 'Bananen-Hafer-Pancakes', emoji: '🥞', category: 'fruehstueck', slot: 'nachmittag',
    minutes: 15, fromMonth: 7, consistency: 'Weiche Streifen zum Selberessen',
    foods: ['banane', 'hafer', 'ei', 'rapsoel'],
    ingredients: ['1 reife Banane', '1 Ei', '30 g zarte Haferflocken', 'etwas Rapsöl'],
    steps: ['Banane zerdrücken, mit Ei und Haferflocken verrühren.', 'Kleine Pancakes bei mittlerer Hitze von beiden Seiten durchbacken.', 'In Streifen schneiden.'],
    storage: { fridge: 'Im Kühlschrank 1 Tag.', freeze: 'Einzeln einfrieren; bei −18 °C bis zu 2 Monate.', thaw: 'Im Toaster oder in der Pfanne durcherhitzen.' },
    safety: 'Ei vollständig durchbacken – innen nicht mehr flüssig.',
  },
];

export const STORAGE_SOURCES = [
  { label: 'BZgA / kindergesundheit-info.de: Rezepte für Säuglingsbreie', url: 'https://www.kindergesundheit-info.de/fileadmin/user_upload/kindergesundheit-info.de/Download/ernaehrung/Rezepte-Saeuglingsbreie_BZgA_kindergesundheit-info.pdf' },
  { label: 'ÖKO-TEST: Babybrei einfrieren – Tipps', url: 'https://www.oekotest.de/kinder-familie/Babybrei-einfrieren-10-Tipps-zum-Lagern-Auftauen-und-Erwaermen_12179_1.html' },
];

/** Allgemeine Regeln fürs Vorkochen – ohne Garantie für Haltbarkeit (Konzept F08). */
export const MEAL_PREP_RULES = [
  'Brei direkt nach dem Pürieren abkühlen lassen und portionsweise einfrieren (z. B. Eiswürfelform).',
  'Bei −18 °C bis zu etwa 2 Monate aufbewahren; Datum notieren.',
  'Öl, Banane und Avocado erst nach dem Auftauen zugeben.',
  'Fleisch- oder Fischpüree am besten getrennt in kleinen Portionen einfrieren.',
  'Milchbrei frisch zubereiten statt einfrieren.',
  'Aufgetauten Brei nicht wieder einfrieren und Reste vom Teller nicht aufheben.',
  'Spinat, Mangold und Rote Bete nicht für Brei zum Aufbewahren nutzen (Nitrat).',
];
