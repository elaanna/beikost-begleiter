/**
 * Familienessen ab ca. 10 Monaten: Gegen Ende des ersten Lebensjahres gehen Babys schrittweise
 * zur Familienkost über (Netzwerk Gesund ins Leben 2024). Grundregel: Die Babyportion wird
 * abgenommen, bevor gesalzen oder scharf gewürzt wird.
 * Eigene Rezepte, vor dem Launch fachlich prüfen lassen.
 */

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  minutes: number;
  /** Zutaten mit Bezug zur Lebensmittel-Datenbank (für Allergene und „schon bekannt?“). */
  foods: string[];
  ingredients: string[];
  steps: string[];
  /** Was für das Baby anders gemacht wird. */
  baby: string;
}

export const FAMILY_FROM_MONTHS = 10;

export const RECIPES: Recipe[] = [
  {
    id: 'gemuese-nudeln',
    name: 'Gemüsenudeln mit Tomatensoße',
    emoji: '🍝',
    minutes: 25,
    foods: ['nudeln', 'tomate', 'zucchini', 'karotte', 'olivenoel'],
    ingredients: ['250 g Vollkornnudeln', '1 Dose stückige Tomaten', '1 Zucchini', '1 Karotte', '1 EL Olivenöl', 'Basilikum'],
    steps: [
      'Karotte und Zucchini fein raspeln, in Olivenöl weich dünsten.',
      'Tomaten dazugeben und 10 Minuten köcheln lassen, dann pürieren.',
      'Nudeln weich kochen und mit der Soße mischen.',
    ],
    baby: 'Babyportion vor dem Salzen abnehmen. Nudeln etwas weicher kochen, große Formen als Fingerfood.',
  },
  {
    id: 'lachs-ofengemuese',
    name: 'Lachs mit Ofengemüse',
    emoji: '🐟',
    minutes: 35,
    foods: ['lachs', 'kartoffel', 'brokkoli', 'karotte', 'rapsoel'],
    ingredients: ['2 Lachsfilets', '500 g Kartoffeln', '1 Brokkoli', '2 Karotten', '2 EL Rapsöl', 'Zitrone'],
    steps: [
      'Kartoffeln und Karotten in Spalten schneiden, mit Rapsöl 20 Minuten bei 200 °C backen.',
      'Brokkoliröschen und Lachs dazulegen, weitere 12–15 Minuten garen, bis der Fisch durch ist.',
    ],
    baby: 'Lachs grätenfrei zerpflücken, Gemüse zerdrücken oder als weiche Spalten. Erst danach salzen.',
  },
  {
    id: 'linsen-dal',
    name: 'Mildes Linsen-Dal mit Reis',
    emoji: '🍛',
    minutes: 30,
    foods: ['linsen', 'karotte', 'suesskartoffel', 'reis', 'rapsoel'],
    ingredients: ['200 g rote Linsen', '1 Süßkartoffel', '1 Karotte', '150 g Reis', '1 EL Rapsöl', 'mildes Currypulver (Erwachsene)'],
    steps: [
      'Süßkartoffel und Karotte würfeln, mit Linsen in 700 ml Wasser 20 Minuten weich kochen.',
      'Reis separat kochen.',
      'Rapsöl unterrühren.',
    ],
    baby: 'Babyportion vor dem Würzen abnehmen und etwas zerdrücken. Gewürze und Salz erst danach für die Großen.',
  },
  {
    id: 'haehnchen-gemuesereis',
    name: 'Hähnchen-Gemüse-Reis',
    emoji: '🍗',
    minutes: 30,
    foods: ['huhn', 'reis', 'erbsen', 'karotte', 'rapsoel'],
    ingredients: ['2 Hähnchenkeulen ohne Haut', '150 g Reis', '150 g TK-Erbsen', '2 Karotten', '1 EL Rapsöl'],
    steps: [
      'Hähnchen in Rapsöl rundum anbraten, mit Wasser bedeckt 25 Minuten schmoren.',
      'Reis mit Karottenwürfeln kochen, Erbsen in den letzten 5 Minuten dazugeben.',
      'Fleisch vom Knochen lösen und unterheben.',
    ],
    baby: 'Fleisch in feine Fasern zupfen, Erbsen zerdrücken. Ohne Salz und Brühe.',
  },
  {
    id: 'kartoffel-ei-spinat',
    name: 'Kartoffelstampf mit Spinat und Ei',
    emoji: '🥚',
    minutes: 25,
    foods: ['kartoffel', 'spinat', 'ei', 'butter', 'vollmilch'],
    ingredients: ['600 g Kartoffeln', '300 g TK-Spinat', '4 Eier', '1 EL Butter', 'Schuss Milch'],
    steps: [
      'Kartoffeln weich kochen und mit Milch und Butter stampfen.',
      'Spinat kurz dünsten.',
      'Eier 10 Minuten hart kochen.',
    ],
    baby: 'Ei vollständig hart gekocht, zerdrückt oder geviertelt. Spinatreste nur einmal aufwärmen.',
  },
  {
    id: 'bolognese',
    name: 'Rinder-Bolognese mit Gemüse',
    emoji: '🍝',
    minutes: 40,
    foods: ['rind', 'tomate', 'karotte', 'sellerie', 'nudeln', 'olivenoel'],
    ingredients: ['300 g Rinderhack', '1 Dose Tomaten', '2 Karotten', '1 Stück Knollensellerie', '300 g Vollkornnudeln', '1 EL Olivenöl'],
    steps: [
      'Gemüse sehr fein würfeln, mit dem Hack in Olivenöl anbraten, bis es durchgegart ist.',
      'Tomaten dazu, 20 Minuten köcheln.',
      'Mit Nudeln servieren.',
    ],
    baby: 'Vor dem Salzen abnehmen. Hackfleisch fein zerdrücken, damit keine festen Klümpchen bleiben.',
  },
  {
    id: 'hirse-gemuese-bratlinge',
    name: 'Hirse-Gemüse-Bratlinge',
    emoji: '🥞',
    minutes: 35,
    foods: ['hirse', 'zucchini', 'karotte', 'ei', 'rapsoel'],
    ingredients: ['150 g Hirse', '1 Zucchini', '1 Karotte', '1 Ei', '2 EL Rapsöl'],
    steps: [
      'Hirse in doppelter Menge Wasser 15 Minuten quellen lassen.',
      'Gemüse fein reiben, ausdrücken und mit Hirse und Ei vermengen.',
      'Kleine Bratlinge formen und in Rapsöl von beiden Seiten durchbraten.',
    ],
    baby: 'Ideal als Fingerfood. Die Bratlinge müssen ganz durchgegart sein (Ei).',
  },
  {
    id: 'kichererbsen-eintopf',
    name: 'Kichererbsen-Gemüse-Eintopf',
    emoji: '🥘',
    minutes: 30,
    foods: ['kichererbsen', 'kuerbis', 'tomate', 'olivenoel'],
    ingredients: ['1 Dose Kichererbsen ohne Salz', '½ Hokkaido', '1 Dose Tomaten', '1 EL Olivenöl', 'Kreuzkümmel (Erwachsene)'],
    steps: [
      'Kürbis würfeln, in Olivenöl andünsten.',
      'Tomaten und abgespülte Kichererbsen dazu, 20 Minuten köcheln.',
    ],
    baby: 'Kichererbsen immer zerdrücken. Babyportion vor dem Würzen abnehmen.',
  },
  {
    id: 'porridge-familie',
    name: 'Familien-Porridge mit Obst',
    emoji: '🥣',
    minutes: 10,
    foods: ['hafer', 'vollmilch', 'apfel', 'banane', 'mandel'],
    ingredients: ['100 g zarte Haferflocken', '400 ml Milch', '1 Apfel', '1 Banane', '1 TL Mandelmus'],
    steps: [
      'Haferflocken in Milch aufkochen und quellen lassen.',
      'Apfel reiben, Banane zerdrücken und unterrühren, Mandelmus darauf.',
    ],
    baby: 'Ohne Zucker oder Honig. Mandelmus nur als Mus, nie gehackte Mandeln.',
  },
  {
    id: 'pute-polenta',
    name: 'Putenragout mit Polenta',
    emoji: '🌽',
    minutes: 35,
    foods: ['pute', 'polenta', 'paprika', 'zucchini', 'olivenoel'],
    ingredients: ['300 g Putenbrust', '150 g Polenta', '1 Paprika', '1 Zucchini', '1 EL Olivenöl'],
    steps: [
      'Pute in kleine Würfel schneiden und in Olivenöl durchbraten.',
      'Gemüse würfeln, dazugeben und mit etwas Wasser weich schmoren.',
      'Polenta nach Packung weich kochen.',
    ],
    baby: 'Fleisch fein schneiden oder zerpflücken, Paprika ohne Haut. Polenta-Sticks als Fingerfood.',
  },
  {
    id: 'tofu-gemuesepfanne',
    name: 'Tofu-Gemüsepfanne mit Hirse',
    emoji: '🥢',
    minutes: 25,
    foods: ['tofu', 'brokkoli', 'karotte', 'hirse', 'sesam'],
    ingredients: ['200 g Tofu', '1 Brokkoli', '2 Karotten', '150 g Hirse', '1 TL Tahin'],
    steps: [
      'Hirse kochen.',
      'Tofu in Würfeln anbraten, Gemüse dazugeben und weich garen.',
      'Tahin mit etwas Wasser verrühren und unterheben.',
    ],
    baby: 'Ohne Sojasoße (sehr salzig). Gemüse weich garen, Tofu in fingerlangen Stücken.',
  },
  {
    id: 'gemuesesuppe',
    name: 'Cremige Kürbissuppe',
    emoji: '🎃',
    minutes: 25,
    foods: ['kuerbis', 'kartoffel', 'karotte', 'butter'],
    ingredients: ['1 Hokkaido', '2 Kartoffeln', '1 Karotte', '1 EL Butter', 'Brot zum Dippen'],
    steps: [
      'Gemüse würfeln, in Butter andünsten.',
      'Mit Wasser bedecken und 20 Minuten weich kochen, dann pürieren.',
    ],
    baby: 'Ohne Brühwürfel. Etwas dicker lassen, damit sie gut vom Löffel geht.',
  },
];
