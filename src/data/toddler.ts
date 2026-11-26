/**
 * Kleinkind-Phase „nimou table“ (1–3 Jahre): Rezepte, Tagesbausteine, Brotdose, Hinweise.
 *
 * Grundlagen (nur Orientierung, keine Bewertung der Ernährung des Kindes):
 * - Netzwerk Gesund ins Leben: Koletzko B et al. (2013) Ernährung und Bewegung im Kleinkindalter. Monatsschr Kinderheilkd.
 *   3 Haupt- + 2 Zwischenmahlzeiten, 2–3 Stunden Pause, Wasser/ungesüßte Getränke (Optimierte Mischkost 600–700 ml/Tag),
 *   Fisch 1–2× pro Woche, Fleisch/Wurst/Ei mäßig, Süßes/Salz sparsam, Eltern bestimmen was und wann – das Kind wie viel,
 *   Verschluckgefahr: Nüsse und harte Stücke in Erdnussgröße, ganze Weintrauben, rohe Wurzelgemüse-Stücke.
 * - KKH (Ernährungspyramide): Portionen nach Handmaß des Kindes; Meeresfisch 1–2× pro Woche; Fleisch nicht täglich.
 * - Verbraucherzentrale Niedersachsen: Brotdose mit Obst, Gemüse, (Vollkorn-)Getreide und Milchprodukt; Wasser oder ungesüßter Tee.
 */
import type { BabyRecipe, Storage } from './babyRecipes';

export const TABLE_FROM_MONTHS = 12;

export type TableSlot = 'fruehstueck' | 'vormittag' | 'mittag' | 'nachmittag' | 'abend';

export const TABLE_SLOTS: TableSlot[] = ['fruehstueck', 'vormittag', 'mittag', 'nachmittag', 'abend'];

export const TABLE_SLOT_INFO: Record<TableSlot, { label: string; time: string; main: boolean }> = {
  fruehstueck: { label: 'Frühstück', time: '07:30', main: true },
  vormittag: { label: 'Vormittag', time: '10:00', main: false },
  mittag: { label: 'Mittag', time: '12:00', main: true },
  nachmittag: { label: 'Nachmittag', time: '15:00', main: false },
  abend: { label: 'Abend', time: '18:00', main: true },
};

export interface TableOption {
  id: string;
  title: string;
  foods: string[];
  hint?: string;
}

/** Bausteine für Frühstück, Zwischenmahlzeiten und Abendbrot (Mittag kommt aus den Rezepten). */
export const TABLE_OPTIONS: Record<Exclude<TableSlot, 'mittag'>, TableOption[]> = {
  fruehstueck: [
    { id: 'f-hafer', title: 'Haferflocken mit Milch und Apfel', foods: ['hafer', 'vollmilch', 'apfel'], hint: 'Apfel fein reiben.' },
    { id: 'f-brot-frischkaese', title: 'Vollkornbrot mit Frischkäse und Gurke', foods: ['brot', 'frischkaese', 'gurke'], hint: 'Gurke in dünnen Scheiben.' },
    { id: 'f-joghurt', title: 'Naturjoghurt mit Haferflocken und Beeren', foods: ['joghurt', 'hafer', 'heidelbeere'], hint: 'Heidelbeeren zerdrücken oder vierteln.' },
    { id: 'f-brot-banane', title: 'Brot mit Butter und Banane', foods: ['brot', 'butter', 'banane'] },
    { id: 'f-hirse', title: 'Hirsebrei mit Milch und Birne', foods: ['hirse', 'vollmilch', 'birne'] },
    { id: 'f-ei', title: 'Rührei mit Brot und Tomate', foods: ['ei', 'brot', 'tomate'], hint: 'Ei vollständig durchgaren, Tomate vierteln.' },
  ],
  vormittag: [
    { id: 'v-sticks', title: 'Gurken- und Paprikasticks mit Brot', foods: ['gurke', 'paprika', 'brot'], hint: 'Paprika in weichen Streifen.' },
    { id: 'v-birne', title: 'Birne und ein Stück Vollkornbrot', foods: ['birne', 'brot'] },
    { id: 'v-kohlrabi', title: 'Kohlrabi gedünstet und Mandarine', foods: ['kohlrabi', 'mandarine'], hint: 'Kohlrabi weich dünsten, roh nur fein geraspelt.' },
    { id: 'v-banane', title: 'Banane und Naturjoghurt', foods: ['banane', 'joghurt'] },
    { id: 'v-apfel', title: 'Apfelspalten und Dinkelbrot', foods: ['apfel', 'dinkel'], hint: 'Apfel weich dünsten oder sehr dünn schneiden.' },
  ],
  nachmittag: [
    { id: 'n-quark', title: 'Quark mit Beeren', foods: ['quark', 'erdbeere'], hint: 'Ohne Zucker – die Früchte süßen.' },
    { id: 'n-joghurt-obst', title: 'Naturjoghurt mit Mango', foods: ['joghurt', 'mango'] },
    { id: 'n-brot-apfel', title: 'Brot mit Butter und Apfel', foods: ['brot', 'butter', 'apfel'] },
    { id: 'n-milch-banane', title: 'Banane und ein Becher Milch', foods: ['banane', 'vollmilch'] },
    { id: 'n-melone', title: 'Melone und Vollkornbrot', foods: ['melone', 'brot'] },
  ],
  abend: [
    { id: 'a-brot-kaese', title: 'Vollkornbrot mit Mozzarella und Tomate', foods: ['brot', 'mozzarella', 'tomate'], hint: 'Tomate vierteln.' },
    { id: 'a-brot-quark', title: 'Brot mit Kräuterquark und Gurke', foods: ['brot', 'quark', 'gurke'] },
    { id: 'a-milchreis', title: 'Milchreis mit Apfel (ohne Zucker)', foods: ['reis', 'vollmilch', 'apfel'] },
    { id: 'a-brot-ei', title: 'Brot mit Ei-Aufstrich und Paprika', foods: ['brot', 'ei', 'paprika'], hint: 'Ei hart kochen.' },
    { id: 'a-suppe', title: 'Gemüsesuppe mit Brot', foods: ['kartoffel', 'karotte', 'lauch', 'brot'] },
    { id: 'a-pfannkuchen', title: 'Vollkorn-Pfannkuchen mit Apfelmus', foods: ['dinkel', 'ei', 'vollmilch', 'apfel'] },
  ],
};

