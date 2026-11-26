import type { Food } from '@/domain/types';
import { FOODS_EXTRA } from './foods-extra';
import { tr } from '@/i18n';

/**
 * Lebensmittel-Datenbank (Startumfang).
 *
 * Eigene Formulierungen auf Basis öffentlicher Empfehlungen
 * (Netzwerk Gesund ins Leben, BfR, S3-Leitlinie Allergieprävention).
 * Vor dem Launch fachlich prüfen lassen (Hebamme / Ernährungsfachkraft).
 *
 * fromWeek = Woche ab Beikoststart, ab der das Lebensmittel im Plan vorkommen kann.
 */
export const FOODS: Food[] = [
  // ---------- Gemüse: Start des Mittagsbreis ----------
  {
    id: 'pastinake', name: 'Pastinake', emoji: '🥕', category: 'gemuese', fromWeek: 0, allergens: [],
    brei: 'Schälen, würfeln, weich dämpfen und fein pürieren.',
    finger: 'In fingerdicke Stifte schneiden und weich dämpfen, bis sie sich zwischen zwei Fingern zerdrücken lassen.',
    chokingRisk: 'niedrig', shopUnit: '1 Stück (ca. 200 g)', season: [1, 2, 3, 10, 11, 12],
  },
  {
    id: 'karotte', name: 'Karotte', emoji: '🥕', category: 'gemuese', fromWeek: 0, allergens: [],
    brei: 'Schälen, in Scheiben weich dämpfen, pürieren.',
    finger: 'Längs in dicke Stifte schneiden und sehr weich garen.',
    chokingRisk: 'hoch', hint: 'Nie roh oder in harten Scheiben geben: Verschluckgefahr.',
    shopUnit: '2 Stück',
  },
  {
    id: 'kuerbis', name: 'Kürbis (Hokkaido)', emoji: '🎃', category: 'gemuese', fromWeek: 0, allergens: [],
    brei: 'Entkernen, würfeln (Hokkaido mit Schale), weich dämpfen, pürieren.',
    finger: 'In breite Spalten schneiden und im Ofen weich garen.',
    chokingRisk: 'niedrig', shopUnit: '½ Kürbis', season: [8, 9, 10, 11, 12],
  },
  {
    id: 'zucchini', name: 'Zucchini', emoji: '🥒', category: 'gemuese', fromWeek: 0, allergens: [],
    brei: 'Waschen, würfeln, kurz dämpfen und pürieren.',
    finger: 'Längs vierteln, weich dämpfen oder im Ofen garen.',
    chokingRisk: 'niedrig', shopUnit: '1 Stück', season: [6, 7, 8, 9],
  },
  {
    id: 'brokkoli', name: 'Brokkoli', emoji: '🥦', category: 'gemuese', fromWeek: 1, allergens: [],
    brei: 'Röschen weich dämpfen und fein pürieren.',
    finger: 'Röschen mit Stiel als „Griff“ weich dämpfen.',
    chokingRisk: 'niedrig', shopUnit: '1 Kopf',
  },
  {
    id: 'blumenkohl', name: 'Blumenkohl', emoji: '🥦', category: 'gemuese', fromWeek: 1, allergens: [],
    brei: 'Röschen weich dämpfen und pürieren.',
    finger: 'Große Röschen weich dämpfen.',
    chokingRisk: 'niedrig', shopUnit: '½ Kopf',
  },
  {
    id: 'suesskartoffel', name: 'Süßkartoffel', emoji: '🍠', category: 'gemuese', fromWeek: 0, allergens: [],
    brei: 'Schälen, würfeln, weich kochen, zerdrücken oder pürieren.',
    finger: 'In dicke Pommes-Stifte schneiden und im Ofen weich backen.',
    chokingRisk: 'niedrig', shopUnit: '1 Stück',
  },
  {
    id: 'fenchel', name: 'Fenchel', emoji: '🌿', category: 'gemuese', fromWeek: 2, allergens: [],
    brei: 'Fein würfeln, weich dämpfen, gründlich pürieren (faserig).',
    finger: 'Eher als Brei geben – roh und halbgar zu faserig.',
    chokingRisk: 'mittel', shopUnit: '1 Knolle',
  },
  {
    id: 'erbsen', name: 'Erbsen (TK)', emoji: '🫛', category: 'gemuese', fromWeek: 2, allergens: [],
    brei: 'Weich kochen, pürieren und durch ein Sieb streichen.',
    finger: 'Weich kochen und flach zerdrücken – nie ganz und rund geben.',
    chokingRisk: 'hoch', hint: 'Ganze Erbsen können verschluckt werden: immer zerdrücken.',
    shopUnit: '1 Packung TK',
  },
  {
    id: 'spinat', name: 'Spinat', emoji: '🥬', category: 'gemuese', fromWeek: 3, allergens: [], ironRich: true,
    brei: 'Kurz dünsten und unter Gemüsebrei mischen.',
    finger: 'Fein gehackt in Omelett oder Pfannkuchen einbacken.',
    chokingRisk: 'niedrig',
    hint: 'Nitrathaltig: frisch zubereiten, Reste rasch kühlen und höchstens einmal aufwärmen.',
    shopUnit: '1 Packung TK',
  },

  // ---------- Kartoffel und Fett ----------
  {
    id: 'kartoffel', name: 'Kartoffel', emoji: '🥔', category: 'gemuese', fromWeek: 1, allergens: [],
    brei: 'Mehlig kochende Sorte weich kochen und mit Gemüse zerdrücken.',
    finger: 'In Spalten kochen oder im Ofen weich backen.',
    chokingRisk: 'niedrig', shopUnit: '500 g',
  },
  {
    id: 'rapsoel', name: 'Rapsöl', emoji: '🫒', category: 'fett', fromWeek: 1, allergens: [],
    brei: 'Etwas Rapsöl unter den fertigen Gemüse-Kartoffel-Brei rühren.',
    finger: 'Zum Garen von Gemüse im Ofen verwenden.',
    chokingRisk: 'niedrig', shopUnit: '1 Flasche',
  },
  {
    id: 'butter', name: 'Butter', emoji: '🧈', category: 'fett', fromWeek: 4, allergens: ['milch'],
    brei: 'Ein wenig unter Gemüse oder Getreidebrei rühren.',
    finger: 'Dünn auf weiches Brot streichen.',
    chokingRisk: 'niedrig', shopUnit: '1 Stück',
  },

  // ---------- Fleisch und Fisch: Woche 3–4 ----------
  {
    id: 'rind', name: 'Rindfleisch', emoji: '🥩', category: 'fleisch', fromWeek: 2, allergens: [], ironRich: true,
    brei: 'Mageres Fleisch durchgaren und fein mit dem Gemüse pürieren.',
    finger: 'Als weiche, durchgegarte Frikadelle ohne Salz oder lange Streifen Schmorfleisch.',
    chokingRisk: 'mittel', hint: 'Immer vollständig durchgaren.',
    shopUnit: '150 g',
  },
  {
    id: 'huhn', name: 'Hähnchen', emoji: '🍗', category: 'fleisch', fromWeek: 2, allergens: [], ironRich: true,
    brei: 'Durchgaren und fein pürieren. Keulenfleisch enthält mehr Eisen als Brust.',
    finger: 'Keule weich schmoren, Fleisch in langen Fasern geben, Knochen und Haut entfernen.',
    chokingRisk: 'mittel', hint: 'Immer vollständig durchgaren.',
    shopUnit: '2 Keulen',
  },
  {
    id: 'lachs', name: 'Lachs', emoji: '🐟', category: 'fisch', fromWeek: 3, allergens: ['fisch'],
    brei: 'Grätenfrei durchgaren und unter Gemüsebrei pürieren.',
    finger: 'Durchgegart in großen Flocken geben, vorher auf Gräten prüfen.',
    chokingRisk: 'mittel', hint: 'Gräten sorgfältig entfernen. Große Raubfische wie Thunfisch oder Schwertfisch meiden.',
    shopUnit: '1 Filet',
  },
  {
    id: 'kabeljau', name: 'Kabeljau / Seelachs', emoji: '🐟', category: 'fisch', fromWeek: 3, allergens: ['fisch'],
    brei: 'Grätenfrei dünsten und pürieren.',
    finger: 'Gedünstet in Flocken, auf Gräten prüfen.',
    chokingRisk: 'mittel', hint: 'Gräten sorgfältig entfernen.',
    shopUnit: '1 Filet',
  },

  // ---------- Getreide: Abend- und Nachmittagsbrei ----------
  {
    id: 'hafer', name: 'Haferflocken (zart)', emoji: '🌾', category: 'getreide', fromWeek: 4, allergens: ['gluten'], ironRich: true,
    brei: 'Zarte Flocken oder Schmelzflocken mit Milch bzw. Wasser aufkochen und quellen lassen.',
    finger: 'Als kleine, weiche Haferpfannkuchen oder Porridge-Finger.',
    chokingRisk: 'niedrig', shopUnit: '500 g',
  },
  {
    id: 'hirse', name: 'Hirseflocken', emoji: '🌾', category: 'getreide', fromWeek: 4, allergens: [], ironRich: true,
    brei: 'Mit Wasser oder Milch aufkochen, quellen lassen.',
    finger: 'Zu weichen Bratlingen verarbeiten.',
    chokingRisk: 'niedrig', shopUnit: '500 g',
  },
  {
    id: 'dinkel', name: 'Dinkel / Weizen', emoji: '🍞', category: 'getreide', fromWeek: 4, allergens: ['gluten'],
    brei: 'Vollkorn-Grieß oder -Flocken aufkochen.',
    finger: 'Weiche Vollkornnudeln oder getoastetes Brot in Streifen.',
    chokingRisk: 'niedrig', shopUnit: '1 Packung',
  },
  {
    id: 'reis', name: 'Reis', emoji: '🍚', category: 'getreide', fromWeek: 2, allergens: [],
    brei: 'Weich kochen und unter Gemüse pürieren.',
    finger: 'Sehr weich gekocht zu kleinen Bällchen formen.',
    chokingRisk: 'niedrig',
    hint: 'Reis kann Arsen enthalten: abwechseln, keine Reiswaffeln als Dauersnack, keine Reisdrinks.',
    shopUnit: '500 g',
  },

  // ---------- Milch ----------
  {
    id: 'vollmilch', name: 'Vollmilch (im Brei)', emoji: '🥛', category: 'milch', fromWeek: 4, allergens: ['milch'],
    brei: 'Pasteurisierte Vollmilch für den Milch-Getreide-Brei verwenden.',
    finger: 'Nur verarbeitet, z. B. in Pfannkuchen.',
    chokingRisk: 'niedrig',
    hint: 'Im ersten Jahr nicht als Getränk und nie als Rohmilch.',
    shopUnit: '1 Liter',
  },
  {
    id: 'joghurt', name: 'Naturjoghurt', emoji: '🥣', category: 'milch', fromWeek: 5, allergens: ['milch'],
    brei: 'Ungesüßt, mit Obstbrei mischen.',
    finger: 'Als Dip zu weichen Gemüsesticks.',
    chokingRisk: 'niedrig', shopUnit: '1 Becher',
  },

  // ---------- Ei (S3: durcherhitzt, regelmäßig) ----------
  {
    id: 'ei', name: 'Hühnerei (durcherhitzt)', emoji: '🥚', category: 'ei', fromWeek: 3, allergens: ['ei'],
    brei: 'Hart gekocht (ca. 10 Minuten), fein zerdrückt unter den Brei mischen.',
    finger: 'Hart gekocht in Vierteln oder als durchgebackenes Omelett in Streifen.',
    chokingRisk: 'niedrig',
    hint: 'Nur vollständig durcherhitzt – kein rohes oder weiches Ei, kein cremiges Rührei.',
    shopUnit: '6 Stück',
  },

  // ---------- Obst: Nachmittagsbrei ----------
  {
    id: 'apfel', name: 'Apfel', emoji: '🍎', category: 'obst', fromWeek: 4, allergens: [],
    brei: 'Schälen, dünsten und pürieren oder sehr fein reiben.',
    finger: 'Gedünstet in Spalten – roh nur fein gerieben.',
    chokingRisk: 'hoch', hint: 'Rohe Apfelstücke sind zu hart.', shopUnit: '3 Stück',
  },
  {
    id: 'birne', name: 'Birne', emoji: '🍐', category: 'obst', fromWeek: 4, allergens: [],
    brei: 'Reif schälen und zerdrücken oder dünsten.',
    finger: 'Sehr reif in Spalten, sonst kurz dünsten.',
    chokingRisk: 'mittel', shopUnit: '2 Stück',
  },
  {
    id: 'banane', name: 'Banane', emoji: '🍌', category: 'obst', fromWeek: 4, allergens: [],
    brei: 'Reif mit der Gabel zerdrücken.',
    finger: 'Halbieren und zur Hälfte schälen – die Schale dient als Griff.',
    chokingRisk: 'niedrig', shopUnit: '3 Stück',
  },
  {
    id: 'avocado', name: 'Avocado', emoji: '🥑', category: 'obst', fromWeek: 1, allergens: [],
    brei: 'Reif zerdrücken.',
    finger: 'In breiten Spalten, eventuell in Haferflocken wälzen für besseren Griff.',
    chokingRisk: 'niedrig', shopUnit: '1 Stück',
  },
  {
    id: 'heidelbeere', name: 'Heidelbeeren', emoji: '🫐', category: 'obst', fromWeek: 5, allergens: [],
    brei: 'Pürieren oder zerdrücken.',
    finger: 'Flach zerdrücken – nie ganz geben.',
    chokingRisk: 'hoch', hint: 'Runde Beeren immer zerdrücken.', shopUnit: '1 Schale',
    season: [6, 7, 8, 9],
  },
  {
    id: 'weintraube', name: 'Weintrauben', emoji: '🍇', category: 'obst', fromWeek: 6, allergens: [],
    brei: 'Kernlos schälen und pürieren.',
    finger: 'Längs vierteln.',
    chokingRisk: 'hoch', hint: 'Ganze Trauben sind eine häufige Verschluckursache: immer längs vierteln.',
    shopUnit: '1 Schale',
  },
  {
    id: 'mango', name: 'Mango', emoji: '🥭', category: 'obst', fromWeek: 5, allergens: [],
    brei: 'Reif pürieren.',
    finger: 'Den Kern mit etwas Fruchtfleisch zum Abnagen anbieten oder breite Streifen.',
    chokingRisk: 'niedrig', shopUnit: '1 Stück',
  },

  // ---------- Hülsenfrüchte und Soja ----------
  {
    id: 'linsen', name: 'Rote Linsen', emoji: '🫘', category: 'huelsenfruechte', fromWeek: 3, allergens: [], ironRich: true,
    brei: 'Sehr weich kochen, sie zerfallen von selbst. Unter Gemüsebrei mischen.',
    finger: 'Zu weichen Linsenbratlingen formen.',
    chokingRisk: 'niedrig', shopUnit: '250 g',
  },
  {
    id: 'kichererbsen', name: 'Kichererbsen', emoji: '🫘', category: 'huelsenfruechte', fromWeek: 4, allergens: [], ironRich: true,
    brei: 'Weich gekocht pürieren (z. B. Hummus ohne Salz).',
    finger: 'Flach zerdrückt oder als Hummus auf Brotstreifen.',
    chokingRisk: 'hoch', hint: 'Nie ganze Kichererbsen geben.', shopUnit: '1 Dose (ohne Salz)',
  },
  {
    id: 'tofu', name: 'Tofu', emoji: '🧊', category: 'huelsenfruechte', fromWeek: 4, allergens: ['soja'],
    brei: 'Seidentofu glatt unter Gemüse rühren.',
    finger: 'Fester Tofu in fingerlangen Stücken, kurz gebraten.',
    chokingRisk: 'niedrig', shopUnit: '1 Packung',
  },

  // ---------- Nüsse und Samen (nur als Mus) ----------
  {
    id: 'erdnuss', name: 'Erdnussmus (100 %)', emoji: '🥜', category: 'nuesse_samen', fromWeek: 4, allergens: ['erdnuss'],
    brei: 'Eine kleine Menge glattes Mus in warmen Brei einrühren.',
    finger: 'Sehr dünn auf Brotstreifen streichen.',
    chokingRisk: 'hoch',
    hint: 'Nur als glattes Mus, nie ganze oder gehackte Nüsse. Bei mittelschwerer bis schwerer Neurodermitis vorher ärztlich abklären.',
    shopUnit: '1 Glas',
  },
  {
    id: 'mandel', name: 'Mandelmus', emoji: '🌰', category: 'nuesse_samen', fromWeek: 5, allergens: ['baumnuss'],
    brei: 'Eine kleine Menge in Getreide-Obst-Brei rühren.',
    finger: 'Dünn auf Brot streichen.',
    chokingRisk: 'hoch', hint: 'Nur als Mus, nie ganze Mandeln.', shopUnit: '1 Glas',
  },
  {
    id: 'sesam', name: 'Sesammus (Tahin)', emoji: '🌱', category: 'nuesse_samen', fromWeek: 5, allergens: ['sesam'],
    brei: 'Etwas Tahin unter Gemüse- oder Getreidebrei rühren.',
    finger: 'Dünn auf Brot oder als Hummus-Zutat.',
    chokingRisk: 'mittel', shopUnit: '1 Glas',
  },
];

/** Basis + Erweiterung (insgesamt ca. 100 Lebensmittel). */
FOODS.push(...FOODS_EXTRA);

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

export const CATEGORY_LABEL: Record<Food['category'], string> = tr({
  gemuese: 'Gemüse',
  obst: 'Obst',
  getreide: 'Getreide',
  fleisch: 'Fleisch',
  fisch: 'Fisch',
  milch: 'Milchprodukte',
  ei: 'Ei',
  huelsenfruechte: 'Hülsenfrüchte & Soja',
  nuesse_samen: 'Nüsse & Samen',
  fett: 'Fette & Öle',
});

export const ALLERGEN_LABEL: Record<string, string> = tr({
  ei: 'Ei',
  milch: 'Milch',
  erdnuss: 'Erdnuss',
  baumnuss: 'Baumnüsse',
  fisch: 'Fisch',
  gluten: 'Gluten',
  soja: 'Soja',
  sesam: 'Sesam',
  sellerie: 'Sellerie',
  senf: 'Senf',
});
