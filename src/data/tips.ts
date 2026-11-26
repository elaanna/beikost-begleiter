
import { tr } from '@/i18n';/**
 * Tipps des Tages – allgemeine, alltagspraktische Hinweise aus den Quellen der App
 * (Netzwerk Gesund ins Leben, S3-Leitlinien, NHS, BZgA). Keine individuellen Empfehlungen.
 */
export type TipPhase = 'vorStart' | 'start' | 'laeuft' | 'familie' | 'immer';

export interface Tip {
  id: string;
  emoji: string;
  title: string;
  text: string;
  phase: TipPhase;
  /** Nur in diesen Monaten zeigen (1–12). */
  months?: number[];
  link?: { label: string; href: string };
}

export const TIPS: Tip[] = tr([
  // Vor dem Start
  { id: 'v1', phase: 'vorStart', emoji: '🪑', title: 'Hochstuhl ausprobieren', text: 'Lass dein Baby schon vor dem ersten Brei ein paar Minuten am Familientisch sitzen. So wird Essen etwas Gemeinsames.' },
  { id: 'v2', phase: 'vorStart', emoji: '🥄', title: 'Weiche Löffel', text: 'Ein flacher, weicher Babylöffel ist angenehmer im Mund. Mehr brauchst du am Anfang nicht.' },
  { id: 'v3', phase: 'vorStart', emoji: '❄️', title: 'Vorkochen spart Zeit', text: 'Gemüsebrei lässt sich gut portionsweise einfrieren – eine Eiswürfelform reicht für die ersten Wochen.', link: { label: 'Vorrat & Gefrierfach', href: '/vorrat' } },
  { id: 'v4', phase: 'vorStart', emoji: '🆘', title: 'Würgen ist normal', text: 'Würgen schützt vor dem Verschlucken und gehört zum Lernen. Lies vorab, woran du echtes Verschlucken erkennst.', link: { label: 'Würgen oder Verschlucken?', href: '/wissen?section=sicherheit' } },
  // Erste Wochen
  { id: 's1', phase: 'start', emoji: '⏰', title: 'Die richtige Tageszeit', text: 'Neues am besten mittags anbieten – dann hast du den Rest des Tages im Blick.' },
  { id: 's2', phase: 'start', emoji: '😊', title: 'Geduld zahlt sich aus', text: 'Viele Babys brauchen 8–10 Versuche, bis sie ein neues Lebensmittel mögen. Ein verzogenes Gesicht heißt oft nur: neu.' },
  { id: 's3', phase: 'start', emoji: '🍼', title: 'Milch läuft weiter', text: 'Anfangs sind ein paar Löffel genug. Den Rest der Mahlzeit trinkt dein Baby wie gewohnt Milch.' },
  { id: 's4', phase: 'start', emoji: '🌡️', title: 'Lauwarm, nicht heiß', text: 'Brei nach dem Erwärmen gut umrühren und an der Innenseite des Handgelenks prüfen.' },
  { id: 's5', phase: 'start', emoji: '🧈', title: 'Das Öl nicht vergessen', text: 'Ein Esslöffel Rapsöl im Gemüsebrei liefert wichtige Fettsäuren und hilft bei der Aufnahme von Vitaminen.' },
  // Wenn es läuft
  { id: 'l1', phase: 'laeuft', emoji: '💧', title: 'Wasser zum Brei', text: 'Spätestens mit dem dritten Brei braucht dein Baby zusätzlich etwas zu trinken – am besten Wasser aus dem Becher.', link: { label: 'Mehr zum Trinken', href: '/wissen?section=portionen&topic=trinken' } },
  { id: 'l2', phase: 'laeuft', emoji: '🍊', title: 'Vitamin C zum Mittag', text: 'Ein paar Löffel Obstpüree oder Saft mit Vitamin C im Mittagsbrei verbessern die Eisenaufnahme.' },
  { id: 'l3', phase: 'laeuft', emoji: '✋', title: 'Selbst essen lassen', text: 'Weiche, fingerlange Stücke zum Greifen trainieren die Feinmotorik – auch wenn du sonst Brei fütterst.' },
  { id: 'l4', phase: 'laeuft', emoji: '🔄', title: 'Abwechslung ohne Aufwand', text: 'Tausche einzelne Mahlzeiten gegen Rezepte mit bekannten Zutaten – direkt im Wochenplan.', link: { label: 'Zur Woche', href: '/woche' } },
  { id: 'l5', phase: 'laeuft', emoji: '🥚', title: 'Ei immer durchgaren', text: 'Für Babys Ei nur hart gekocht oder vollständig durchgebacken – kein weiches Ei, kein cremiges Rührei.' },
  { id: 'l6', phase: 'laeuft', emoji: '🧂', title: 'Ohne Salz', text: 'Babynieren vertragen noch kaum Salz. Kräuter wie Petersilie oder Dill bringen Geschmack.' },
  { id: 'l7', phase: 'laeuft', emoji: '🫶', title: 'Hunger und Sattsein', text: 'Dreht dein Baby den Kopf weg oder presst die Lippen zusammen, ist es satt. Du bestimmst das Was, dein Baby das Wie viel.' },
  // Familienessen
  { id: 'f1', phase: 'familie', emoji: '🍽️', title: 'Vor dem Würzen abnehmen', text: 'Nimm die Babyportion ab, bevor gesalzen oder scharf gewürzt wird – so isst ihr fast dasselbe.', link: { label: 'Familienessen umwandeln', href: '/konverter' } },
  { id: 'f2', phase: 'familie', emoji: '👨‍👩‍👧', title: 'Gemeinsam essen', text: 'Kinder lernen durch Zuschauen. Gemeinsame Mahlzeiten ohne Handy und Fernseher helfen mehr als jeder Trick.' },
  { id: 'f3', phase: 'familie', emoji: '🥛', title: 'Becher statt Flasche', text: 'Ab etwa einem Jahr darf Milch aus dem Becher getrunken werden. Die Flasche nach und nach abgewöhnen.' },
  // Immer
  { id: 'i1', phase: 'immer', emoji: '🪑', title: 'Nur im Sitzen', text: 'Essen nur aufrecht sitzend und unter Aufsicht – nie im Liegen, im Auto oder beim Herumlaufen.' },
  { id: 'i2', phase: 'immer', emoji: '🍯', title: 'Kein Honig im ersten Jahr', text: 'Auch nicht erhitzt oder im Gebäck – Honig kann Erreger von Säuglingsbotulismus enthalten.', link: { label: 'Was im ersten Jahr tabu ist', href: '/wissen?section=sicherheit' } },
  { id: 'i3', phase: 'immer', emoji: '🍇', title: 'Runde Sachen vierteln', text: 'Trauben, Kirschtomaten und Heidelbeeren immer vierteln oder zerdrücken.' },
  { id: 'i4', phase: 'immer', emoji: '🧽', title: 'Reste nicht aufheben', text: 'Was vom Löffel übrig bleibt, gehört nicht zurück in den Kühlschrank – Speichel bringt Keime in den Brei.' },
  { id: 'i5', phase: 'immer', emoji: '🥕', title: 'Regional und saisonal', text: 'Saisonales Gemüse schmeckt oft intensiver und ist günstiger. Schau auf die Saison-Karte auf Heute.' },
  // Jahreszeit
  { id: 'j1', phase: 'immer', months: [6, 7, 8], emoji: '☀️', title: 'Hitze', text: 'An heißen Tagen öfter stillen oder Fläschchen anbieten. Mit Beikost zusätzlich Wasser aus dem Becher.' },
  { id: 'j2', phase: 'immer', months: [6, 7, 8, 9], emoji: '🧊', title: 'Unterwegs kühlen', text: 'Brei für unterwegs in einer Kühltasche transportieren und nicht stundenlang warmhalten.' },
  { id: 'j3', phase: 'immer', months: [11, 12, 1, 2], emoji: '🎃', title: 'Wintergemüse', text: 'Pastinake, Kürbis und Karotte sind im Winter gut verfügbar – mild, leicht süß und gut verträglich.' },
  { id: 'j4', phase: 'immer', months: [12], emoji: '🎄', title: 'Plätzchenzeit', text: 'Lebkuchen, Marzipan und Honiggebäck sind fürs Baby tabu. Ein Stück weiche Birne oder Apfel passt besser.' },
  { id: 'j5', phase: 'immer', months: [3, 4, 5], emoji: '🌱', title: 'Frühlingsgemüse', text: 'Frischer Spinat und Kohlrabi sind jetzt da. Spinat für Brei frisch zubereiten und nicht aufwärmen.' },
]);