const TABLE_STORAGE: Storage = {
  fridge: 'Abgedeckt im Kühlschrank bis zum nächsten Tag, nur einmal aufwärmen.',
  freeze: 'Gut geeignet: portionsweise einfrieren, bei −18 °C bis zu 2 Monate.',
  thaw: 'Im Kühlschrank auftauen und gut durcherhitzen. Nicht wieder einfrieren.',
};
const FRESH: Storage = { fridge: 'Am besten frisch essen; Reste bis zum nächsten Tag im Kühlschrank.', freeze: null };

const KIDS = 'Kinderportion vor dem Salzen und scharfen Würzen abnehmen.';

/** Mittagessen für die ganze Familie – mit Kinderportion. Art: fleisch, fisch, vegetarisch. */
export const TABLE_RECIPES: (BabyRecipe & { kind: 'fleisch' | 'fisch' | 'vegetarisch' })[] = [
  {
    id: 'kk-ofenkartoffel-quark', name: 'Ofenkartoffeln mit Kräuterquark', emoji: '🥔', category: 'kleinkind', kind: 'vegetarisch', slot: 'mittag',
    minutes: 40, fromMonth: TABLE_FROM_MONTHS, consistency: 'Weiche Kartoffelspalten zum Selberessen',
    foods: ['kartoffel', 'quark', 'gurke', 'rapsoel'],
    ingredients: ['800 g festkochende Kartoffeln', '250 g Quark', '3 EL Milch', 'Kräuter (Schnittlauch, Petersilie)', '1 Gurke', '2 EL Rapsöl'],
    steps: ['Kartoffeln waschen, in Spalten schneiden, mit Öl mischen.', 'Bei 200 °C etwa 30 Minuten backen, bis sie weich sind.', 'Quark mit Milch und gehackten Kräutern glatt rühren.', 'Gurke in Scheiben dazu.'],
    storage: FRESH, baby: `${KIDS} Kartoffelspalten etwas abkühlen lassen.`,
  },
  {
    id: 'kk-spinat-lasagne', name: 'Spinat-Ricotta-Lasagne', emoji: '🍝', category: 'kleinkind', kind: 'vegetarisch', slot: 'mittag',
    minutes: 60, fromMonth: TABLE_FROM_MONTHS, consistency: 'Weich, in kleinen Stücken',
    foods: ['nudeln', 'spinat', 'ricotta', 'tomate', 'mozzarella', 'olivenoel'],
    ingredients: ['12 Lasagneplatten', '450 g Blattspinat (TK)', '250 g Ricotta', '1 Dose stückige Tomaten', '125 g Mozzarella', '1 EL Olivenöl'],
    steps: ['Spinat auftauen, gut ausdrücken und mit Ricotta mischen.', 'Tomaten mit Öl 10 Minuten köcheln.', 'Abwechselnd Platten, Spinat-Ricotta und Tomaten schichten, Mozzarella oben.', 'Bei 180 °C etwa 35 Minuten backen.'],
    storage: TABLE_STORAGE, baby: `${KIDS} Lasagne in mundgerechte Stücke schneiden.`,
  },
  {
    id: 'kk-fischstaebchen', name: 'Selbstgemachte Fischstäbchen mit Kartoffelpüree und Erbsen', emoji: '🐟', category: 'kleinkind', kind: 'fisch', slot: 'mittag',
    minutes: 35, fromMonth: TABLE_FROM_MONTHS, consistency: 'Weich, Fisch ohne Gräten',
    foods: ['kabeljau', 'ei', 'brot', 'kartoffel', 'vollmilch', 'butter', 'erbsen', 'rapsoel'],
    ingredients: ['400 g Kabeljaufilet', '1 Ei', '4 EL Semmelbrösel', '600 g Kartoffeln', '100 ml Milch', '1 EL Butter', '300 g Erbsen (TK)', '2 EL Rapsöl'],
    steps: ['Kartoffeln weich kochen und mit Milch und Butter stampfen.', 'Fisch in Streifen schneiden, auf Gräten prüfen.', 'Erst in verquirltem Ei, dann in Bröseln wenden und in Öl rundum durchbraten.', 'Erbsen weich garen.'],
    storage: FRESH, safety: 'Gräten sorgfältig entfernen; Fisch vollständig durchgaren.', baby: `${KIDS} Erbsen für Jüngere leicht zerdrücken.`,
  },
  {
    id: 'kk-hackbaellchen', name: 'Hackbällchen in Tomatensoße mit Reis', emoji: '🍅', category: 'kleinkind', kind: 'fleisch', slot: 'mittag',
    minutes: 40, fromMonth: TABLE_FROM_MONTHS, consistency: 'Kleine, weiche Bällchen',
    foods: ['rind', 'ei', 'brot', 'tomate', 'reis', 'olivenoel'],
    ingredients: ['400 g Rinderhack', '1 Ei', '2 EL Semmelbrösel', '1 Dose passierte Tomaten', '250 g Reis', '1 EL Olivenöl'],
    steps: ['Hack mit Ei und Bröseln verkneten, kleine Bällchen formen.', 'In Öl anbraten, Tomaten dazu und 15 Minuten köcheln, bis die Bällchen durch sind.', 'Reis nach Packung weich kochen.'],
    storage: TABLE_STORAGE, safety: 'Hackfleisch vollständig durchgaren.', baby: `${KIDS} Bällchen halbieren.`,
  },
  {
    id: 'kk-gemuese-pfannkuchen', name: 'Herzhafte Gemüse-Pfannkuchen', emoji: '🥞', category: 'kleinkind', kind: 'vegetarisch', slot: 'mittag',
    minutes: 30, fromMonth: TABLE_FROM_MONTHS, consistency: 'Weich, in Streifen zum Greifen',
    foods: ['ei', 'dinkel', 'vollmilch', 'zucchini', 'karotte', 'rapsoel'],
    ingredients: ['2 Eier', '150 g Dinkelvollkornmehl', '250 ml Milch', '1 Zucchini', '1 Karotte', 'Rapsöl zum Braten'],
    steps: ['Eier, Mehl und Milch zu einem Teig rühren, 10 Minuten quellen lassen.', 'Zucchini und Karotte fein raspeln und unterheben.', 'In wenig Öl kleine Pfannkuchen von beiden Seiten durchbacken.'],
    storage: TABLE_STORAGE, baby: 'Ungesalzen backen; in Streifen schneiden.',
  },
  {
    id: 'kk-linsen-bolognese', name: 'Linsen-Bolognese', emoji: '🍝', category: 'kleinkind', kind: 'vegetarisch', slot: 'mittag',
    minutes: 35, fromMonth: TABLE_FROM_MONTHS, consistency: 'Weiche Soße, kurze Nudeln',
    foods: ['braune_linsen', 'nudeln', 'tomate', 'karotte', 'sellerie', 'olivenoel'],
    ingredients: ['150 g braune Linsen', '300 g kurze Vollkornnudeln', '1 Dose stückige Tomaten', '1 Karotte', '1 Stück Knollensellerie', '1 EL Olivenöl'],
    steps: ['Karotte und Sellerie fein würfeln, in Öl andünsten.', 'Linsen, Tomaten und 300 ml Wasser dazu, 25 Minuten weich köcheln.', 'Nudeln weich kochen und mischen.'],
    storage: TABLE_STORAGE, baby: KIDS,
  },
  {
    id: 'kk-haehnchen-curry', name: 'Mildes Hähnchen-Curry mit Reis', emoji: '🍛', category: 'kleinkind', kind: 'fleisch', slot: 'mittag',
    minutes: 35, fromMonth: TABLE_FROM_MONTHS, consistency: 'Kleine, weiche Stücke',
    foods: ['huhn', 'brokkoli', 'karotte', 'joghurt', 'reis', 'rapsoel'],
    ingredients: ['300 g Hähnchenbrust', '1 kleiner Brokkoli', '2 Karotten', '150 g Naturjoghurt', '1 TL mildes Currypulver', '250 g Reis', '1 EL Rapsöl'],
    steps: ['Hähnchen klein würfeln und in Öl rundum durchbraten.', 'Gemüse klein schneiden, mit etwas Wasser weich dünsten.', 'Vom Herd nehmen, Joghurt und Curry unterrühren.', 'Mit Reis servieren.'],
    storage: TABLE_STORAGE, safety: 'Geflügel vollständig durchgaren.', baby: `${KIDS} Curry für das Kind sehr mild halten.`,
  },
  {
    id: 'kk-lachs-nudeln', name: 'Lachs-Nudeln mit Erbsen', emoji: '🐟', category: 'kleinkind', kind: 'fisch', slot: 'mittag',
    minutes: 25, fromMonth: TABLE_FROM_MONTHS, consistency: 'Weich, Fisch zerpflückt',
    foods: ['lachs', 'nudeln', 'erbsen', 'frischkaese'],
    ingredients: ['250 g Lachsfilet', '300 g Vollkornnudeln', '200 g Erbsen (TK)', '100 g Frischkäse', 'etwas Nudelwasser'],
    steps: ['Lachs in wenig Wasser 8–10 Minuten garen und zerpflücken, Gräten entfernen.', 'Nudeln kochen, Erbsen die letzten 3 Minuten mitgaren.', 'Mit Frischkäse und etwas Nudelwasser zu einer Soße mischen, Lachs unterheben.'],
    storage: FRESH, safety: 'Gräten sorgfältig entfernen; Fisch vollständig durchgaren.', baby: KIDS,
  },
  {
    id: 'kk-roesti-apfelmus', name: 'Kartoffel-Zucchini-Rösti mit Apfelmus', emoji: '🥔', category: 'kleinkind', kind: 'vegetarisch', slot: 'mittag',
    minutes: 35, fromMonth: TABLE_FROM_MONTHS, consistency: 'Weich gebacken, in Stücken',
    foods: ['kartoffel', 'zucchini', 'ei', 'dinkel', 'apfel', 'rapsoel'],
    ingredients: ['600 g Kartoffeln', '1 Zucchini', '1 Ei', '2 EL Dinkelmehl', '3 Äpfel', 'Rapsöl zum Braten'],
    steps: ['Äpfel schälen, klein schneiden und mit wenig Wasser weich kochen, zerdrücken.', 'Kartoffeln und Zucchini fein reiben, gut ausdrücken.', 'Mit Ei und Mehl mischen, kleine Rösti in Öl beidseitig durchbacken.'],
    storage: FRESH, baby: 'Ungesalzen backen; Rösti nicht zu kross, damit sie weich bleiben.',
  },
  {
    id: 'kk-couscous-pfanne', name: 'Couscous-Gemüse-Pfanne mit Kichererbsen', emoji: '🥘', category: 'kleinkind', kind: 'vegetarisch', slot: 'mittag',
    minutes: 25, fromMonth: TABLE_FROM_MONTHS, consistency: 'Weich, Kichererbsen zerdrückt',
    foods: ['couscous', 'kichererbsen', 'paprika', 'zucchini', 'olivenoel'],
    ingredients: ['200 g Couscous', '1 Dose Kichererbsen', '1 rote Paprika', '1 Zucchini', '2 EL Olivenöl'],
    steps: ['Couscous mit heißem Wasser übergießen und quellen lassen.', 'Gemüse klein würfeln und in Öl weich dünsten.', 'Kichererbsen abspülen, mitwärmen und alles mischen.'],
    storage: TABLE_STORAGE, safety: 'Kichererbsen für Kleinkinder zerdrücken oder halbieren – ganz sind sie eine Verschluckgefahr.', baby: KIDS,
  },
  {
    id: 'kk-pute-kartoffel-gemuese', name: 'Putengeschnetzeltes mit Kartoffeln und Karotten', emoji: '🍗', category: 'kleinkind', kind: 'fleisch', slot: 'mittag',
    minutes: 35, fromMonth: TABLE_FROM_MONTHS, consistency: 'Kleine, weiche Stücke',
    foods: ['pute', 'kartoffel', 'karotte', 'vollmilch', 'rapsoel'],
    ingredients: ['300 g Putenbrust', '600 g Kartoffeln', '3 Karotten', '150 ml Milch', '1 EL Rapsöl'],
    steps: ['Kartoffeln und Karotten weich kochen.', 'Pute in feine Streifen schneiden und in Öl durchbraten.', 'Mit Milch ablöschen und kurz einkochen lassen.'],
    storage: TABLE_STORAGE, safety: 'Geflügel vollständig durchgaren.', baby: `${KIDS} Fleisch sehr klein schneiden.`,
  },
  {
    id: 'kk-gemuese-risotto', name: 'Kürbis-Risotto', emoji: '🎃', category: 'kleinkind', kind: 'vegetarisch', slot: 'mittag',
    minutes: 35, fromMonth: TABLE_FROM_MONTHS, consistency: 'Cremig und weich',
    foods: ['reis', 'kuerbis', 'butter'],
    ingredients: ['250 g Risottoreis', '500 g Hokkaido-Kürbis', '1 l ungesalzene Gemüsebrühe oder Wasser', '1 EL Butter', 'etwas Parmesan für die Großen'],
    steps: ['Kürbis klein würfeln.', 'Reis in Butter glasig dünsten, Kürbis dazu.', 'Nach und nach Brühe zugeben und unter Rühren etwa 25 Minuten weich garen.'],
    storage: TABLE_STORAGE, baby: `${KIDS} Parmesan ist sehr salzig – für das Kind weglassen.`,
  },
];

