import { tr } from '@/i18n';
/**
 * Trinken & Eisen – eigene Formulierungen nach NHS, KKH (Grundrezepte Gesund ins Leben)
 * und Verbraucherzentrale.
 */
export const DRINK_SOURCES = [
  { label: 'NHS: Drinks and cups for babies and young children', url: 'https://www.nhs.uk/baby/weaning-and-feeding/drinks-and-cups-for-babies-and-young-children/' },
  { label: 'KKH: Beikost (nach Gesund ins Leben)', url: 'https://www.kkh.de/leistungen/familie-kind/saeuglinge/babykost/beikost' },
  { label: 'Verbraucherzentrale: Beikost für Ihr Baby', url: 'https://www.verbraucherzentrale.de/wissen/lebensmittel/gesund-ernaehren/beikost-fuer-ihr-baby-bereit-fuer-den-brei-62024' },
  { label: 'Verbraucherzentrale: Eignet sich Leitungswasser für Babys?', url: 'https://www.verbraucherzentrale.de/wissen/umwelt-haushalt/wasser/eignet-sich-leitungswasser-fuer-babys-34854' },
  { label: 'DAK: Ab wann trinken Babys Wasser?', url: 'https://www.dak.de/dak/gesundheit/essen-trinken/baby-und-kinderernaehrung/ab-wann-trinken-babys-wasser-_13452' },
];

export const DRINK_STEPS = tr([
  { emoji: '🥄', when: 'Mit dem ersten Brei', text: 'Kleine Schlucke Wasser zum Essen sind möglich, aber noch nicht nötig. Muttermilch oder Fläschchen reichen.' },
  { emoji: '🥛', when: 'Spätestens mit dem 3. Brei', text: 'Jetzt braucht dein Kind zusätzlich etwas zu trinken: frisches Leitungswasser zu jeder Breimahlzeit. Alternativ ungesüßter Kräuter- oder Früchtetee.' },
  { emoji: '🍼', when: 'Ab etwa 12 Monaten', text: 'Kuhmilch (pasteurisiert, 3,5 %) darf jetzt Getränk sein – aus Becher oder Tasse. Die Flasche langsam abgewöhnen.' },
]);

/** Welches Wasser? Leitungswasser ist in Deutschland in der Regel geeignet – mit wenigen Ausnahmen. */
export const WATER_TIPS = tr([
  'Leitungswasser ist in Deutschland meist von guter Qualität und als Getränk zur Beikost geeignet. Abkochen ist dafür nicht nötig.',
  'Vor dem Abfüllen laufen lassen, bis das Wasser frisch und kalt aus der Leitung kommt (nicht aus dem Warmwasserhahn).',
  'Abkochen wird höchstens in den ersten Lebenswochen als Vorsorge für das Fläschchen empfohlen – danach auf 30–40 °C abkühlen lassen.',
  'Mineralwasser nur still und mit dem Hinweis „geeignet für die Zubereitung von Säuglingsnahrung“ – dann ist es auch natrium- und nitratarm.',
]);

export const WATER_EXCEPTIONS = tr([
  'Bleileitungen (möglich in Häusern, die vor 1973 gebaut wurden)',
  'Neue Kupferrohre im ersten halben Jahr',
  'Ungeprüfter Hausbrunnen – Wasser erst vom Gesundheitsamt prüfen lassen',
  'Wasser aus Tischfiltern oder Warmwasserboilern',
]);

export const CUP_TIPS = tr([
  'Offener Becher oder Trinklernbecher ohne Ventil: So lernt dein Kind das Schlucken, und es ist besser für die Zähne.',
  'Anfangs nur wenig Wasser einfüllen, Verschütten gehört dazu.',
  'Wasser zu den Mahlzeiten anbieten – dein Kind bestimmt, wie viel es trinkt.',
]);

export const DRINK_AVOID = tr([
  'Saft, Schorle oder Smoothies als Getränk – im ersten Jahr unnötig und schlecht für die Zähne',
  'Gesüßte Tees, Instant-Tees und „Babygetränke“',
  'Kuhmilch als Getränk vor etwa 12 Monaten (im Brei ist sie in Ordnung)',
  'Rohmilch und Vorzugsmilch',
  'Reisdrink (Arsen)',
  'Dauernuckeln an der Flasche mit gesüßten Getränken',
]);

export const IRON_TEXT = tr({
  why: 'Ab dem zweiten Lebenshalbjahr reichen die Eisenspeicher von Babys allmählich nicht mehr aus – Eisen kommt dann vor allem über die Beikost.',
  how: [
    'Das Grundrezept des Mittagsbreis enthält jeden Tag 30 g Fleisch, an 1–2 Tagen pro Woche stattdessen Fisch.',
    'Vegetarisch: statt Fleisch 10 g Hafer- oder Hirseflocken und Vitamin-C-reiches Obst dazu – Vitamin C verbessert die Eisenaufnahme.',
    'Gute Eisenquellen: Rind, Lamm, Hähnchenkeule, Hirse, Haferflocken, Linsen, Kichererbsen.',
  ],
  app: 'Die Übersicht zeigt nur, an welchen Tagen ein eisenreiches Lebensmittel eingetragen wurde. Sie bewertet nicht, ob dein Kind ausreichend versorgt ist – bei Fragen dazu hilft eure Kinderarztpraxis.',
});
