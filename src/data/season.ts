/**
 * Saisonkalender für regionales Obst und Gemüse in Deutschland (Orientierung, je nach Region und Wetter abweichend).
 * Nach den Saisonkalendern der Verbraucherzentrale und des BZfE; Monate 1–12.
 * frisch = Freiland/Ernte, lager = gut verfügbare Lagerware aus der Region.
 */
export interface SeasonInfo {
  frisch: number[];
  lager?: number[];
}

const range = (from: number, to: number): number[] => {
  const out: number[] = [];
  for (let m = from; ; m = (m % 12) + 1) {
    out.push(m);
    if (m === to) break;
  }
  return out;
};

export const SEASON: Record<string, SeasonInfo> = {
  // Gemüse
  pastinake: { frisch: range(10, 3) },
  karotte: { frisch: range(6, 11), lager: range(12, 5) },
  kuerbis: { frisch: range(8, 10), lager: range(11, 2) },
  zucchini: { frisch: range(6, 9) },
  brokkoli: { frisch: range(6, 11) },
  blumenkohl: { frisch: range(6, 11) },
  fenchel: { frisch: range(6, 11) },
  erbsen: { frisch: range(6, 8) },
  spinat: { frisch: [3, 4, 5, 9, 10, 11] },
  kartoffel: { frisch: range(6, 10), lager: range(11, 5) },
  kohlrabi: { frisch: range(5, 11) },
  petersilienwurzel: { frisch: range(9, 3) },
  steckruebe: { frisch: range(10, 3) },
  gruene_bohnen: { frisch: range(7, 9) },
  spargel: { frisch: [4, 5, 6] },
  aubergine: { frisch: range(7, 9) },
  paprika: { frisch: range(7, 10) },
  tomate: { frisch: range(7, 10) },
  gurke: { frisch: range(6, 9) },
  lauch: { frisch: range(8, 3) },
  rosenkohl: { frisch: range(10, 2) },
  gruenkohl: { frisch: range(11, 2) },
  wirsing: { frisch: range(9, 3) },
  mangold: { frisch: range(6, 11) },
  rote_bete: { frisch: range(8, 11), lager: range(12, 3) },
  sellerie: { frisch: range(9, 11), lager: range(12, 3) },
  mais: { frisch: range(8, 10) },
  // Obst
  apfel: { frisch: range(8, 10), lager: range(11, 5) },
  birne: { frisch: range(8, 10), lager: [11, 12, 1] },
  heidelbeere: { frisch: range(6, 9) },
  weintraube: { frisch: [9, 10] },
  pfirsich: { frisch: range(7, 9) },
  aprikose: { frisch: range(6, 8) },
  pflaume: { frisch: range(8, 10) },
  melone: { frisch: range(7, 9) },
  wassermelone: { frisch: range(7, 8) },
  erdbeere: { frisch: range(5, 7) },
  himbeere: { frisch: range(6, 9) },
  kirsche: { frisch: [6, 7] },
};

export const SEASON_SOURCE = {
  label: 'Verbraucherzentrale: Saisonkalender Obst und Gemüse',
  url: 'https://www.verbraucherzentrale.de/saisonkalender',
};

export const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
