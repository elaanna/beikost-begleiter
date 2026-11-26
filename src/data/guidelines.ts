import { tr } from '@/i18n';
/**
 * Wissen, das die App anzeigt und in der Planungslogik verwendet.
 * Jede Aussage trägt ihre Quelle mit Link, damit Eltern sie nachlesen können.
 * Stand der Recherche: 25. November 2026.
 */

export interface GuidelineSource {
  id: string;
  title: string;
  short: string;
  url: string;
  status: string;
}

export const SOURCES = {
  allergie: {
    id: 'allergie',
    title: 'S3-Leitlinie Allergieprävention (AWMF 061-016)',
    short: 'S3 Allergieprävention',
    url: 'https://register.awmf.org/assets/guidelines/061-016l_S3_Allergiepraevention_2022-11.pdf',
    status: 'Stand 11/2022, Gültigkeit laut AWMF verlängert',
  },
  stillen: {
    id: 'stillen',
    title: 'S3-Leitlinie Stilldauer und Interventionen zur Stillförderung (AWMF 027-072)',
    short: 'S3 Stilldauer',
    url: 'https://register.awmf.org/assets/guidelines/027-072l_S3_Stilldauer-Interventionen-zur-Stillfoerderung_2026-02.pdf',
    status: 'Version 1.0, 02/2026',
  },
  bvkj: {
    id: 'bvkj',
    title: 'Sondervotum des BVKJ zur S3-Leitlinie Stilldauer',
    short: 'BVKJ',
    url: 'https://www.bvkj.de/fileadmin/bvkj/pdf/pm-stellungnahmen/2026/S3_Stilldauer_Sondervotum_BVKJ.pdf',
    status: '2026',
  },
  gil: {
    id: 'gil',
    title: 'Netzwerk Gesund ins Leben: Ernährung und Bewegung von Säuglingen und stillenden Frauen 2024',
    short: 'Gesund ins Leben 2024',
    url: 'https://doi.org/10.1007/s00112-024-02014-7',
    status: 'Monatsschrift Kinderheilkunde 173 (Suppl 1), 2025',
  },
  ascia: {
    id: 'ascia',
    title: 'ASCIA: How to introduce solid foods to babies for allergy prevention (FAQ)',
    short: 'ASCIA 2024',
    url: 'https://www.allergy.org.au/images/pc/ASCIA_PC_How_to_Introduce_Solid_Foods_FAQ_2024.pdf',
    status: 'Australasian Society of Clinical Immunology and Allergy, 2024',
  },
  jama: {
    id: 'jama',
    title: 'Samady et al.: Recommendations on complementary food introduction among pediatric practitioners',
    short: 'JAMA Netw Open 2020',
    url: 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2769315',
    status: 'JAMA Network Open, 2020',
  },
  vz: {
    id: 'vz',
    title: 'Verbraucherzentrale: Beikost für Ihr Baby – bereit für den Brei',
    short: 'Verbraucherzentrale',
    url: 'https://www.verbraucherzentrale.nrw/wissen/lebensmittel/gesund-ernaehren/beikost-bereit-fuer-den-brei-62024',
    status: 'Stand 10/2024',
  },
} satisfies Record<string, GuidelineSource>;

export type SourceId = keyof typeof SOURCES;

export type Topic = 'beikoststart' | 'neue_lebensmittel' | 'allergene' | 'stillen' | 'trinken' | 'saeuglingsnahrung' | 'ergaenzung';

export interface GuidelineStatement {
  id: string;
  topic: Topic;
  /** Kurz und in Alltagssprache. */
  text: string;
  strength?: string;
  source: SourceId;
  /** Als wichtiger Hinweis (rot) hervorheben. */
  important?: boolean;
}

export const TOPIC_LABEL: Record<Topic, { title: string; emoji: string }> = tr({
  beikoststart: { title: 'Wann starten?', emoji: '🗓️' },
  neue_lebensmittel: { title: 'Neue Lebensmittel', emoji: '🥕' },
  allergene: { title: 'Allergene: was die Leitlinie sagt', emoji: '🥚' },
  stillen: { title: 'Stillen', emoji: '🤱' },
  trinken: { title: 'Trinken & Milch', emoji: '🥛' },
  saeuglingsnahrung: { title: 'Säuglingsnahrung', emoji: '🍼' },
  ergaenzung: { title: 'Nahrungsergänzung', emoji: '💊' },
});