/** Wochenrhythmus fürs Mittagessen: Fisch 1–2× pro Woche, Fleisch nicht täglich (Gesund ins Leben, KKH). Index 0 = Montag. */
export const LUNCH_RHYTHM: ('fleisch' | 'fisch' | 'vegetarisch')[] = ['vegetarisch', 'fleisch', 'vegetarisch', 'fisch', 'vegetarisch', 'fleisch', 'vegetarisch'];

/** Brotdose: Bausteine nach Verbraucherzentrale – Getreide, Milchprodukt/Belag, Gemüse, Obst; dazu Wasser oder ungesüßter Tee. */
export type LunchboxPart = 'brot' | 'belag' | 'gemuese' | 'obst';
export const LUNCHBOX_PARTS: LunchboxPart[] = ['brot', 'belag', 'gemuese', 'obst'];
export const LUNCHBOX_LABEL: Record<LunchboxPart, string> = { brot: 'Brot & Getreide', belag: 'Belag', gemuese: 'Gemüse', obst: 'Obst' };

export const LUNCHBOX_ITEMS: Record<LunchboxPart, { id: string; text: string; food: string }[]> = {
  brot: [
    { id: 'vollkornbrot', text: 'Vollkornbrot', food: 'brot' },
    { id: 'dinkelbroetchen', text: 'Dinkelbrötchen', food: 'dinkel' },
    { id: 'roggenbrot', text: 'Roggenbrot', food: 'roggen' },
    { id: 'pfannkuchen-rolle', text: 'Vollkorn-Pfannkuchen gerollt', food: 'dinkel' },
  ],
  belag: [
    { id: 'frischkaese', text: 'Frischkäse', food: 'frischkaese' },
    { id: 'butter', text: 'Butter', food: 'butter' },
    { id: 'kraeuterquark', text: 'Kräuterquark', food: 'quark' },
    { id: 'mozzarella', text: 'Mozzarella in Scheiben', food: 'mozzarella' },
    { id: 'ei', text: 'Hart gekochtes Ei in Scheiben', food: 'ei' },
    { id: 'hummus', text: 'Hummus (ohne Salz)', food: 'kichererbsen' },
  ],
  gemuese: [
    { id: 'gurke', text: 'Gurkenscheiben', food: 'gurke' },
    { id: 'paprika', text: 'Paprikastreifen', food: 'paprika' },
    { id: 'karotte', text: 'Karotte gedünstet in Sticks', food: 'karotte' },
    { id: 'tomate', text: 'Cocktailtomaten geviertelt', food: 'tomate' },
    { id: 'kohlrabi', text: 'Kohlrabi gedünstet', food: 'kohlrabi' },
  ],
  obst: [
    { id: 'apfel', text: 'Apfelspalten (dünn)', food: 'apfel' },
    { id: 'birne', text: 'Birne (weich)', food: 'birne' },
    { id: 'banane', text: 'Banane', food: 'banane' },
    { id: 'weintrauben', text: 'Weintrauben geviertelt', food: 'weintraube' },
    { id: 'heidelbeeren', text: 'Heidelbeeren zerdrückt', food: 'heidelbeere' },
    { id: 'mandarine', text: 'Mandarinenstücke', food: 'mandarine' },
  ],
};

