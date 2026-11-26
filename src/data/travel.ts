/**
 * Unterwegs-Modus: Packliste, Essen im Restaurant, was ohne Kühlung geht.
 * Quellen: BfR (Vorkochen für mehrere Tage: Kühltasche, 70 °C für 2 Minuten beim Erwärmen, Reste vermeiden),
 * KKH (Gläschen ungeöffnet ungekühlt haltbar; erhitzte Reste nicht weiterverwenden; selbstgekochter Brei 1 Tag im Kühlschrank),
 * Gesund ins Leben / Koletzko 2013 (keine rohen tierischen Lebensmittel, Verschluckgefahr).
 */
export interface PackItem { id: string; text: string; group: 'essen' | 'trinken' | 'sonst' }

export const PACK_ITEMS: PackItem[] = [
  { id: 'loeffel', text: 'Eigener Löffel und Lätzchen', group: 'essen' },
  { id: 'brei', text: 'Brei: ungeöffnetes Gläschen oder Selbstgekochtes in der Kühltasche', group: 'essen' },
  { id: 'kuehltasche', text: 'Kühltasche mit Kühlakku (für Selbstgekochtes)', group: 'essen' },
  { id: 'snack', text: 'Weicher Snack: Banane oder anderes weiches Obst zum Schneiden vor Ort', group: 'essen' },
  { id: 'dose', text: 'Kleine Dose mit Deckel für angefangene Portionen', group: 'essen' },
  { id: 'wasser', text: 'Wasser und offener Becher', group: 'trinken' },
  { id: 'milch', text: 'Milch: Stillen, oder Pulver abgemessen + abgekochtes Wasser getrennt', group: 'trinken' },
  { id: 'tuecher', text: 'Feuchttücher und Spucktuch', group: 'sonst' },
  { id: 'notfall', text: 'Notfallblatt (unter Familie als PDF), falls jemand anderes füttert', group: 'sonst' },
];

export const PACK_GROUP_LABEL: Record<PackItem['group'], string> = { essen: 'Essen', trinken: 'Trinken', sonst: 'Sonstiges' };

export const RESTAURANT_TIPS = [
  'Nach ungesalzenen Beilagen fragen: gedünstetes Gemüse, Kartoffeln, Reis oder Nudeln ohne Soße.',
  'Ab dem Familientisch: Kinderportion vor dem Salzen und Würzen abnehmen lassen – die Küche macht das oft gern.',
  'Nichts Rohes vom Tier: kein rohes oder weiches Ei, kein Rohmilchkäse, Fleisch und Fisch nur durchgegart.',
  'Kein Honig im ersten Jahr – auch nicht in Soßen, Dressings oder Desserts.',
  'Verschluckgefahr beachten: ganze Nüsse, ganze Weintrauben, harte Stücke weglassen oder zerkleinern.',
  'Einen eigenen Löffel und etwas Bekanntes mitnehmen, falls nichts Passendes auf der Karte steht.',
];

export const COOLING_TIPS: { text: string; ok: boolean }[] = [
  { text: 'Ungeöffnete Gläschen halten ungekühlt – nach dem Öffnen kühlen und Herstellerangaben beachten.', ok: true },
  { text: 'Ganzes Obst wie Banane oder Avocado erst vor Ort schälen und zerdrücken.', ok: true },
  { text: 'Brot und trockene Getreideflocken brauchen keine Kühlung.', ok: true },
  { text: 'Selbstgekochten Brei in der Kühltasche mit Kühlakku transportieren; im Kühlschrank höchstens einen Tag aufbewahren.', ok: false },
  { text: 'Beim Aufwärmen gut durcherhitzen (70 °C für 2 Minuten), umrühren und mit einem anderen Löffel die Temperatur prüfen.', ok: false },
  { text: 'Erwärmte oder angefangene Reste nicht aufheben – lieber kleine Portionen mitnehmen.', ok: false },
];

export const TRAVEL_SOURCES = [
  { label: 'BfR: Vorkochen für mehrere Tage', url: 'https://www.bfr.bund.de/fragen-und-antworten/thema/vorkochen-fuer-mehrere-tage/' },
  { label: 'KKH: Tipps & wichtige Informationen zur Beikost', url: 'https://www.kkh.de/leistungen/familie-kind/saeuglinge/babykost/beikost/tipps-beikost' },
  { label: 'Gesund ins Leben: Ernährung im Kleinkindalter (Koletzko et al. 2013)', url: 'https://doi.org/10.1007/s00112-013-3031-3' },
];
