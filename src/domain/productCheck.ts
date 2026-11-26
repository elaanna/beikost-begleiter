/**
 * Supermarkt-Scanner: Produktangaben (Open Food Facts) allgemein einordnen (Konzept F11).
 *
 * Grundlage: WHO Europa, Nährwert- und Werbeprofil für Beikost-Fertigprodukte (2022):
 * keine zugesetzten Zucker oder Süßungsmittel, wenig Natrium; dazu „Kein Honig im ersten Jahr“
 * und das Profil des Kindes (ärztlich bekannte Allergien, schon Eingeführtes).
 * Keine verbindliche Aussage, ob ein Produkt für ein Kind sicher oder allergenfrei ist.
 */
import type { Allergen, Child, FoodLog } from './types';
import { FOOD_BY_ID } from '@/data/foods';

export interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_de?: string;
  generic_name_de?: string;
  brands?: string;
  quantity?: string;
  image_front_small_url?: string;
  ingredients_text?: string;
  ingredients_text_de?: string;
  ingredients_text_en?: string;
  ingredients_text_fr?: string;
  /** Sprachunabhängige Zutaten-Kennungen von Open Food Facts, z. B. „en:glucose-syrup“. */
  ingredients_tags?: string[];
  allergens_tags?: string[];
  traces_tags?: string[];
  additives_tags?: string[];
  categories_tags?: string[];
  nutriments?: { sugars_100g?: number; salt_100g?: number; sodium_100g?: number; 'energy-kcal_100g'?: number };
}

export type CheckLevel = 'gut' | 'achtung' | 'nein' | 'info';

export interface CheckPoint {
  level: CheckLevel;
  title: string;
  text: string;
}

export type Verdict = 'gut' | 'bedacht' | 'lieber_nicht' | 'unklar';

export interface ProductCheck {
  name: string;
  brand: string;
  image?: string;
  verdict: Verdict;
  points: CheckPoint[];
}

