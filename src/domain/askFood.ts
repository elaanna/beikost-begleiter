/**
 * „Darf mein Baby …?“ – Schnellantwort für eine Suchanfrage.
 * Kombiniert Lebensmittel-Datenbank, Tabu-Liste im ersten Jahr und den Plan des Kindes.
 */
import { FOODS } from '@/data/foods';
import { addDays, ageInMonths, diffDays } from './dates';
import { blockReason, buildSchedule, effectiveStartDate } from './planner';
import type { Child, Food, FoodLog } from './types';

export type AnswerTone = 'ja' | 'bald' | 'nein' | 'pausiert';

export interface FoodAnswer {
  kind: 'food';
  food: Food;
  tone: AnswerTone;
  headline: string;
  detail: string;
}

export interface AvoidAnswer {
  kind: 'avoid';
  name: string;
  emoji: string;
  headline: string;
  detail: string;
}

export type Answer = FoodAnswer | AvoidAnswer;

/** Umgangssprachliche und regionale Namen. */
const SYNONYMS: Record<string, string> = {
  möhre: 'karotte', möhren: 'karotte', rüebli: 'karotte', gelbe_rübe: 'karotte',
  hähnchen: 'huhn', hühnchen: 'huhn', hühnerfleisch: 'huhn', geflügel: 'huhn',
  rindfleisch: 'rind', hackfleisch: 'rind',
  erdnussbutter: 'erdnuss', erdnüsse: 'erdnuss',
  mandeln: 'mandel', mandelmus: 'mandel',
  joghurt: 'joghurt', jogurt: 'joghurt',
  milch: 'vollmilch', kuhmilch: 'vollmilch',
  eier: 'ei', rührei: 'ei', spiegelei: 'ei',
  haferflocken: 'hafer', porridge: 'hafer', haferbrei: 'hafer',
  kartoffeln: 'kartoffel', erdapfel: 'kartoffel',
  nudel: 'nudeln', pasta: 'nudeln', spaghetti: 'nudeln',
  brokoli: 'brokkoli', zucchino: 'zucchini',
  heidelbeeren: 'heidelbeere', blaubeeren: 'heidelbeere', blaubeere: 'heidelbeere',
  trauben: 'weintraube', weintrauben: 'weintraube',
  erdbeeren: 'erdbeere', himbeeren: 'himbeere', kirschen: 'kirsche',
  pflaumen: 'pflaume', zwetschge: 'pflaume', zwetschgen: 'pflaume',
  lachsfilet: 'lachs', tahin: 'sesam', tahini: 'sesam', hummus: 'kichererbsen',
  brötchen: 'brot', toast: 'brot',
};

/** Häufige Fragen zu Dingen, die im ersten Jahr gemieden werden. */
const AVOID_TERMS: { terms: string[]; name: string; emoji: string; detail: string }[] = [
  { terms: ['honig', 'ahornsirup', 'agavendicksaft'], name: 'Honig', emoji: '🍯', detail: 'Im ersten Lebensjahr gar nicht – auch nicht verbacken oder im Tee. Honig kann Sporen enthalten, die Säuglingsbotulismus auslösen.' },
  { terms: ['salz', 'brühe', 'brühwürfel', 'sojasoße', 'sojasauce', 'maggi'], name: 'Salz und Brühe', emoji: '🧂', detail: 'Babyessen nicht salzen. Die Babyportion vor dem Würzen abnehmen.' },
  { terms: ['zucker', 'süßigkeiten', 'schokolade', 'kekse', 'saft', 'säfte'], name: 'Zucker und Süßes', emoji: '🍬', detail: 'Im ersten Jahr meiden. Kleine Mengen Saft nur als Zutat im Brei (Vitamin C).' },
  { terms: ['nüsse', 'nuss', 'walnüsse', 'haselnüsse', 'cashews', 'popcorn'], name: 'Ganze Nüsse', emoji: '🥜', detail: 'Ganze oder gehackte Nüsse sind bis ins Kindergartenalter eine Erstickungsgefahr. Nüsse nur als glattes Mus oder fein gemahlen.' },
  { terms: ['rohmilch', 'rohmilchkäse', 'vorzugsmilch'], name: 'Rohmilch', emoji: '🧀', detail: 'Nicht im ersten Jahr – Gefahr durch Krankheitserreger. Nur pasteurisierte Milch.' },
  { terms: ['sushi', 'mett', 'tatar', 'carpaccio', 'roher fisch', 'rohes fleisch'], name: 'Rohes Fleisch und roher Fisch', emoji: '🍣', detail: 'Nicht für Babys. Fleisch und Fisch immer vollständig durchgaren.' },
  { terms: ['thunfisch', 'schwertfisch', 'hai'], name: 'Thunfisch und Schwertfisch', emoji: '🐟', detail: 'Höhere Quecksilberbelastung – besser Lachs, Forelle, Kabeljau oder Seelachs.' },
  { terms: ['reiswaffel', 'reiswaffeln', 'reisdrink', 'reismilch'], name: 'Reiswaffeln und Reisdrinks', emoji: '🍘', detail: 'Können Arsen enthalten: Reisdrinks gar nicht, Reiswaffeln nicht als Dauersnack.' },
  { terms: ['kaffee', 'cola', 'tee', 'schwarztee', 'grüntee', 'energydrink'], name: 'Koffein und Tee mit Teein', emoji: '☕', detail: 'Nicht für Säuglinge. Zu trinken gibt es Muttermilch, Säuglingsmilch und Wasser.' },
  { terms: ['wurst', 'schinken', 'salami', 'würstchen'], name: 'Wurst und Schinken', emoji: '🌭', detail: 'Sehr salzig und oft gepökelt – im ersten Jahr meiden. Besser frisches, durchgegartes Fleisch.' },
];

