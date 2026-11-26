/**
 * Familienessen-Konverter (Konzept F09): Aus einem Familiengericht wird eine Babyvariante –
 * ausschließlich über feste, geprüfte Regeln (keine freie Generierung).
 * Grundlage: Netzwerk Gesund ins Leben (Übergang zur Familienkost, Babyportion vor dem Würzen abnehmen)
 * und die Liste „Im ersten Jahr nicht geben“ der App. Vor dem Launch fachlich prüfen lassen.
 */
import type { FeedingApproach } from '@/domain/types';

export type Stage = 'brei' | 'stueckig' | 'finger';

export const STAGE_INFO: Record<Stage, { label: string; emoji: string; text: string }> = {
  brei: { label: 'Fein püriert', emoji: '🥣', text: 'Glatt pürieren, bei Bedarf mit etwas Kochwasser verdünnen.' },
  stueckig: { label: 'Zerdrückt & stückig', emoji: '🍴', text: 'Mit der Gabel zerdrücken; kleine, sehr weiche Stückchen dürfen bleiben.' },
  finger: { label: 'Weiche Stücke', emoji: '✋', text: 'Greifbare, fingerlange Stücke, die sich zwischen zwei Fingern zerdrücken lassen.' },
};

/** Allgemeine Orientierung nach Alter und gewählter Methode – Eltern können jederzeit umstellen. */
export function suggestedStage(ageMonths: number, approach: FeedingApproach): Stage {
  if (approach === 'blw') return 'finger';
  if (ageMonths < 8) return 'brei';
  if (ageMonths < 10) return 'stueckig';
  return 'finger';
}

export interface DishType {
  id: string;
  emoji: string;
  name: string;
  examples: string;
  /** Schritte je Stufe, nach dem gemeinsamen ersten Schritt „Babyportion abnehmen“. */
  steps: Record<Stage, string[]>;
}

