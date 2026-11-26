/**
 * Trinken & Eisen – eigene Formulierungen nach NHS, KKH (Grundrezepte Gesund ins Leben)
 * und Verbraucherzentrale.
 */
export const DRINK_SOURCES = [
  { label: 'NHS: Drinks and cups for babies and young children', url: 'https://www.nhs.uk/baby/weaning-and-feeding/drinks-and-cups-for-babies-and-young-children/' },
  { label: 'KKH: Beikost (nach Gesund ins Leben)', url: 'https://www.kkh.de/leistungen/familie-kind/saeuglinge/babykost/beikost' },
  { label: 'Verbraucherzentrale: Beikost für Ihr Baby', url: 'https://www.verbraucherzentrale.de/wissen/lebensmittel/gesund-ernaehren/beikost-fuer-ihr-baby-bereit-fuer-den-brei-62024' },
];

export const DRINK_STEPS = [
  { emoji: '🥄', when: 'Mit dem ersten Brei', text: 'Kleine Schlucke Wasser zum Essen sind möglich, aber noch nicht nötig. Muttermilch oder Fläschchen reichen.' },
  { emoji: '🥛', when: 'Spätestens mit dem 3. Brei', text: 'Jetzt braucht dein Kind zusätzlich etwas zu trinken: frisches Leitungswasser zu jeder Breimahlzeit. Alternativ ungesüßter Kräuter- oder Früchtetee.' },
  { emoji: '🍼', when: 'Ab etwa 12 Monaten', text: 'Kuhmilch (pasteurisiert, 3,5 %) darf jetzt Getränk sein – aus Becher oder Tasse. Die Flasche langsam abgewöhnen.' },
];

export const CUP_TIPS = [
  'Offener Becher oder Trinklernbecher ohne Ventil: So lernt dein Kind das Schlucken, und es ist besser für die Zähne.',
  'Anfangs nur wenig Wasser einfüllen, Verschütten gehört dazu.',
  'Wasser zu den Mahlzeiten anbieten – dein Kind bestimmt, wie viel es trinkt.',
];

export const DRINK_AVOID = [
  'Saft, Schorle oder Smoothies als Getränk – im ersten Jahr unnötig und schlecht für die Zähne',
  'Gesüßte Tees, Instant-Tees und „Babygetränke“',
  'Kuhmilch als Getränk vor etwa 12 Monaten (im Brei ist sie in Ordnung)',
  'Rohmilch und Vorzugsmilch',
  'Reisdrink (Arsen)',
  'Dauernuckeln an der Flasche mit gesüßten Getränken',
];

export const IRON_TEXT = {
  why: 'Ab dem zweiten Lebenshalbjahr reichen die Eisenspeicher von Babys allmählich nicht mehr aus – Eisen kommt dann vor allem über die Beikost.',
  how: [
    'Das Grundrezept des Mittagsbreis enthält jeden Tag 30 g Fleisch, an 1–2 Tagen pro Woche stattdessen Fisch.',
    'Vegetarisch: statt Fleisch 10 g Hafer- oder Hirseflocken und Vitamin-C-reiches Obst dazu – Vitamin C verbessert die Eisenaufnahme.',
    'Gute Eisenquellen: Rind, Lamm, Hähnchenkeule, Hirse, Haferflocken, Linsen, Kichererbsen.',
  ],
  app: 'Die Übersicht zeigt nur, an welchen Tagen ein eisenreiches Lebensmittel eingetragen wurde. Sie bewertet nicht, ob dein Kind ausreichend versorgt ist – bei Fragen dazu hilft eure Kinderarztpraxis.',
};