export const LUNCHBOX_TIPS = [
  'Bunt und abwechslungsreich: Getreide, Gemüse, Obst und ein Milchprodukt oder ein Aufstrich.',
  'Zum Trinken Wasser oder ungesüßter Tee – keine gesüßten Getränke.',
  'Spezielle Kinderlebensmittel und angereicherte Produkte sind nicht nötig, oft teuer und süßer als gedacht.',
  'Runde Sachen vierteln (Trauben, Cocktailtomaten), hartes Gemüse weich dünsten; keine ganzen Nüsse.',
  'In die Kita nur Lebensmittel, die euer Kind schon kennt und gut verträgt.',
];

export const PICKY_TIPS = [
  'Ihr bestimmt, was und wann es etwas gibt – euer Kind bestimmt, wie viel es isst.',
  'Neues immer wieder anbieten, ohne Druck. Ablehnung ist oft nur vorübergehend; Neues neben Bekanntem auf den Teller legen.',
  'Höchstens ein- bis zweimal ermuntern, keine Ersatzspeise kochen, nicht überreden oder belohnen.',
  'Essen nicht als Belohnung, Strafe oder Trost einsetzen.',
  'Gemeinsam am Tisch essen, ohne Fernseher – Kinder machen nach, was ihr esst.',
  'Mahlzeiten dürfen enden: nach etwa 30 Minuten abräumen, ohne Kommentar.',
];

