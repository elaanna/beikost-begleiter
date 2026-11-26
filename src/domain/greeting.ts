/**
 * Tägliche persönliche Begrüßung auf „Heute“: Tageszeit, Vorname (optional) und ein Satz zum Tag des Kindes.
 * Nur Organisation und Ermutigung – keine Bewertung von Gesundheit oder Entwicklung.
 */
import { addDays, diffDays } from './dates';
import { genitive } from './beikostOverview';
import { FOOD_BY_ID } from '@/data/foods';
import type { Child, FoodLog } from './types';
import { t, tr } from '@/i18n';

export function timeGreeting(hour: number): string {
  if (hour < 5) return t('Hallo');
  if (hour < 11) return t('Guten Morgen');
  if (hour < 17) return t('Hallo');
  if (hour < 22) return t('Guten Abend');
  return t('Gute Nacht');
}

export function greetingTitle(hour: number, parentName: string): string {
  const name = parentName.trim();
  return name ? `${timeGreeting(hour)}, ${name}!` : `${timeGreeting(hour)}!`;
}

export interface DailyLine {
  emoji: string;
  text: string;
}

const MILESTONE_DAYS: Record<number, string> = tr({
  7: 'Eine Woche Beikost',
  14: 'Zwei Wochen Beikost',
  30: 'Ein Monat Beikost',
  100: '100 Tage Beikost',
});
/** „Kürbis (Hokkaido)“ → „Kürbis“ – kürzer für die Begrüßung. */
const short = (name: string) => name.replace(/\s*\(.*\)\s*$/, '');

const MILESTONE_FOODS = [5, 10, 20, 30, 50, 75, 100];

/** Abwechselnde Sätze für ganz normale Tage (wechseln täglich, nicht bei jedem Öffnen). */
const EVERYDAY: ((name: string, n: number) => string)[] = [
  (name, n) => t('Tag {0} der Beikost mit {1}.', { 0: n, 1: name }),
  (name) => t('Schön, dass du da bist. Hier ist, was heute für {0} ansteht.', { 0: name }),
  (name) => t('Kleine Löffel, große Entdeckungen – ein neuer Tag mit {0}.', { 0: name }),
  (name) => t('Wenn heute weniger gegessen wird, ist das völlig normal. Einfach dranbleiben mit {0}.', { 0: name }),
  (name) => t('{0} lernt mit jedem Löffel dazu. Du machst das gut.', { 0: name }),
  (name) => t('Gemeinsam am Tisch zählt mehr als die Menge – viel Freude mit {0}.', { 0: name }),
  (name) => t('Ein neuer Tag, ein neuer Geschmack? Mal sehen, was {0} heute sagt.', { 0: name }),
];

export interface DailyInput {
  child: Child;
  logs: FoodLog[];
  today: string;
  startDate: string;
  /** Neues Lebensmittel, das heute laut Plan dran ist. */
  newFoodId?: string;
  newFoodDay?: number;
  newFoodTotal?: number;
}

export function dailyLine({ child, logs, today, startDate, newFoodId, newFoodDay, newFoodTotal }: DailyInput): DailyLine {
  const name = child.name;
  const toStart = diffDays(today, startDate);
  if (toStart > 1) return { emoji: '🗓️', text: t('Noch {0} Tage bis zum Beikost-Start von {1}. Zeit, in Ruhe vorzubereiten.', { 0: toStart, 1: name }) };
  if (toStart === 1) return { emoji: '🥄', text: t('Morgen geht\'s los: {0} erster Löffel!', { 0: genitive(name) }) };
  if (toStart === 0) return { emoji: '🎉', text: t('Heute ist der große Tag: {0} erster Löffel Beikost.', { 0: genitive(name) }) };

  const mine = logs.filter((l) => l.childId === child.id);
  const dayNo = -toStart + 1;

  // Meilenstein: verschiedene Lebensmittel – nur an dem Tag, an dem die Zahl erreicht wurde
  const firstSeen = new Map<string, string>();
  for (const l of [...mine].sort((a, b) => a.date.localeCompare(b.date))) if (!firstSeen.has(l.foodId)) firstSeen.set(l.foodId, l.date);
  const countUntil = (date: string) => [...firstSeen.values()].filter((d) => d <= date).length;
  const nowCount = countUntil(today);
  const yesterdayCount = countUntil(addDays(today, -1));
  const reached = MILESTONE_FOODS.filter((m) => m <= nowCount && m > yesterdayCount).pop();
  if (reached) return { emoji: '🏅', text: t('{0} Lebensmittel hat {1} schon entdeckt – schön!', { 0: reached, 1: name }) };

  if (MILESTONE_DAYS[dayNo - 1]) return { emoji: '🌟', text: t('{0} mit {1} – schön, dass ihr dabei seid!', { 0: MILESTONE_DAYS[dayNo - 1], 1: name }) };

  if (newFoodId && FOOD_BY_ID[newFoodId]) {
    const f = FOOD_BY_ID[newFoodId];
    if (newFoodDay === 1) return { emoji: f.emoji, text: t('Heute neu für {0}: {1}. Mal sehen, wie es schmeckt!', { 0: name, 1: short(f.name) }) };
    if (newFoodDay && newFoodTotal) return { emoji: f.emoji, text: t('{0} geht weiter – Tag {1} von {2} für {3}.', { 0: short(f.name), 1: newFoodDay, 2: newFoodTotal, 3: name }) };
  }

  const liked = mine.filter((l) => l.date === addDays(today, -1) && l.liking === 1).map((l) => FOOD_BY_ID[l.foodId]).filter(Boolean);
  if (liked.length) return { emoji: '♥', text: t('Gestern hat {0} {1} geschmeckt.', { 0: name, 1: short(liked[0].name) }) };

  const idx = Math.abs(diffDays('2026-01-01', today)) % EVERYDAY.length;
  return { emoji: '☀️', text: EVERYDAY[idx](name, dayNo) };
}