export const DISH_TYPES: DishType[] = [
  {
    id: 'nudeln', emoji: '🍝', name: 'Nudeln mit Soße', examples: 'Tomatensoße, Bolognese, Gemüsesoße',
    steps: {
      brei: ['Nudeln etwas länger weich kochen.', 'Mit der ungewürzten Soße fein pürieren.'],
      stueckig: ['Kleine Nudeln (z. B. Hörnchen) sehr weich kochen.', 'Soße untermischen, Hackfleisch fein zerdrücken.'],
      finger: ['Große Nudelformen (Penne, Fusilli) weich kochen.', 'Soße dick halten, damit sie an den Nudeln haftet.'],
    },
  },
  {
    id: 'suppe', emoji: '🍲', name: 'Suppe oder Eintopf', examples: 'Gemüsesuppe, Linseneintopf',
    steps: {
      brei: ['Einen Teil mit wenig Flüssigkeit abschöpfen.', 'Fein pürieren, eher dick als flüssig.'],
      stueckig: ['Mit wenig Brühe abschöpfen und grob zerdrücken.', 'Hülsenfrüchte immer zerdrücken.'],
      finger: ['Weiche Gemüsestücke herausfischen und als Fingerfood anbieten.', 'Den Rest etwas eindicken und vom Löffel geben.'],
    },
  },
  {
    id: 'ofen', emoji: '🥘', name: 'Ofengemüse & Kartoffeln', examples: 'Blech-Gemüse, Ofenkartoffeln',
    steps: {
      brei: ['Gemüse sehr weich garen.', 'Mit einem Schuss Wasser und etwas Rapsöl fein pürieren.'],
      stueckig: ['Mit der Gabel zerdrücken, Schale entfernen.'],
      finger: ['In fingerdicken Spalten garen, bis sie ganz weich sind.', 'Harte, krosse Ränder abschneiden.'],
    },
  },
  {
    id: 'pfanne', emoji: '🥢', name: 'Pfanne oder Curry', examples: 'Gemüsepfanne, mildes Curry, Reispfanne',
    steps: {
      brei: ['Gemüse länger garen als für die Großen.', 'Mit Reis und etwas Wasser pürieren.'],
      stueckig: ['Gemüse klein schneiden und weich garen, Reis leicht zerdrücken.'],
      finger: ['Gemüse und Tofu in fingerlangen, weichen Stücken anbieten.', 'Reis zu kleinen Bällchen formen.'],
    },
  },
  {
    id: 'fleisch', emoji: '🍗', name: 'Fleisch mit Beilage', examples: 'Hähnchen, Rind, Pute mit Gemüse',
    steps: {
      brei: ['Fleisch vollständig durchgaren.', 'Mit Gemüse, Beilage und etwas Kochwasser fein pürieren.'],
      stueckig: ['Fleisch in feine Fasern zupfen oder sehr klein schneiden.', 'Gemüse und Beilage zerdrücken.'],
      finger: ['Weiches Fleisch in fingerlangen Streifen (z. B. Keule, Schmorfleisch).', 'Zähe Stücke, Haut und Knorpel entfernen.'],
    },
  },
  {
    id: 'fisch', emoji: '🐟', name: 'Fisch mit Beilage', examples: 'Lachs, Kabeljau mit Kartoffeln',
    steps: {
      brei: ['Fisch vollständig garen und sorgfältig auf Gräten prüfen.', 'Mit Kartoffeln und Gemüse pürieren.'],
      stueckig: ['Fisch grätenfrei zerpflücken und unter zerdrückte Kartoffeln mischen.'],
      finger: ['Fisch in großen, grätenfreien Flocken anbieten.', 'Kartoffeln und Gemüse als weiche Spalten.'],
    },
  },
  {
    id: 'auflauf', emoji: '🧀', name: 'Auflauf', examples: 'Gemüse-Nudel-Auflauf, Kartoffelgratin',
    steps: {
      brei: ['Einen Teil vor dem Überbacken mit Käse abnehmen.', 'Fein pürieren.'],
      stueckig: ['Vor dem Würzen abnehmen und zerdrücken.'],
      finger: ['Weiche Stücke ohne harte, überbackene Kruste anbieten.'],
    },
  },
  {
    id: 'fruehstueck', emoji: '🥣', name: 'Frühstück', examples: 'Porridge, Brot, Pfannkuchen',
    steps: {
      brei: ['Porridge mit Wasser oder Milch kochen, ohne Zucker.', 'Obst fein zerdrückt untermischen.'],
      stueckig: ['Porridge etwas fester kochen, Obst in kleinen weichen Stücken.'],
      finger: ['Fein vermahlenes Brot ohne Körner in Streifen, dünn mit Mus oder Frischkäse.', 'Pfannkuchen ohne Zucker in Streifen, Ei vollständig durchgebacken.'],
    },
  },
];

export type RuleLevel = 'nie' | 'anpassen' | 'hinweis';

export interface IngredientRule {
  id: string;
  emoji: string;
  name: string;
  level: RuleLevel;
  action: string;
}