export const PICKY_DOCTOR = 'Sprecht mit eurer Kinderarztpraxis, wenn euer Kind sehr wenig isst, feste Nahrung verweigert, oft erbricht oder ihr euch um das Gewicht sorgt.';

export const TABLE_BASICS = [
  '3 Haupt- und 2 Zwischenmahlzeiten, dazwischen 2–3 Stunden Pause mit Wasser.',
  'Zu jeder Mahlzeit Wasser oder ungesüßter Tee, insgesamt etwa 600–700 ml am Tag.',
  'Eine Portion ist ungefähr so groß wie die Hand eures Kindes – sie wächst mit.',
  'Fisch 1–2× pro Woche, Fleisch nicht jeden Tag, Süßes und Salz sparsam.',
];

export const TABLE_SOURCES = [
  { label: 'Gesund ins Leben: Ernährung und Bewegung im Kleinkindalter (Koletzko et al. 2013)', url: 'https://doi.org/10.1007/s00112-013-3031-3' },
  { label: 'KKH: Was darf auf den Teller? (Handmaß)', url: 'https://www.kkh.de/leistungen/familie-kind/kleinkinder/kleinkindkost/was-darf-auf-den-teller' },
];
export const LUNCHBOX_SOURCES = [
  { label: 'Verbraucherzentrale Niedersachsen: Tipps für die Brotbox', url: 'https://www.verbraucherzentrale-niedersachsen.de/node/120397' },
];
export const PICKY_SOURCES = [
  TABLE_SOURCES[0],
  { label: 'DAK: Essen lernen – so unterstützt du dein Kind', url: 'https://www.dak.de/dak/gesundheit/essen-trinken/baby-und-kinderernaehrung/essen-lernen-so-unterstuetzt-du-dein-kind_13464' },
];
