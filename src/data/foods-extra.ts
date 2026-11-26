import type { Food } from '@/domain/types';

/**
 * Erweiterung der Lebensmittel-Datenbank (63 Einträge) – eigene Formulierungen.
 * Vor dem Launch fachlich prüfen lassen.
 */
export const FOODS_EXTRA: Food[] = [
  // ---------- Gemüse ----------
  {
    id: 'kohlrabi', name: 'Kohlrabi', emoji: '🥬', category: 'gemuese', fromWeek: 1, allergens: [],
    brei: 'Schälen, würfeln, weich dämpfen und pürieren.',
    finger: 'In dicke Stifte schneiden und weich dämpfen.',
    chokingRisk: 'hoch', hint: 'Roh zu hart – nur weich gegart geben.', shopUnit: '1 Knolle',
  },
  {
    id: 'petersilienwurzel', name: 'Petersilienwurzel', emoji: '🥕', category: 'gemuese', fromWeek: 1, allergens: [],
    brei: 'Schälen, in Scheiben weich dämpfen, pürieren. Mild-würzig.',
    finger: 'Längs in dicke Stifte schneiden und weich garen.',
    chokingRisk: 'hoch', hint: 'Nie roh geben.', shopUnit: '2 Stück',
  },
  {
    id: 'steckruebe', name: 'Steckrübe', emoji: '🟠', category: 'gemuese', fromWeek: 2, allergens: [],
    brei: 'Schälen, würfeln, weich kochen und pürieren.',
    finger: 'Dicke Spalten im Ofen weich garen.',
    chokingRisk: 'mittel', shopUnit: '½ Rübe',
  },
  {
    id: 'gruene_bohnen', name: 'Grüne Bohnen', emoji: '🫛', category: 'gemuese', fromWeek: 2, allergens: [],
    brei: 'Enden abschneiden, mindestens 10 Minuten weich kochen, pürieren.',
    finger: 'Ganze Bohnen sehr weich gekocht als Fingerfood.',
    chokingRisk: 'mittel', hint: 'Roh giftig – immer vollständig durchgaren.', shopUnit: '250 g',
  },
  {
    id: 'spargel', name: 'Spargel', emoji: '🌱', category: 'gemuese', fromWeek: 3, allergens: [],
    brei: 'Schälen, holzige Enden entfernen, weich kochen und fein pürieren.',
    finger: 'Weiche Spitzen als Fingerfood.',
    chokingRisk: 'mittel', shopUnit: '250 g', season: [4, 5, 6],
  },
  {
    id: 'aubergine', name: 'Aubergine', emoji: '🍆', category: 'gemuese', fromWeek: 3, allergens: [],
    brei: 'Im Ofen weich garen, Fruchtfleisch auslöffeln und pürieren.',
    finger: 'Dicke Streifen mit Schale weich backen.',
    chokingRisk: 'niedrig', shopUnit: '1 Stück',
  },
  {
    id: 'paprika', name: 'Paprika (gegart)', emoji: '🫑', category: 'gemuese', fromWeek: 3, allergens: [],
    brei: 'Im Ofen garen, Haut abziehen und pürieren.',
    finger: 'Geröstet und gehäutet in breiten Streifen.',
    chokingRisk: 'mittel', hint: 'Rohe Paprika und Haut sind schwer zu kauen.', shopUnit: '1 Stück',
  },
  {
    id: 'tomate', name: 'Tomate', emoji: '🍅', category: 'gemuese', fromWeek: 4, allergens: [],
    brei: 'Gehäutet und gekocht als Soße unter Nudeln oder Gemüse.',
    finger: 'Große Tomaten in Spalten; Kirschtomaten immer vierteln.',
    chokingRisk: 'hoch', hint: 'Ganze Kirschtomaten sind eine Verschluckgefahr.', shopUnit: '3 Stück',
  },
  {
    id: 'gurke', name: 'Gurke', emoji: '🥒', category: 'gemuese', fromWeek: 4, allergens: [],
    brei: 'Geschält fein reiben und unter Joghurt oder Brei rühren.',
    finger: 'Geschält in langen, dicken Stücken zum Abknabbern.',
    chokingRisk: 'mittel', shopUnit: '1 Stück',
  },
  {
    id: 'lauch', name: 'Lauch', emoji: '🧅', category: 'gemuese', fromWeek: 4, allergens: [],
    brei: 'Fein schneiden, weich dünsten, unter Gemüsebrei mischen.',
    finger: 'Weich geschmort in kleinen Mengen unter andere Speisen.',
    chokingRisk: 'mittel', shopUnit: '1 Stange',
  },
  {
    id: 'rosenkohl', name: 'Rosenkohl', emoji: '🥬', category: 'gemuese', fromWeek: 4, allergens: [],
    brei: 'Weich kochen, fein pürieren. Kann blähen – anfangs kleine Mengen.',
    finger: 'Weich gekocht halbiert und flach gedrückt.',
    chokingRisk: 'mittel', shopUnit: '250 g', season: [10, 11, 12, 1, 2],
  },
  {
    id: 'gruenkohl', name: 'Grünkohl', emoji: '🥬', category: 'gemuese', fromWeek: 5, allergens: [],
    brei: 'Blätter ohne Stiele weich kochen und fein pürieren.',
    finger: 'Fein gehackt in Bratlinge oder Omelett einbacken.',
    chokingRisk: 'niedrig', shopUnit: '250 g', season: [11, 12, 1, 2],
  },
  {
    id: 'wirsing', name: 'Wirsing', emoji: '🥬', category: 'gemuese', fromWeek: 5, allergens: [],
    brei: 'Blätter ohne Strunk weich dünsten, pürieren.',
    finger: 'Fein geschnitten und weich geschmort unter Kartoffelstampf.',
    chokingRisk: 'niedrig', shopUnit: '½ Kopf',
  },
  {
    id: 'mangold', name: 'Mangold', emoji: '🥬', category: 'gemuese', fromWeek: 4, allergens: [], ironRich: true,
    brei: 'Kurz dünsten und unter Gemüsebrei mischen.',
    finger: 'Fein gehackt in Pfannkuchen oder Omelett einbacken.',
    chokingRisk: 'niedrig', hint: 'Nitrathaltig: frisch zubereiten, Reste rasch kühlen, höchstens einmal aufwärmen.',
    shopUnit: '1 Bund',
  },
  {
    id: 'rote_bete', name: 'Rote Bete', emoji: '🟣', category: 'gemuese', fromWeek: 4, allergens: [],
    brei: 'Gekocht (auch vakuumiert, ungewürzt) pürieren, gut mit Kartoffel.',
    finger: 'Weich gegart in dicken Spalten.',
    chokingRisk: 'mittel', hint: 'Nitrathaltig: nicht täglich. Roter Urin oder Stuhl danach ist harmlos.',
    shopUnit: '2 Knollen',
  },
  {
    id: 'champignons', name: 'Champignons', emoji: '🍄', category: 'gemuese', fromWeek: 6, allergens: [],
    brei: 'Gut durchgegart und fein gehackt unter Gemüse- oder Nudelbrei.',
    finger: 'Große Pilze in Scheiben weich gebraten.',
    chokingRisk: 'mittel', hint: 'Pilze nur vollständig gegart geben, keine Wildpilze.', shopUnit: '250 g',
  },
  {
    id: 'sellerie', name: 'Knollensellerie', emoji: '🥔', category: 'gemuese', fromWeek: 6, allergens: ['sellerie'],
    brei: 'Schälen, würfeln, weich kochen, mit Kartoffel pürieren.',
    finger: 'Weich gekochte Stifte.',
    chokingRisk: 'mittel', shopUnit: '½ Knolle',
  },
  {
    id: 'mais', name: 'Mais', emoji: '🌽', category: 'gemuese', fromWeek: 6, allergens: [],
    brei: 'Körner weich kochen, pürieren und durch ein Sieb streichen.',
    finger: 'Weich gekochter Kolben zum Abknabbern; lose Körner nur zerdrückt.',
    chokingRisk: 'hoch', hint: 'Ganze Maiskörner und Popcorn nicht geben.', shopUnit: '1 Dose (ohne Salz)',
  },

  // ---------- Obst ----------
  {
    id: 'pfirsich', name: 'Pfirsich / Nektarine', emoji: '🍑', category: 'obst', fromWeek: 5, allergens: [],
    brei: 'Reif schälen und pürieren.',
    finger: 'Sehr reif in breiten Spalten, Stein entfernen.',
    chokingRisk: 'mittel', shopUnit: '3 Stück', season: [7, 8, 9],
  },
  {
    id: 'aprikose', name: 'Aprikose', emoji: '🍑', category: 'obst', fromWeek: 5, allergens: [],
    brei: 'Entsteinen, kurz dünsten und pürieren.',
    finger: 'Reif halbiert und entsteint.',
    chokingRisk: 'mittel', shopUnit: '4 Stück', season: [6, 7, 8],
  },
  {
    id: 'pflaume', name: 'Pflaume', emoji: '🫐', category: 'obst', fromWeek: 5, allergens: [],
    brei: 'Entsteinen, dünsten und pürieren. Kann bei hartem Stuhl helfen.',
    finger: 'Reif halbiert, entsteint, Haut eventuell abziehen.',
    chokingRisk: 'mittel', shopUnit: '250 g', season: [8, 9, 10],
  },
  {
    id: 'melone', name: 'Honigmelone', emoji: '🍈', category: 'obst', fromWeek: 6, allergens: [],
    brei: 'Reif pürieren.',
    finger: 'In langen, weichen Streifen ohne Schale.',
    chokingRisk: 'niedrig', shopUnit: '½ Melone', season: [6, 7, 8, 9],
  },
  {
    id: 'wassermelone', name: 'Wassermelone', emoji: '🍉', category: 'obst', fromWeek: 6, allergens: [],
    brei: 'Entkernen und pürieren.',
    finger: 'Entkernt in dicken Stäbchen.',
    chokingRisk: 'niedrig', shopUnit: '1 Stück', season: [6, 7, 8],
  },
  {
    id: 'erdbeere', name: 'Erdbeere', emoji: '🍓', category: 'obst', fromWeek: 6, allergens: [],
    brei: 'Zerdrücken oder pürieren.',
    finger: 'Große Beeren ganz zum Abbeißen, kleine längs vierteln.',
    chokingRisk: 'mittel', hint: 'Rötungen um den Mund sind häufig harmlos (Säure) – bei Quaddeln am Körper ärztlich abklären.',
    shopUnit: '1 Schale', season: [5, 6, 7],
  },
  {
    id: 'himbeere', name: 'Himbeere', emoji: '🫐', category: 'obst', fromWeek: 6, allergens: [],
    brei: 'Pürieren und eventuell durch ein Sieb streichen (Kerne).',
    finger: 'Weich und leicht zerdrückt.',
    chokingRisk: 'niedrig', shopUnit: '1 Schale', season: [6, 7, 8],
  },
  {
    id: 'kiwi', name: 'Kiwi', emoji: '🥝', category: 'obst', fromWeek: 7, allergens: [],
    brei: 'Reif auslöffeln, unter Getreidebrei mischen.',
    finger: 'Geschält in Spalten.',
    chokingRisk: 'niedrig', hint: 'Säuerlich, kann den Po wund machen – anfangs kleine Mengen.', shopUnit: '2 Stück',
  },
  {
    id: 'orange', name: 'Orange', emoji: '🍊', category: 'obst', fromWeek: 7, allergens: [],
    brei: 'Filetiert ohne Häutchen unter Getreidebrei – Vitamin C hilft bei der Eisenaufnahme.',
    finger: 'Filets ohne Häutchen und Kerne, in Stücke geteilt.',
    chokingRisk: 'mittel', shopUnit: '2 Stück',
  },
  {
    id: 'mandarine', name: 'Mandarine', emoji: '🍊', category: 'obst', fromWeek: 7, allergens: [],
    brei: 'Filetiert unter Brei mischen.',
    finger: 'Schnitze ohne Kerne längs halbieren.',
    chokingRisk: 'mittel', shopUnit: '4 Stück', season: [11, 12, 1, 2],
  },
  {
    id: 'ananas', name: 'Ananas', emoji: '🍍', category: 'obst', fromWeek: 8, allergens: [],
    brei: 'Reif fein pürieren, faserigen Strunk entfernen.',
    finger: 'Reif in langen Stücken ohne Strunk.',
    chokingRisk: 'mittel', hint: 'Faserig und säuerlich – kleine Mengen.', shopUnit: '½ Frucht',
  },
  {
    id: 'kirsche', name: 'Kirsche', emoji: '🍒', category: 'obst', fromWeek: 8, allergens: [],
    brei: 'Entsteinen und pürieren.',
    finger: 'Entsteint und geviertelt.',
    chokingRisk: 'hoch', hint: 'Immer entsteinen und vierteln.', shopUnit: '250 g', season: [6, 7],
  },
  {
    id: 'papaya', name: 'Papaya', emoji: '🥭', category: 'obst', fromWeek: 6, allergens: [],
    brei: 'Reif auslöffeln und pürieren.',
    finger: 'Reif in breiten Streifen.',
    chokingRisk: 'niedrig', shopUnit: '1 Stück',
  },
  {
    id: 'feige', name: 'Feige (frisch)', emoji: '🟤', category: 'obst', fromWeek: 8, allergens: [],
    brei: 'Reif zerdrücken.',
    finger: 'Reif geviertelt.',
    chokingRisk: 'niedrig', hint: 'Frische statt getrockneter Feigen – getrocknet sehr süß und zäh.', shopUnit: '3 Stück',
  },

  // ---------- Getreide ----------
  {
    id: 'quinoa', name: 'Quinoa', emoji: '🌾', category: 'getreide', fromWeek: 5, allergens: [], ironRich: true,
    brei: 'Gründlich waschen, sehr weich kochen und unter Gemüse pürieren.',
    finger: 'Zu weichen Bratlingen formen.',
    chokingRisk: 'niedrig', shopUnit: '250 g',
  },
  {
    id: 'amaranth', name: 'Amaranth', emoji: '🌾', category: 'getreide', fromWeek: 6, allergens: [], ironRich: true,
    brei: 'Gepufft in Milchbrei oder gekocht unter Gemüse.',
    finger: 'Gekocht in Bratlinge mischen.',
    chokingRisk: 'niedrig', shopUnit: '250 g',
  },
  {
    id: 'buchweizen', name: 'Buchweizen', emoji: '🌾', category: 'getreide', fromWeek: 6, allergens: [],
    brei: 'Flocken oder Grieß mit Wasser oder Milch aufkochen.',
    finger: 'Als weiche Pfannkuchen.',
    chokingRisk: 'niedrig', shopUnit: '250 g',
  },
  {
    id: 'polenta', name: 'Polenta (Maisgrieß)', emoji: '🌽', category: 'getreide', fromWeek: 6, allergens: [],
    brei: 'Weich kochen, mit Gemüse mischen.',
    finger: 'Abgekühlt in Sticks schneiden und kurz anbraten.',
    chokingRisk: 'niedrig', shopUnit: '250 g',
  },
  {
    id: 'gerste', name: 'Gerste (Graupen)', emoji: '🌾', category: 'getreide', fromWeek: 6, allergens: ['gluten'],
    brei: 'Feine Graupen sehr weich kochen und pürieren.',
    finger: 'Weich gekocht unter Gemüse.',
    chokingRisk: 'niedrig', shopUnit: '250 g',
  },
  {
    id: 'nudeln', name: 'Vollkornnudeln', emoji: '🍝', category: 'getreide', fromWeek: 6, allergens: ['gluten'],
    brei: 'Sehr weich kochen und mit Gemüsesoße zerdrücken.',
    finger: 'Große Formen wie Penne oder Fusilli weich gekocht.',
    chokingRisk: 'niedrig', shopUnit: '500 g',
  },
  {
    id: 'couscous', name: 'Couscous', emoji: '🌾', category: 'getreide', fromWeek: 7, allergens: ['gluten'],
    brei: 'Mit heißem Wasser quellen lassen und unter Gemüse mischen.',
    finger: 'Mit Gemüse zu Bällchen formen.',
    chokingRisk: 'niedrig', shopUnit: '250 g',
  },
  {
    id: 'brot', name: 'Vollkornbrot (fein)', emoji: '🍞', category: 'getreide', fromWeek: 8, allergens: ['gluten'],
    brei: 'Eingeweicht unter Brei – meist eher als Fingerfood.',
    finger: 'Fein gemahlenes Brot ohne ganze Körner, leicht getoastet in Streifen, dünn bestrichen.',
    chokingRisk: 'mittel', hint: 'Brot enthält Salz – in Maßen. Keine ganzen Körner oder harten Krusten.',
    shopUnit: '1 Laib',
  },
  {
    id: 'roggen', name: 'Roggenflocken', emoji: '🌾', category: 'getreide', fromWeek: 8, allergens: ['gluten'],
    brei: 'Zarte Flocken mit Milch oder Wasser aufkochen.',
    finger: 'In Pfannkuchenteig einarbeiten.',
    chokingRisk: 'niedrig', shopUnit: '500 g',
  },

  // ---------- Fleisch ----------
  {
    id: 'pute', name: 'Pute', emoji: '🍗', category: 'fleisch', fromWeek: 4, allergens: [], ironRich: true,
    brei: 'Durchgaren und fein pürieren.',
    finger: 'Als weiche Bällchen ohne Salz oder lange Fasern geschmort.',
    chokingRisk: 'mittel', hint: 'Immer vollständig durchgaren.', shopUnit: '150 g',
  },
  {
    id: 'lamm', name: 'Lamm', emoji: '🥩', category: 'fleisch', fromWeek: 6, allergens: [], ironRich: true,
    brei: 'Mageres Fleisch schmoren und fein pürieren.',
    finger: 'Weich geschmort in langen Fasern.',
    chokingRisk: 'mittel', hint: 'Immer vollständig durchgaren.', shopUnit: '150 g',
  },
  {
    id: 'schwein', name: 'Schweinefleisch (mager)', emoji: '🥩', category: 'fleisch', fromWeek: 6, allergens: [], ironRich: true,
    brei: 'Mageres Filet durchgaren und pürieren.',
    finger: 'Weich geschmort in Fasern; keine Wurst oder Schinken (Salz).',
    chokingRisk: 'mittel', hint: 'Immer vollständig durchgaren; keine Wurstwaren.', shopUnit: '150 g',
  },

  // ---------- Fisch ----------
  {
    id: 'forelle', name: 'Forelle', emoji: '🐟', category: 'fisch', fromWeek: 6, allergens: ['fisch'],
    brei: 'Filet grätenfrei dünsten und pürieren.',
    finger: 'Durchgegart in großen Flocken, auf Gräten prüfen.',
    chokingRisk: 'mittel', hint: 'Gräten sorgfältig entfernen. Kein geräucherter Fisch (Salz).', shopUnit: '1 Filet',
  },
  {
    id: 'scholle', name: 'Scholle', emoji: '🐟', category: 'fisch', fromWeek: 7, allergens: ['fisch'],
    brei: 'Grätenfrei dünsten und pürieren.',
    finger: 'Durchgegart in Flocken.',
    chokingRisk: 'mittel', hint: 'Gräten sorgfältig entfernen.', shopUnit: '1 Filet',
  },
  {
    id: 'makrele', name: 'Makrele (frisch)', emoji: '🐟', category: 'fisch', fromWeek: 8, allergens: ['fisch'],
    brei: 'Frisch gegart, grätenfrei pürieren – fettreich mit Omega-3.',
    finger: 'Durchgegart in Flocken.',
    chokingRisk: 'mittel', hint: 'Nur frisch, nicht geräuchert (Salz). Gräten entfernen.', shopUnit: '1 Filet',
  },

  // ---------- Milchprodukte ----------
  {
    id: 'frischkaese', name: 'Frischkäse (natur)', emoji: '🧀', category: 'milch', fromWeek: 8, allergens: ['milch'],
    brei: 'Ein wenig unter Gemüsebrei rühren.',
    finger: 'Dünn auf Brotstreifen.',
    chokingRisk: 'niedrig', hint: 'Aus pasteurisierter Milch, ohne Kräuter- oder Salzzusatz.', shopUnit: '1 Becher',
  },
  {
    id: 'ricotta', name: 'Ricotta', emoji: '🧀', category: 'milch', fromWeek: 8, allergens: ['milch'],
    brei: 'Unter Obst- oder Gemüsebrei mischen.',
    finger: 'In Pfannkuchen oder Nudeln.',
    chokingRisk: 'niedrig', shopUnit: '1 Becher',
  },
  {
    id: 'mozzarella', name: 'Mozzarella', emoji: '🧀', category: 'milch', fromWeek: 9, allergens: ['milch'],
    brei: 'Klein gezupft unter warme Nudeln oder Gemüse.',
    finger: 'In dünnen Streifen, nicht in runden Bällchen.',
    chokingRisk: 'mittel', hint: 'Mini-Mozzarella-Kugeln vierteln.', shopUnit: '1 Kugel',
  },
  {
    id: 'quark', name: 'Quark', emoji: '🥣', category: 'milch', fromWeek: 10, allergens: ['milch'],
    brei: 'In kleinen Mengen mit Obstbrei mischen.',
    finger: 'Als Dip.',
    chokingRisk: 'niedrig',
    hint: 'Sehr eiweißreich – nur kleine Mengen. Milchprodukte insgesamt bis etwa 200 ml am Tag.',
    shopUnit: '1 Becher',
  },

  // ---------- Hülsenfrüchte ----------
  {
    id: 'braune_linsen', name: 'Braune Linsen', emoji: '🫘', category: 'huelsenfruechte', fromWeek: 6, allergens: [], ironRich: true,
    brei: 'Sehr weich kochen und pürieren.',
    finger: 'Weich gekocht und zerdrückt, in Bratlingen.',
    chokingRisk: 'niedrig', shopUnit: '250 g',
  },
  {
    id: 'weisse_bohnen', name: 'Weiße Bohnen', emoji: '🫘', category: 'huelsenfruechte', fromWeek: 6, allergens: [], ironRich: true,
    brei: 'Aus der Dose (ohne Salz) gut abspülen und pürieren.',
    finger: 'Flach zerdrückt.',
    chokingRisk: 'hoch', hint: 'Nie ganz geben – immer zerdrücken.', shopUnit: '1 Dose (ohne Salz)',
  },
  {
    id: 'kidneybohnen', name: 'Kidneybohnen', emoji: '🫘', category: 'huelsenfruechte', fromWeek: 8, allergens: [], ironRich: true,
    brei: 'Aus der Dose abgespült pürieren.',
    finger: 'Flach zerdrückt, Haut eventuell entfernen.',
    chokingRisk: 'hoch', hint: 'Rohe Bohnen sind giftig – nur aus der Dose oder vollständig gekocht. Immer zerdrücken.',
    shopUnit: '1 Dose (ohne Salz)',
  },
  {
    id: 'edamame', name: 'Edamame', emoji: '🫛', category: 'huelsenfruechte', fromWeek: 8, allergens: ['soja'],
    brei: 'Ausgelöst weich kochen und pürieren.',
    finger: 'Weich gekocht und flach zerdrückt.',
    chokingRisk: 'hoch', hint: 'Nie ganze Bohnen geben.', shopUnit: '1 Packung TK',
  },

  // ---------- Nüsse und Samen (nur gemahlen oder als Mus) ----------
  {
    id: 'cashew', name: 'Cashewmus', emoji: '🥜', category: 'nuesse_samen', fromWeek: 7, allergens: ['baumnuss'],
    brei: 'Eine kleine Menge in warmen Brei rühren.',
    finger: 'Dünn auf Brot oder Pfannkuchen.',
    chokingRisk: 'hoch', hint: 'Nur als Mus, nie ganze Nüsse.', shopUnit: '1 Glas',
  },
  {
    id: 'haselnuss', name: 'Haselnussmus', emoji: '🌰', category: 'nuesse_samen', fromWeek: 8, allergens: ['baumnuss'],
    brei: 'Eine kleine Menge in Getreidebrei rühren.',
    finger: 'Dünn auf Brot – kein Nuss-Nougat-Aufstrich (Zucker).',
    chokingRisk: 'hoch', hint: 'Nur als Mus, nie ganze Nüsse.', shopUnit: '1 Glas',
  },
  {
    id: 'walnuss', name: 'Walnüsse (fein gemahlen)', emoji: '🌰', category: 'nuesse_samen', fromWeek: 9, allergens: ['baumnuss'],
    brei: 'Fein gemahlen in Getreide-Obst-Brei rühren.',
    finger: 'Gemahlen in Pfannkuchen oder Bratlinge einbacken.',
    chokingRisk: 'hoch', hint: 'Nur sehr fein gemahlen, nie Stücke.', shopUnit: '1 Packung',
  },
  {
    id: 'kuerbiskerne', name: 'Kürbiskerne (gemahlen)', emoji: '🎃', category: 'nuesse_samen', fromWeek: 7, allergens: [], ironRich: true,
    brei: 'Fein gemahlen in den Brei rühren.',
    finger: 'Gemahlen über weiches Gemüse streuen.',
    chokingRisk: 'hoch', hint: 'Nie ganze Kerne.', shopUnit: '1 Packung',
  },
  {
    id: 'leinsamen', name: 'Leinsamen (geschrotet)', emoji: '🌱', category: 'nuesse_samen', fromWeek: 7, allergens: [],
    brei: 'Eine Prise geschrotet in den Getreidebrei rühren.',
    finger: 'In Pfannkuchenteig.',
    chokingRisk: 'niedrig', hint: 'Mit ausreichend Flüssigkeit – Leinsamen quellen.', shopUnit: '1 Packung',
  },
  {
    id: 'chia', name: 'Chiasamen (gequollen)', emoji: '🌱', category: 'nuesse_samen', fromWeek: 10, allergens: [],
    brei: 'Vorher mindestens 15 Minuten in Flüssigkeit quellen lassen, dann unterrühren.',
    finger: 'Nur gequollen als Pudding.',
    chokingRisk: 'mittel', hint: 'Nie trocken geben – Chiasamen quellen stark auf.', shopUnit: '1 Packung',
  },

  // ---------- Fette ----------
  {
    id: 'olivenoel', name: 'Olivenöl', emoji: '🫒', category: 'fett', fromWeek: 4, allergens: [],
    brei: 'Etwas unter den fertigen Gemüsebrei rühren (im Wechsel mit Rapsöl).',
    finger: 'Zum Garen von Gemüse.',
    chokingRisk: 'niedrig', shopUnit: '1 Flasche',
  },
  {
    id: 'leinoel', name: 'Leinöl', emoji: '🫗', category: 'fett', fromWeek: 8, allergens: [],
    brei: 'Ein paar Tropfen unter den fertigen, nicht mehr kochenden Brei.',
    finger: 'Nicht erhitzen.',
    chokingRisk: 'niedrig', hint: 'Nicht erhitzen, kühl lagern, rasch verbrauchen.', shopUnit: '1 kleine Flasche',
  },
];