/** Zutaten, die im Familiengericht stecken können, und was für das Baby gilt. */
export const INGREDIENT_RULES: IngredientRule[] = [
  { id: 'salz', emoji: '🧂', name: 'Salz, Brühe, Würzsoßen', level: 'anpassen', action: 'Babyportion vorher abnehmen. Keine Brühwürfel, Sojasoße oder Fertigwürzmischungen in die Babyportion.' },
  { id: 'scharf', emoji: '🌶️', name: 'Scharfe Gewürze', level: 'anpassen', action: 'Erst nach dem Abnehmen der Babyportion zugeben. Milde Kräuter sind in Ordnung.' },
  { id: 'honig', emoji: '🍯', name: 'Honig oder Ahornsirup', level: 'nie', action: 'Im ersten Jahr nie – auch nicht erhitzt. Babyportion ohne.' },
  { id: 'zucker', emoji: '🍬', name: 'Zucker, Süßungsmittel', level: 'anpassen', action: 'Babyportion ungesüßt lassen; Süße durch reifes Obst.' },
  { id: 'ei_weich', emoji: '🥚', name: 'Weiches oder rohes Ei', level: 'nie', action: 'Ei für das Baby immer vollständig durcherhitzen (kein weiches Ei, kein cremiges Rührei, keine rohe Mayonnaise).' },
  { id: 'nuesse', emoji: '🥜', name: 'Ganze oder gehackte Nüsse', level: 'nie', action: 'Erstickungsgefahr: Nüsse nur als feines Mus oder fein gemahlen verwenden.' },
  { id: 'rund', emoji: '🍇', name: 'Trauben, Kirschtomaten, Oliven', level: 'anpassen', action: 'Immer vierteln oder zerdrücken.' },
  { id: 'hart', emoji: '🥕', name: 'Rohes, hartes Gemüse oder Obst', level: 'anpassen', action: 'Für das Baby weich garen oder fein reiben.' },
  { id: 'rohmilch', emoji: '🧀', name: 'Rohmilchkäse', level: 'nie', action: 'Im ersten Jahr nicht geben. Pasteurisierten Käse in kleinen Mengen verwenden.' },
  { id: 'wurst', emoji: '🥓', name: 'Wurst, Schinken, Speck', level: 'anpassen', action: 'Sehr salzig – für das Baby weglassen und frisches, durchgegartes Fleisch nehmen.' },
  { id: 'fisch_quecksilber', emoji: '🐟', name: 'Thunfisch, Schwertfisch', level: 'anpassen', action: 'Für das Baby besser Lachs, Kabeljau oder Seelachs (weniger Quecksilber).' },
  { id: 'roh_tierisch', emoji: '🍣', name: 'Roher Fisch, rohes Fleisch', level: 'nie', action: 'Für das Baby nur vollständig durchgegart.' },
  { id: 'alkohol', emoji: '🍷', name: 'Wein oder Alkohol in der Soße', level: 'nie', action: 'Babyportion vor dem Ablöschen abnehmen.' },
  { id: 'reis', emoji: '🍚', name: 'Reis, Reiswaffeln', level: 'hinweis', action: 'Reis als Beilage ist in Ordnung; Reiswaffeln und Reisdrinks nicht als Dauersnack (Arsen).' },
  { id: 'huelsen', emoji: '🫘', name: 'Bohnen, Kichererbsen, Erbsen', level: 'anpassen', action: 'Immer weich kochen und zerdrücken.' },
];

/** Diese Grundregel gilt immer und steht als erster Schritt in jeder Variante. */
export const FIRST_STEP = 'Babyportion abnehmen, bevor gesalzen, scharf gewürzt oder gesüßt wird.';

/** Zuordnung der Familienrezepte der App zu Gerichtstyp und enthaltenen Zutaten. */
export const RECIPE_PRESETS: Record<string, { dish: string; rules: string[] }> = {
  'gemuese-nudeln': { dish: 'nudeln', rules: ['salz'] },
  'lachs-ofengemuese': { dish: 'fisch', rules: ['salz'] },
  'linsen-dal': { dish: 'pfanne', rules: ['salz', 'scharf', 'huelsen', 'reis'] },
  'haehnchen-gemuesereis': { dish: 'fleisch', rules: ['salz', 'reis'] },
  'kartoffel-ei-spinat': { dish: 'ofen', rules: ['salz', 'ei_weich'] },
  'bolognese': { dish: 'nudeln', rules: ['salz'] },
  'hirse-gemuese-bratlinge': { dish: 'ofen', rules: ['salz', 'ei_weich'] },
  'kichererbsen-eintopf': { dish: 'suppe', rules: ['salz', 'scharf', 'huelsen'] },
  'porridge-familie': { dish: 'fruehstueck', rules: ['zucker', 'honig', 'nuesse'] },
  'pute-polenta': { dish: 'fleisch', rules: ['salz'] },
  'tofu-gemuesepfanne': { dish: 'pfanne', rules: ['salz'] },
  'gemuesesuppe': { dish: 'suppe', rules: ['salz'] },
};

export const CONVERTER_SOURCES = [
  { label: 'Gesund ins Leben 2024: Handlungsempfehlungen Säuglingsernährung', url: 'https://doi.org/10.1007/s00112-024-02014-7' },
];
