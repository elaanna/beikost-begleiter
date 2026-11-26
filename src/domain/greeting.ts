/**
 * Tägliche persönliche Begrüßung auf „Heute“: Tageszeit, Vorname (optional) und ein Satz zum Tag des Kindes.
 * Nur Organisation und Ermutigung – keine Bewertung von Gesundheit oder Entwicklung.
 */
import { addDays, diffDays } from './dates';
import { genitive } from './beikostOverview';
import { FOOD_BY_ID } from '@/data/foods';
import type { Child, FoodLog } from './types';

export function timeGreeting(hour: number): string {
  if (hour < 5) return 'Hallo';
  if (hour < 11) return 'Guten Morgen';
  if (hour < 17) return 'Hallo';
  if (hour < 22) return 'Guten Abend';
  return 'Gute Nacht';
}

export function greetingTitle(hour: number, parentName: string): string {
  const name = parentName.trim();
  return name ? `${timeGreeting(hour)}, ${name}!` : `${timeGreeting(hour)}!`;
}

export interface DailyLine {
  emoji: string;
  text: string;
}

const MILESTONE_DAYS: Record<number, string> = {
  7: 'Eine Woche Beikost',
  14: 'Zwei Wochen Beikost',
  30: 'Ein Monat Beikost',
  100: '100 Tage Beikost',
};
/** „Kürbis (Hokkaido)“ → „Kürbis“ – kürzer für die Begrüßung. */
const short = (name: string) => name.replace(/\s*\(.*\)\s*$/, '');

const MILESTONE_FOODS = [5, 10, 20, 30, 50, 75, 100];

/** Abwechselnde Sätze für ganz normale Tage (wechseln täglich, nicht bei jedem Öffnen). */
const EVERYDAY: ((name: string, n: number) => string)[] = [
  (name, n) => `Tag ${n} der Beikost mit ${name}.`,
  (name) => `Schön, dass du da bist. Hier ist, was heute für ${name} ansteht.`,
  (name) => `Kleine Löffel, große Entdeckungen – ein neuer Tag mit ${name}.`,
  (name) => `Wenn heute weniger gegessen wird, ist das völlig normal. Einfach dranbleiben mit ${name}.`,
  (name) => `${name} lernt mit jedem Löffel dazu. Du machst das gut.`,
  (name) => `Gemeinsam am Tisch zählt mehr als die Menge – viel Freude mit ${name}.`,
  (name) => `Ein neuer Tag, ein neuer Geschmack? Mal sehen, was ${name} heute sagt.`,
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
  if (toStart > 1) return { emoji: '🗓️', text: `Noch ${toStart} Tage bis zum Beikost-Start von ${name}. Zeit, in Ruhe vorzubereiten.` };
  if (toStart === 1) return { emoji: '🥄', text: `Morgen geht's los: ${genitive(name)} erster Löffel!` };
  if (toStart === 0) return { emoji: '🎉', text: `Heute ist der große Tag: ${genitive(name)} erster Löffel Beikost.` };

  const mine = logs.filter((l) => l.childId === child.id);
  const dayNo = -toStart + 1;

  // Meilenstein: verschiedene Lebensmittel – nur an dem Tag, an dem die Zahl erreicht wurde
  const firstSeen = new Map<string, string>();
  for (const l of [...mine].sort((a, b) => a.date.localeCompare(b.date))) if (!firstSeen.has(l.foodId)) firstSeen.set(l.foodId, l.date);
  const countUntil = (date: string) => [...firstSeen.values()].filter((d) => d <= date).length;
  const nowCount = countUntil(today);
  const yesterdayCount = countUntil(addDays(today, -1));
  const reached = MILESTONE_FOODS.filter((m) => m <= nowCount && m > yesterdayCount).pop();
  if (reached) return { emoji: '🏅', text: `${reached} Lebensmittel hat ${name} schon entdeckt – schön!` };

  if (MILESTONE_DAYS[dayNo - 1]) return { emoji: '🌟', text: `${MILESTONE_DAYS[dayNo - 1]} mit ${name} – schön, dass ihr dabei seid!` };

  if (newFoodId && FOOD_BY_ID[newFoodId]) {
    const f = FOOD_BY_ID[newFoodId];
    if (newFoodDay === 1) return { emoji: f.emoji, text: `Heute neu für ${name}: ${short(f.name)}. Mal sehen, wie es schmeckt!` };
    if (newFoodDay && newFoodTotal) return { emoji: f.emoji, text: `${short(f.name)} geht weiter – Tag ${newFoodDay} von ${newFoodTotal} für ${name}.` };
  }

  const liked = mine.filter((l) => l.date === addDays(today, -1) && l.liking === 1).map((l) => FOOD_BY_ID[l.foodId]).filter(Boolean);
  if (liked.length) return { emoji: '♥', text: `Gestern hat ${name} ${short(liked[0].name)} geschmeckt.` };

  const idx = Math.abs(diffDays('2026-01-01', today)) % EVERYDAY.length;
  return { emoji: '☀️', text: EVERYDAY[idx](name, dayNo) };
}