// Zuckerwörter in mehreren Sprachen: Viele Produkte haben die Zutatenliste bei Open Food Facts nur auf Englisch,
// Französisch, Italienisch oder Niederländisch (Fehler 26.11.: Gummibärchen mit englischer Liste galten als „ohne Zuckerzusatz“).
const SUGAR_WORDS: [RegExp, string][] = [
  [/\bhonig\b|\bhoney\b|\bmiel\b|\bmiele\b|\bhoning\b/i, 'Honig'],
  [/glucose[\s-]*(fructose[\s-]*)?syrup|corn syrup|sirop de glucose|sciroppo di glucosio|jarabe de glucosa|glucosestroop|glucose-fructosestroop/i, 'Glukosesirup'],
  [/(?<!no added |without |sans |senza )\b(sugars?|sucre|zucchero|azúcar|azucar|suiker)\b(?![\s-]?free)/i, 'Zucker'],
  [/\bsucrose\b|\bsaccharose\b|\bsacarosa\b/i, 'Zucker'],
  [/\bdextrose\b|\bdextrosa\b/i, 'Traubenzucker'],
  [/\binvert(ed)? sugar|sucre inverti|zucchero invertito|invertsuiker/i, 'Invertzucker'],
  [/(rice|agave|maple|date|apple) syrup|sirop d'(érable|agave)|stroop/i, 'Sirup'],
  [/malt extract|extrait de malt|estratto di malto|moutextract/i, 'Malzextrakt'],
  [/(fruit )?juice concentrate|concentrated (fruit|apple|grape) juice|jus concentré|succo concentrato|vruchtensapconcentraat/i, 'Fruchtsaftkonzentrat'],
  [/coconut (blossom )?sugar|sucre de coco/i, 'Kokosblütenzucker'],
  [/maltodextrin/i, 'Maltodextrin'],
  [/glu(c|k)ose(-|\s)?(fruktose|fructose)?-?sirup|glukosesirup|glucosesirup/i, 'Glukosesirup'],
  [/(?<!milch)zucker(?!frei)|saccharose|sucrose/i, 'Zucker'],
  [/dextrose|traubenzucker/i, 'Traubenzucker'],
  [/fru(c|k)tose(?!-sirup)/i, 'Fruktose'],
  [/invertzucker|invertzuckersirup/i, 'Invertzucker'],
  [/(agaven|reis|ahorn|dattel|apfel|birnen)sirup|dicksaft/i, 'Sirup'],
  [/malzextrakt|gerstenmalz/i, 'Malzextrakt'],
  [/fruchtsaftkonzentrat|saftkonzentrat/i, 'Fruchtsaftkonzentrat'],
  [/kokosblütenzucker/i, 'Kokosblütenzucker'],
];

/** Zutaten-Kennungen (sprachunabhängig) für zugesetzte Zucker. */
const SUGAR_TAGS: Record<string, string> = {
  'en:sugar': 'Zucker', 'en:cane-sugar': 'Zucker', 'en:beet-sugar': 'Zucker', 'en:brown-sugar': 'Zucker', 'en:sucrose': 'Zucker',
  'en:caramelised-sugar': 'Zucker', 'en:icing-sugar': 'Zucker', 'en:added-sugar': 'Zucker',
  'en:glucose-syrup': 'Glukosesirup', 'en:glucose-fructose-syrup': 'Glukosesirup', 'en:fructose-glucose-syrup': 'Glukosesirup',
  'en:corn-syrup': 'Glukosesirup', 'en:glucose': 'Traubenzucker', 'en:dextrose': 'Traubenzucker', 'en:fructose': 'Fruktose',
  'en:invert-sugar': 'Invertzucker', 'en:invert-sugar-syrup': 'Invertzucker', 'en:maltodextrin': 'Maltodextrin',
  'en:syrup': 'Sirup', 'en:rice-syrup': 'Sirup', 'en:agave-syrup': 'Sirup', 'en:maple-syrup': 'Sirup', 'en:date-syrup': 'Sirup',
  'en:malt-extract': 'Malzextrakt', 'en:barley-malt-extract': 'Malzextrakt',
  'en:concentrated-fruit-juice': 'Fruchtsaftkonzentrat', 'en:fruit-juice-concentrate': 'Fruchtsaftkonzentrat',
  'en:coconut-sugar': 'Kokosblütenzucker', 'en:honey': 'Honig',
};

/** Süßigkeiten-Kategorien: für Babys grundsätzlich ungeeignet (Zucker, Verschluckgefahr). */
const CANDY_CATEGORIES = /^en:(confectioneries|candies|gummies|gummy-candies|chewy-candies|jelly-candies|hard-candies|lollipops|marshmallows|chewing-gum|chocolates|chocolate-candies|bonbons|sweets|liquorice|licorice)$/;

/** Ab diesem Zuckergehalt (g/100 g) gibt es einen Hinweis – auch wenn der Zucker natürlich enthalten ist. */
export const SUGAR_HIGH_100G = 15;

const SWEETENER_TAGS = /^en:e(95\d|96\d)/; // E950–E969 Süßungsmittel
const ALLERGEN_TAGS: Record<string, Allergen> = {
  'en:milk': 'milch', 'en:eggs': 'ei', 'en:gluten': 'gluten', 'en:peanuts': 'erdnuss', 'en:nuts': 'baumnuss',
  'en:soybeans': 'soja', 'en:sesame-seeds': 'sesam', 'en:fish': 'fisch', 'en:celery': 'sellerie', 'en:mustard': 'senf',
};
const ALLERGEN_NAME: Record<Allergen, string> = {
  ei: 'Ei', milch: 'Milch', erdnuss: 'Erdnuss', baumnuss: 'Nüsse', fisch: 'Fisch', gluten: 'Gluten',
  soja: 'Soja', sesam: 'Sesam', sellerie: 'Sellerie', senf: 'Senf',
};

/** Altersangabe auf der Packung, z. B. „ab dem 5. Monat“, „ab 6 Monaten“, „12+“, „ab 1 Jahr“. */
export function labelMonths(text: string): number | null {
  const t = text.toLowerCase();
  let m = t.match(/(?:ab|nach)\s*(?:dem\s*)?(\d{1,2})\.?\s*(?:lebens)?monat/);
  if (m) return t.includes('nach dem') ? Number(m[1]) : Number(m[1]) - (/(\d{1,2})\.\s*monat/.test(t) ? 1 : 0);
  m = t.match(/ab\s*(\d{1,2})\s*monaten/);
  if (m) return Number(m[1]);
  m = t.match(/ab\s*(\d)\s*jahr/);
  if (m) return Number(m[1]) * 12;
  m = t.match(/\b(\d{1,2})\s*\+\s*(?:m\b|monat)/);
  if (m) return Number(m[1]);
  m = t.match(/\b(12|18|24)\s*\+/);
  if (m) return Number(m[1]);
  return null;
}

function ingredientList(text: string): string[] {
  return text.split(/,(?![^(]*\))/).map((s) => s.replace(/[_*]/g, '').trim()).filter(Boolean);
}

export function analyzeProduct(p: OffProduct, child: Child, logs: FoodLog[], ageMonths: number): ProductCheck {
  const name = p.product_name_de || p.product_name || p.generic_name_de || 'Unbekanntes Produkt';
  const ingredients = p.ingredients_text_de || p.ingredients_text || p.ingredients_text_en || p.ingredients_text_fr || '';
  // Für die Zuckersuche alle Sprachfassungen zusammen prüfen
  const allText = [p.ingredients_text_de, p.ingredients_text, p.ingredients_text_en, p.ingredients_text_fr].filter(Boolean).join(' , ');
  const tags = p.ingredients_tags ?? [];
  /** Nur wenn die Liste auf Deutsch/Englisch vorliegt oder Kennungen da sind, können wir „ohne“ sicher sagen. */
  const reliable = Boolean(p.ingredients_text_de || p.ingredients_text_en || tags.length);
  const list = ingredientList(ingredients);
  const points: CheckPoint[] = [];
  const who = child.name;

  // Altersangabe der Packung
  const labelAge = labelMonths(`${name} ${p.quantity ?? ''} ${(p.categories_tags ?? []).join(' ')}`);
  if (labelAge !== null && labelAge > ageMonths) {
    points.push({ level: 'nein', title: `Laut Packung erst ab ${labelAge} Monaten`, text: `${who} ist ${ageMonths} Monate alt.` });
  }

  // Süßigkeit?
  if ((p.categories_tags ?? []).some((c) => CANDY_CATEGORIES.test(c))) {
    points.push({ level: 'nein', title: 'Süßigkeit', text: 'Für Babys nicht geeignet: viel Zucker, und zähe oder harte Stücke sind eine Verschluckgefahr.' });
  }

  // Zucker und Süßungsmittel – Text (alle Sprachen) und Zutaten-Kennungen
  const sugarLabels = new Set<string>();
  for (const [re, label] of SUGAR_WORDS) if (re.test(allText)) sugarLabels.add(label);
  for (const t of tags) if (SUGAR_TAGS[t]) sugarLabels.add(SUGAR_TAGS[t]);
  const honey = sugarLabels.has('Honig');
  if (honey && ageMonths < 12) {
    points.push({ level: 'nein', title: 'Enthält Honig', text: 'Im ersten Lebensjahr nicht geben – auch nicht erhitzt.' });
  }
  // Honig im ersten Jahr steht schon oben als klares Nein
  const addedLabels = [...sugarLabels].filter((l) => !(l === 'Honig' && ageMonths < 12));
  if (addedLabels.length) {
    const firstIdx = list.findIndex((ing) => SUGAR_WORDS.some(([re, l]) => addedLabels.includes(l) && re.test(ing)));
    points.push({
      level: 'achtung',
      title: `Zugesetzter Zucker: ${addedLabels.join(', ')}`,
      text: firstIdx >= 0 && firstIdx < 3 ? 'Steht weit vorn in der Zutatenliste.' : 'Für Babys sind zugesetzte Zucker unnötig.',
    });
  }
  const sweeteners = (p.additives_tags ?? []).filter((t) => SWEETENER_TAGS.test(t));
  if (sweeteners.length || /sucralose|aspartam|steviol|acesulfam|sorbit|xylit|erythrit/i.test(ingredients)) {
    points.push({ level: 'achtung', title: 'Süßungsmittel', text: 'Für Babys und Kleinkinder nicht geeignet.' });
  }

  // Zuckergehalt (auch natürlicher Zucker, z. B. Trockenfrucht)
  const sugar100 = p.nutriments?.sugars_100g;
  if (sugar100 !== undefined && sugar100 >= SUGAR_HIGH_100G) {
    points.push({ level: 'achtung', title: `Sehr zuckerreich (${String(Math.round(sugar100)).replace('.', ',')} g Zucker pro 100 g)`, text: 'Für Babys ist so viel Zucker ungünstig – auch wenn er aus Früchten stammt.' });
  }

  // Salz
  const salt = p.nutriments?.salt_100g ?? (p.nutriments?.sodium_100g !== undefined ? p.nutriments.sodium_100g * 2.5 : undefined);
  if (salt !== undefined) {
    if (salt > 0.3) points.push({ level: 'achtung', title: `Viel Salz (${salt.toFixed(2).replace('.', ',')} g pro 100 g)`, text: 'Babynieren vertragen nur wenig Salz.' });
    else if (salt > 0.125) points.push({ level: 'achtung', title: `Salz (${salt.toFixed(2).replace('.', ',')} g pro 100 g)`, text: 'Etwas mehr als für Babykost empfohlen.' });
  }

  // Allergene
  const tried = new Set(logs.filter((l) => l.childId === child.id && l.reaction === 'keine').map((l) => l.foodId));
  const introduced = (a: Allergen) => [...tried].some((id) => FOOD_BY_ID[id]?.allergens.includes(a));
  const declared = Array.from(new Set((p.allergens_tags ?? []).map((t) => ALLERGEN_TAGS[t]).filter(Boolean)));
  for (const a of declared) {
    if (child.exclusions.includes(a)) {
      points.push({ level: 'nein', title: `Enthält ${ALLERGEN_NAME[a]}`, text: `Bei ${who} als Allergie hinterlegt.` });
    } else if (!introduced(a)) {
      points.push({ level: 'info', title: `Enthält ${ALLERGEN_NAME[a]}`, text: `Bei ${who} noch nicht eingeführt – erst einzeln einführen.` });
    } else {
      points.push({ level: 'info', title: `Enthält ${ALLERGEN_NAME[a]}`, text: `Bei ${who} schon eingeführt.` });
    }
  }
  const traces = Array.from(new Set((p.traces_tags ?? []).map((t) => ALLERGEN_TAGS[t]).filter((a) => a && child.exclusions.includes(a))));
  for (const a of traces) points.push({ level: 'achtung', title: `Kann Spuren von ${ALLERGEN_NAME[a]} enthalten`, text: `Bei ${who} als Allergie hinterlegt.` });

  // Zusatzstoffe
  const additives = (p.additives_tags ?? []).filter((t) => !SWEETENER_TAGS.test(t));
  if (additives.length) {
    points.push({ level: 'info', title: `${additives.length} Zusatzstoff${additives.length === 1 ? '' : 'e'}`, text: additives.map((t) => t.replace('en:', '').toUpperCase()).join(', ') });
  }

  // Positives
  if (ingredients && reliable && !addedLabels.length && !honey && !sweeteners.length && (sugar100 === undefined || sugar100 < SUGAR_HIGH_100G)) {
    points.push({ level: 'gut', title: 'Ohne Zuckerzusatz', text: 'Laut Zutatenliste.' });
  } else if (ingredients && !reliable && !addedLabels.length) {
    points.push({ level: 'achtung', title: 'Zutatenliste in anderer Sprache', text: 'Zucker konnte nicht sicher geprüft werden – bitte die Packung lesen.' });
  }
  if (list.length > 0 && list.length <= 3) points.push({ level: 'gut', title: 'Kurze Zutatenliste', text: list.join(', ') });
  if (/vollkorn/i.test(ingredients)) points.push({ level: 'gut', title: 'Mit Vollkorn', text: 'Liefert Ballaststoffe und Eisen.' });
  if (ingredients && additives.length === 0 && (p.additives_tags ?? []).length === 0) points.push({ level: 'gut', title: 'Ohne Zusatzstoffe', text: 'Laut Angaben.' });

  const verdict: Verdict = !ingredients && !declared.length
    ? 'unklar'
    : points.some((x) => x.level === 'nein') ? 'lieber_nicht'
    : points.some((x) => x.level === 'achtung') ? 'bedacht'
    : 'gut';

  const order: Record<CheckLevel, number> = { nein: 0, achtung: 1, info: 2, gut: 3 };
  if (!ingredients) points.push({ level: 'info', title: 'Keine Zutatenliste hinterlegt', text: 'Bitte die Angaben auf der Packung lesen.' });
  return {
    name,
    brand: p.brands?.split(',')[0]?.trim() ?? '',
    image: p.image_front_small_url,
    verdict,
    points: points.sort((a, b) => order[a.level] - order[b.level]),
  };
}

export const VERDICT_TEXT: Record<Verdict, (name: string) => string> = {
  gut: (n) => `Sieht gut aus für ${n}`,
  bedacht: (n) => `Mit Bedacht für ${n}`,
  lieber_nicht: (n) => `Lieber nicht für ${n}`,
  unklar: () => 'Zu wenig Angaben',
};

export const OFF_FIELDS = 'code,product_name,product_name_de,generic_name_de,brands,quantity,image_front_small_url,ingredients_text,ingredients_text_de,ingredients_text_en,ingredients_text_fr,ingredients_tags,allergens_tags,traces_tags,additives_tags,categories_tags,nutriments';

/** Produkt bei Open Food Facts abfragen. Es wird nur der Barcode gesendet. */
export async function fetchProduct(ean: string): Promise<OffProduct | null> {
  const clean = ean.replace(/\D/g, '');
  if (clean.length < 8 || clean.length > 14) return null;
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${OFF_FIELDS}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { status?: number; product?: OffProduct };
  return data.status === 1 && data.product ? data.product : null;
}

export const PRODUCT_SOURCES = [
  { label: 'Produktdaten: Open Food Facts (ODbL)', url: 'https://world.openfoodfacts.org' },
  { label: 'WHO Europa: Nährwertprofil für Beikost-Fertigprodukte (2022)', url: 'https://www.who.int/europe/publications/i/item/WHO-EURO-2022-6681-46447-67287' },
];