export const STATEMENTS: GuidelineStatement[] = tr([
  // --- Beikoststart ---
  {
    id: 'start-fenster', topic: 'beikoststart', source: 'allergie', strength: 'Empfehlung B',
    text: 'Beikost frühestens ab Beginn des 5. und spätestens ab Beginn des 7. Lebensmonats einführen – abhängig von den Reifezeichen.',
  },
  {
    id: 'still-6m', topic: 'beikoststart', source: 'stillen', strength: 'Empfehlung B',
    text: 'Die neue Stillleitlinie empfiehlt, bis zum vollendeten 6. Monat ausschließlich oder überwiegend zu stillen.',
  },
  {
    id: 'start-dissens', topic: 'beikoststart', source: 'bvkj',
    text: 'Die beiden Leitlinien widersprechen sich beim Zeitpunkt. Der Kinderärzteverband bleibt beim Fenster Beginn 5. bis Beginn 7. Monat. Besprecht den Start bei der U-Untersuchung.',
  },
  // --- Neue Lebensmittel ---
  {
    id: 'neu-akzeptanz', topic: 'neue_lebensmittel', source: 'gil',
    text: 'Nicht gemocht ist normal: Oft akzeptieren Babys ein Lebensmittel erst nach 8- bis 10-maligem Anbieten. Immer wieder ohne Druck anbieten.',
  },
  {
    id: 'neu-vielfalt', topic: 'neue_lebensmittel', source: 'gil',
    text: 'Abwechslung bei den Zutaten ist erwünscht. Salz und starke Süße vermeiden.',
  },
  {
    id: 'neu-3tage', topic: 'neue_lebensmittel', source: 'jama',
    text: 'Eine feste Wartezeit von 3–5 Tagen zwischen neuen Lebensmitteln ist nicht belegt und steht nicht in den deutschen Empfehlungen. Die App bietet Neues 2 Tage an, Allergene 3 Tage – zum Gewöhnen und Beobachten.',
  },
  {
    id: 'neu-fisch', topic: 'neue_lebensmittel', source: 'gil',
    text: 'Ein- bis zweimal pro Woche Fisch (auch fettreichen) statt Fleisch im Mittagsbrei.',
  },
  {
    id: 'neu-familienkost', topic: 'neue_lebensmittel', source: 'gil',
    text: 'Gegen Ende des ersten Lebensjahres geht die Beikost schrittweise ins Familienessen über. Die Babyportion abnehmen, bevor gesalzen oder scharf gewürzt wird.',
  },
  {
    id: 'neu-blw', topic: 'neue_lebensmittel', source: 'gil', important: true,
    text: 'Zu Baby-led Weaning fehlen laut Gesund ins Leben bisher ein durchgerechnetes Konzept und ein Sicherheitsnachweis. Harte Stücke wie rohes Wurzelgemüse und Nüsse können eingeatmet werden.',
  },
  // --- Allergene ---
  {
    id: 'allergen-nicht-meiden', topic: 'allergene', source: 'allergie', strength: 'Empfehlung A',
    text: 'Allergene nicht vorbeugend weglassen oder hinauszögern – das schützt nicht vor Allergien.',
  },
  {
    id: 'allergen-einzeln', topic: 'allergene', source: 'ascia',
    text: 'Pro Mahlzeit nur ein neues Allergen einführen, damit ihr eine Reaktion zuordnen könnt.',
  },
  {
    id: 'allergen-erhalten', topic: 'allergene', source: 'ascia', important: true,
    text: 'Einmal vertragen, dann regelmäßig weitergeben – etwa zweimal pro Woche. Wer ein Allergen nur einmal probiert und dann weglässt, riskiert eher eine Allergie.',
  },
  {
    id: 'allergen-ei', topic: 'allergene', source: 'allergie', strength: 'Empfehlung B', important: true,
    text: 'Hühnerei nur durcherhitzt geben (hart gekocht oder verbacken) – kein rohes Ei, kein cremiges Rührei.',
  },
  {
    id: 'allergen-erdnuss', topic: 'allergene', source: 'allergie', strength: 'Empfehlung A', important: true,
    text: 'Bei mittelschwerer bis schwerer Neurodermitis vor der ersten Erdnuss ärztlich eine Allergie ausschließen lassen. Erdnuss nur als glattes Mus, nie ganz.',
  },
  {
    id: 'allergen-vielfalt', topic: 'allergene', source: 'allergie',
    text: 'Abwechslung schützt eher: Fisch sowie bis zu 200 ml Milch oder Naturjoghurt am Tag gehören dazu.',
  },
  // --- Stillen ---
  {
    id: 'still-12m', topic: 'stillen', source: 'stillen', strength: 'Empfehlung A',
    text: 'Insgesamt mindestens 12 Monate stillen – auch neben der Beikost.',
  },
  {
    id: 'still-weiter', topic: 'stillen', source: 'allergie', strength: 'Empfehlung A',
    text: 'Mit der Beikost nicht abstillen, sondern weiterstillen.',
  },
  // --- Trinken ---
  {
    id: 'trinken-becher', topic: 'trinken', source: 'gil',
    text: 'Wasser und andere Getränke aus Becher oder Tasse anbieten, nicht aus der Flasche.',
  },
  {
    id: 'trinken-kuhmilch', topic: 'trinken', source: 'gil', important: true,
    text: 'Kuhmilch als Getränk erst gegen Ende des 1. Lebensjahres und nur in kleinen Mengen. Im Milch-Getreide-Brei ist sie erlaubt.',
  },
  // --- Säuglingsnahrung ---
  {
    id: 'nahrung-soja', topic: 'saeuglingsnahrung', source: 'allergie', strength: 'Empfehlung A',
    text: 'Säuglingsnahrung auf Sojabasis, Ziegen-, Schaf- oder Stutenmilch und Pflanzendrinks schützen nicht vor Allergien und sind dafür ungeeignet.',
  },
  // --- Ergänzung ---
  {
    id: 'erg-probiotika', topic: 'ergaenzung', source: 'allergie', strength: 'Empfehlung A',
    text: 'Keine Pro- oder Präbiotika zur Allergievorbeugung.',
  },
  {
    id: 'erg-vitd', topic: 'ergaenzung', source: 'allergie',
    text: 'Die übliche Vitamin-D-Gabe bleibt bestehen – sie ist für die Knochen, nicht gegen Allergien.',
  },
]);

