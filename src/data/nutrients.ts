/**
 * Grobe Nährwert-Schätzwerte je 100 g (roh bzw. wie verwendet; Getreide als trockene Flocken,
 * Hülsenfrüchte gegart). Gerundete Durchschnittswerte nach öffentlichen Nährwerttabellen
 * (u. a. USDA FoodData Central). Nur für eine grobe Übersicht – keine exakten Werte.
 * [kcal, Eiweiß g, Fett g, Eisen mg]
 */
export type Nutr = [number, number, number, number];

export const NUTRIENTS_100G: Record<string, Nutr> = {
  // Gemüse
  pastinake: [75, 1.2, 0.3, 0.6], karotte: [41, 0.9, 0.2, 0.3], kuerbis: [40, 1.1, 0.1, 0.8], zucchini: [17, 1.2, 0.3, 0.4],
  brokkoli: [34, 2.8, 0.4, 0.7], blumenkohl: [25, 1.9, 0.3, 0.4], suesskartoffel: [86, 1.6, 0.1, 0.6], fenchel: [31, 1.2, 0.2, 0.7],
  erbsen: [81, 5.4, 0.4, 1.5], spinat: [23, 2.9, 0.4, 2.7], kartoffel: [77, 2.0, 0.1, 0.8], kohlrabi: [27, 1.7, 0.1, 0.4],
  petersilienwurzel: [55, 2.6, 0.4, 0.9], steckruebe: [37, 1.1, 0.2, 0.4], gruene_bohnen: [31, 1.8, 0.2, 1.0], spargel: [20, 2.2, 0.1, 0.7],
  aubergine: [25, 1.0, 0.2, 0.2], paprika: [31, 1.0, 0.3, 0.4], tomate: [18, 0.9, 0.2, 0.3], gurke: [15, 0.7, 0.1, 0.3],
  lauch: [31, 1.5, 0.3, 1.0], rosenkohl: [43, 3.4, 0.3, 1.4], gruenkohl: [49, 4.3, 0.9, 1.5], wirsing: [27, 2.0, 0.1, 0.4],
  mangold: [19, 1.8, 0.2, 1.8], rote_bete: [43, 1.6, 0.2, 0.8], champignons: [22, 3.1, 0.3, 0.5], sellerie: [42, 1.5, 0.3, 0.7],
  mais: [86, 3.3, 1.4, 0.5],
  // Fette
  rapsoel: [884, 0, 100, 0], olivenoel: [884, 0, 100, 0], leinoel: [884, 0, 100, 0], butter: [717, 0.9, 81, 0],
  // Fleisch & Fisch
  rind: [133, 21, 5, 2.2], huhn: [140, 18, 7, 1.0], pute: [114, 23, 2, 0.9], lamm: [200, 18, 14, 1.6], schwein: [143, 21, 6, 0.9],
  lachs: [208, 20, 13, 0.3], kabeljau: [82, 18, 0.7, 0.4], forelle: [141, 20, 6, 0.4], scholle: [86, 17, 1.5, 0.3], makrele: [205, 19, 14, 1.6],
  // Getreide (trocken)
  hafer: [372, 13.5, 7, 4.5], hirse: [370, 11, 4, 5.0], dinkel: [340, 12, 2.5, 3.5], reis: [350, 7, 0.6, 0.8], quinoa: [368, 14, 6, 4.6],
  amaranth: [371, 14, 7, 7.6], buchweizen: [343, 13, 3.4, 2.2], polenta: [360, 8, 1.5, 1.0], gerste: [352, 10, 1.2, 2.0],
  nudeln: [348, 13, 2.5, 3.5], couscous: [376, 13, 0.6, 1.1], brot: [220, 8, 1.5, 2.5], roggen: [340, 10, 1.7, 2.6],
  // Milch & Ei
  vollmilch: [64, 3.3, 3.5, 0], joghurt: [61, 3.5, 3.3, 0.1], frischkaese: [250, 6, 22, 0.1], ricotta: [174, 11, 13, 0.4],
  mozzarella: [250, 18, 19, 0.4], quark: [110, 11, 5, 0.1], ei: [140, 12.5, 9.5, 1.8],
  // Obst
  apfel: [52, 0.3, 0.2, 0.1], birne: [57, 0.4, 0.1, 0.2], banane: [89, 1.1, 0.3, 0.3], avocado: [160, 2, 15, 0.6],
  heidelbeere: [57, 0.7, 0.3, 0.3], weintraube: [69, 0.7, 0.2, 0.4], mango: [60, 0.8, 0.4, 0.2], pfirsich: [39, 0.9, 0.3, 0.3],
  aprikose: [48, 1.4, 0.4, 0.4], pflaume: [46, 0.7, 0.3, 0.2], melone: [36, 0.5, 0.1, 0.2], wassermelone: [30, 0.6, 0.2, 0.2],
  erdbeere: [32, 0.7, 0.3, 0.4], himbeere: [52, 1.2, 0.7, 0.7], kiwi: [61, 1.1, 0.5, 0.3], orange: [47, 0.9, 0.1, 0.1],
  mandarine: [53, 0.8, 0.3, 0.2], ananas: [50, 0.5, 0.1, 0.3], kirsche: [63, 1.1, 0.2, 0.4], papaya: [43, 0.5, 0.3, 0.3], feige: [74, 0.8, 0.3, 0.4],
  // Hülsenfrüchte (gegart)
  linsen: [116, 9, 0.4, 3.3], braune_linsen: [116, 9, 0.4, 3.3], kichererbsen: [164, 8.9, 2.6, 2.9], tofu: [76, 8, 4.8, 2.7],
  weisse_bohnen: [139, 9.7, 0.4, 3.7], kidneybohnen: [127, 8.7, 0.5, 2.9], edamame: [121, 12, 5, 2.3],
  // Nüsse & Samen (Mus bzw. gemahlen)
  erdnuss: [588, 25, 50, 1.9], mandel: [614, 21, 56, 3.5], sesam: [595, 17, 54, 8.9], cashew: [587, 17, 49, 5.0],
  haselnuss: [646, 15, 61, 4.4], walnuss: [654, 15, 65, 2.9], kuerbiskerne: [559, 30, 49, 8.8], leinsamen: [534, 18, 42, 5.7], chia: [486, 17, 31, 7.7],
};
