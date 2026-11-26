/**
 * Richtwerte für eine Breimahlzeit nach den Rezepten des Netzwerks Gesund ins Leben
 * (wiedergegeben u. a. von KKH und Apotheken Umschau). Dein Kind bestimmt die Menge:
 * anfangs wenige Löffel, dann langsam steigern.
 */
import { FOOD_BY_ID } from '@/data/foods';
import type { MealSlot } from './types';

export interface PortionLine {
  label: string;
  amount: string;
}

export interface Portion {
  title: string;
  lines: PortionLine[];
  note: string;
}

export const PORTION_SOURCES = [
  { label: 'KKH: Beikost (nach Gesund ins Leben)', url: 'https://www.kkh.de/leistungen/familie-kind/saeuglinge/babykost/beikost' },
  { label: 'Apotheken Umschau: Babybrei-Rezepte', url: 'https://www.apotheken-umschau.de/familie/kinderernaehrung/beikost/baby-brei-selbermachen-rezepte-790023.html' },
];

/** Vollständige Rezepte (Zielmenge, wenn das Kind die ganze Mahlzeit isst). */
export const FULL_PORTIONS: Record<MealSlot, Portion> = {
  mittag: {
    title: 'Gemüse-Kartoffel-Fleisch-Brei',
    lines: [
      { label: 'Gemüse', amount: '100 g' },
      { label: 'Kartoffeln (oder Nudeln, Reis)', amount: '50 g' },
      { label: 'Mageres Fleisch oder Fisch', amount: '30 g' },
      { label: 'Rapsöl', amount: '1 EL' },
      { label: 'Obstsaft oder Obstpüree', amount: '1,5 EL' },
    ],
    note: 'Vegetarisch: statt Fleisch 10 g Haferflocken und mehr Vitamin-C-reiches Obst (ca. 3,5 EL Saft) für die Eisenaufnahme.',
  },
  abend: {
    title: 'Milch-Getreide-Brei',
    lines: [
      { label: 'Vollmilch (3,5 %) oder Säuglingsmilch', amount: '200 ml' },
      { label: 'Vollkorn-Getreideflocken', amount: '20 g' },
      { label: 'Obstpüree oder Saft', amount: '2 EL' },
    ],
    note: 'Etwa einen Monat nach dem Mittagsbrei.',
  },
  nachmittag: {
    title: 'Getreide-Obst-Brei',
    lines: [
      { label: 'Wasser', amount: '90 ml' },
      { label: 'Vollkorn-Getreideflocken', amount: '20 g' },
      { label: 'Obst, zerdrückt oder gerieben', amount: '100 g' },
      { label: 'Rapsöl', amount: '1 TL' },
    ],
    note: 'Etwa einen Monat nach dem Abendbrei. Milchfrei.',
  },
};

/** Menge für eine konkrete Mahlzeit im Plan, abhängig vom Tag seit Beikoststart. */
export function portionFor(slot: MealSlot, dayIndex: number, foodIds: string[]): Portion {
  const full = FULL_PORTIONS[slot];
  if (slot === 'mittag') {
    const cats = foodIds.map((id) => FOOD_BY_ID[id]?.category);
    const lines: PortionLine[] = [];
    const veg = dayIndex < 7 ? 'einige Löffel, langsam bis 100 g' : '100 g';
    if (cats.includes('gemuese')) lines.push({ label: 'Gemüse', amount: veg });
    if (foodIds.some((id) => ['kartoffel', 'reis', 'nudeln'].includes(id))) lines.push({ label: 'Kartoffel, Reis oder Nudeln', amount: '50 g' });
    if (cats.includes('fleisch') || cats.includes('fisch')) lines.push({ label: cats.includes('fisch') ? 'Fisch' : 'Fleisch', amount: '30 g' });
    if (foodIds.includes('ei')) lines.push({ label: 'Ei (hart gekocht)', amount: 'etwa ½ Ei' });
    if (cats.includes('huelsenfruechte')) lines.push({ label: 'Linsen oder Bohnen (gegart)', amount: 'etwa 30 g' });
    if (cats.includes('fett')) lines.push({ label: 'Rapsöl', amount: '1 EL' });
    return {
      title: 'Menge',
      lines,
      note: dayIndex < 7
        ? 'Am Anfang reichen wenige Löffel – den Rest der Mahlzeit trinkt dein Kind weiter Milch.'
        : 'Richtwerte. Dein Kind bestimmt, wie viel es isst.',
    };
  }
  return { title: 'Menge', lines: full.lines, note: 'Richtwerte. Dein Kind bestimmt, wie viel es isst.' };
}