/** Lebensmittel, die im ersten Lebensjahr nicht angeboten werden. */
export const AVOID_FIRST_YEAR: { name: string; emoji: string; why: string }[] = tr([
  { name: 'Honig und Ahornsirup', emoji: '🍯', why: 'Können Sporen enthalten, die Säuglingsbotulismus auslösen.' },
  { name: 'Ganze Nüsse und Erdnüsse', emoji: '🥜', why: 'Hohe Erstickungsgefahr – bis ins Kindergartenalter nur als Mus.' },
  { name: 'Ganze runde Früchte', emoji: '🍇', why: 'Trauben, Kirschtomaten, Beeren immer vierteln oder zerdrücken.' },
  { name: 'Rohes Gemüse und harte Stücke', emoji: '🥕', why: 'Rohe Karotte, Apfelstücke: können eingeatmet werden.' },
  { name: 'Rohe oder weiche Eier', emoji: '🥚', why: 'Salmonellengefahr – Ei immer durcherhitzen.' },
  { name: 'Rohmilch und Rohmilchkäse', emoji: '🧀', why: 'Gefahr durch Krankheitserreger.' },
  { name: 'Rohes Fleisch, roher Fisch, Sushi', emoji: '🍣', why: 'Gefahr durch Krankheitserreger.' },
  { name: 'Salz, Brühe, Würzsoßen', emoji: '🧂', why: 'Belastet die Nieren – Babyessen nicht salzen.' },
  { name: 'Zucker, Süßigkeiten, Säfte', emoji: '🍬', why: 'Gewöhnt an Süßes und schadet den Zähnen.' },
  { name: 'Kuhmilch als Getränk', emoji: '🥛', why: 'Erst gegen Ende des 1. Jahres in kleinen Mengen; im Brei erlaubt.' },
  { name: 'Reisdrinks, Reiswaffeln als Dauersnack', emoji: '🍘', why: 'Können Arsen enthalten.' },
  { name: 'Thunfisch, Schwertfisch', emoji: '🐟', why: 'Höhere Quecksilberbelastung.' },
]);

/** Reifezeichen für den Beikoststart. */
export const READINESS_SIGNS = tr([
  'Sitzt mit wenig Hilfe aufrecht und hält den Kopf sicher',
  'Zeigt Interesse an eurem Essen',
  'Öffnet den Mund, wenn ein Löffel kommt',
  'Schiebt Essen nicht mehr reflexartig mit der Zunge heraus',
  'Greift Dinge und führt sie zum Mund',
]);

/** Anzeichen, bei denen sofort der Notruf gewählt werden muss. */
export const EMERGENCY_SIGNS = tr([
  'Atemnot, pfeifende Atmung, anhaltender Husten',
  'Schwellung von Lippen, Zunge oder Gesicht',
  'Blässe, Schlappheit, Bewusstseinstrübung',
  'Ausgedehnter Ausschlag zusammen mit Erbrechen',
]);

/** Würgen vs. Verschlucken – der wichtigste Unterschied für Eltern. */
export const GAG_VS_CHOKE = tr({
  gag: 'Das Baby hustet, würgt, wird rot und schiebt das Essen nach vorne. Ruhig bleiben und nicht in den Mund greifen.',
  choke: 'Das Baby ist still, kann nicht husten oder schreien, läuft blau an. Sofort 112 und Erste Hilfe.',
});

/** Sicherheitsregeln beim Essen. */
export const SAFE_EATING = tr([
  'Immer aufrecht sitzend essen, nie im Liegen oder unterwegs im Kinderwagen',
  'Nie unbeaufsichtigt essen lassen',
  'Neue Allergene mittags anbieten, nicht kurz vor dem Schlafen',
  'Einen Erste-Hilfe-Kurs am Kind besuchen',
]);