const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/^darf (mein|unser) baby (schon )?/, '').replace(/[?!.]/g, '').trim();

/** Findet Lebensmittel und Tabu-Einträge zu einer Anfrage. */
export function searchFoods(query: string): { foods: Food[]; avoid: (typeof AVOID_TERMS)[number][] } {
  const q = norm(query);
  if (q.length < 2) return { foods: [], avoid: [] };
  const synonym = SYNONYMS[q.replace(/ /g, '_')] ?? SYNONYMS[q];
  const foods = FOODS.filter((f) => {
    if (synonym && f.id === synonym) return true;
    const name = f.name.toLowerCase();
    return name.includes(q) || f.id.includes(q.replace(/ /g, '_'));
  });
  // exakte Treffer und Synonyme zuerst, dann Namensanfang
  const rank = (f: Food) => (f.id === q || f.id === synonym ? 2 : f.name.toLowerCase().startsWith(q) ? 1 : 0);
  foods.sort((a, b) => rank(b) - rank(a));
  const avoid = AVOID_TERMS.filter((a) => a.terms.some((t) => t === q || (q.length >= 4 && t.startsWith(q))));
  return { foods: foods.slice(0, 8), avoid };
}

/** Antwort für ein Lebensmittel und ein Kind. */
export function answerFor(food: Food, child: Child, logs: FoodLog[], today: string): FoodAnswer {
  const reason = blockReason(food, child, logs);
  if (reason) {
    return { kind: 'food', food, tone: 'pausiert', headline: 'Gerade nicht', detail: reason };
  }
  const tried = logs.some((l) => l.childId === child.id && l.foodId === food.id);
  if (tried) {
    return { kind: 'food', food, tone: 'ja', headline: 'Ja – schon probiert', detail: 'Darf weiter regelmäßig auf den Teller.' };
  }
  const start = effectiveStartDate(child);
  const daysSinceStart = diffDays(start, today);
  if (daysSinceStart < 0) {
    return {
      kind: 'food', food, tone: 'bald',
      headline: 'Noch nicht – erst nach dem Beikoststart',
      detail: `${child.name} ist ${ageInMonths(child.birthDate, today)} Monate alt. Bis zum Start gibt es nur Milch.`,
    };
  }
  const intro = buildSchedule(child, logs, 400).introductions.find((x) => x.food.id === food.id);
  if (intro && intro.fromDay > daysSinceStart) {
    const inDays = intro.fromDay - daysSinceStart;
    return {
      kind: 'food', food, tone: 'bald',
      headline: inDays <= 7 ? 'Bald – kommt in den nächsten Tagen' : `Etwas später – in etwa ${Math.round(inDays / 7)} Wochen`,
      detail: `Im Plan ab ${addDays(today, inDays).split('-').reverse().join('.')}. ${food.allergens.length ? 'Früher geht auch – dann aber nur ein neues Allergen zur Zeit und drei Tage hintereinander.' : 'Wenn ihr möchtet, könnt ihr es auch früher anbieten.'}`,
    };
  }
  return {
    kind: 'food', food, tone: 'ja',
    headline: food.allergens.length ? 'Ja – als neues Allergen einzeln einführen' : 'Ja',
    detail: food.allergens.length ? 'Drei Tage hintereinander anbieten, ohne ein anderes neues Allergen.' : 'Darf jetzt angeboten werden.',
  };
}

/** Komplette Antwortliste für die Suche. */
export function ask(query: string, child: Child, logs: FoodLog[], today: string): Answer[] {
  const { foods, avoid } = searchFoods(query);
  return [
    ...avoid.map<AvoidAnswer>((a) => ({ kind: 'avoid', name: a.name, emoji: a.emoji, headline: 'Nein – im ersten Jahr nicht', detail: a.detail })),
    ...foods.map((f) => answerFor(f, child, logs, today)),
  ];
}
