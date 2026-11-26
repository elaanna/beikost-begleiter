/**
 * Allergen-Guide: Einführung der häufigsten Allergene.
 * Quellen: S3-Leitlinie Allergieprävention (AWMF 061-016), ASCIA „How to introduce solid foods“ (2024),
 * Netzwerk Gesund ins Leben 2024, NHS. Eigene Formulierungen.
 */
import type { Allergen } from '@/domain/types';
import { tr } from '@/i18n';


export interface AllergenSource {
  label: string;
  url: string;
}

export const ALLERGEN_SOURCES: Record<string, AllergenSource> = {
  s3: { label: 'S3-Leitlinie Allergieprävention', url: 'https://register.awmf.org/assets/guidelines/061-016l_S3_Allergiepraevention_2022-11.pdf' },
  ascia: { label: 'ASCIA: How to introduce solid foods (2024)', url: 'https://www.allergy.org.au/images/pc/ASCIA_PC_How_to_Introduce_Solid_Foods_FAQ_2024.pdf' },
  gil: { label: 'Gesund ins Leben 2024', url: 'https://doi.org/10.1007/s00112-024-02014-7' },
  nhs: { label: 'NHS: Food allergies in babies', url: 'https://www.nhs.uk/baby/weaning-and-feeding/babys-first-solid-foods/' },
  schn: { label: 'Sydney Children’s Hospitals: Introducing allergens', url: 'https://www.schn.health.nsw.gov.au/kids-health-hub/kids-nutrition/infant-and-baby-nutrition/introducing-allergens' },
};

export interface AllergenGuide {
  id: Allergen;
  name: string;
  emoji: string;
  /** Lebensmittel der Datenbank, die dieses Allergen enthalten und sich für den Einstieg eignen. */
  starterFoods: string[];
  firstServing: string;
  keepUp: string;
  special: string[];
  important?: string;
  sources: (keyof typeof ALLERGEN_SOURCES)[];
}

export const ALLERGEN_GUIDES: AllergenGuide[] = tr([
  {
    id: 'ei', name: 'Hühnerei', emoji: '🥚', starterFoods: ['ei'],
    firstServing: 'Etwa ¼ TL hart gekochtes Ei, fein zerdrückt unter den Gemüsebrei.',
    keepUp: 'Danach etwa 2× pro Woche.',
    special: ['Ei 10 Minuten kochen, bis Eiweiß und Eigelb ganz fest sind.', 'Verbackenes Ei (z. B. in Pfannkuchen) zählt auch.'],
    important: 'Nur durcherhitzt – kein rohes oder weiches Ei, kein cremiges Rührei.',
    sources: ['s3', 'ascia'],
  },
  {
    id: 'milch', name: 'Kuhmilch', emoji: '🥛', starterFoods: ['vollmilch', 'joghurt', 'butter'],
    firstServing: 'Etwas Naturjoghurt oder Vollmilch im Getreidebrei.',
    keepUp: 'Bei Brei-Kindern ohnehin täglich im Abendbrei; insgesamt bis etwa 200 ml Milch oder Joghurt am Tag.',
    special: ['Gehört laut S3-Leitlinie zu einer abwechslungsreichen Beikost dazu.', 'Säuglingsnahrung auf Kuhmilchbasis gilt nicht als „Einführung“ – es geht um Milchprodukte im Essen.'],
    important: 'Im ersten Jahr nicht als Getränk und nie als Rohmilch.',
    sources: ['s3', 'ascia', 'gil'],
  },
  {
    id: 'erdnuss', name: 'Erdnuss', emoji: '🥜', starterFoods: ['erdnuss'],
    firstServing: 'Etwa ¼ TL glattes Erdnussmus (100 % Erdnuss) in warmen Brei rühren.',
    keepUp: 'Danach etwa 2× pro Woche.',
    special: ['Beim nächsten Mal auf ½ TL steigern, wenn alles gut war.', 'Erdnussmus pur ist klebrig – immer in Brei oder dünn verstrichen geben.'],
    important: 'Nie ganze oder gehackte Erdnüsse (Erstickungsgefahr). Bei mittelschwerer bis schwerer Neurodermitis vor der ersten Erdnuss ärztlich abklären lassen.',
    sources: ['s3', 'ascia'],
  },
  {
    id: 'baumnuss', name: 'Baumnüsse', emoji: '🌰', starterFoods: ['mandel', 'cashew', 'haselnuss', 'walnuss'],
    firstServing: 'Etwa ¼ TL glattes Nussmus (z. B. Mandel- oder Cashewmus) im Brei.',
    keepUp: 'Jede eingeführte Nusssorte etwa 2× pro Woche weitergeben.',
    special: ['Jede Nusssorte einzeln einführen – Allergien sind sortenspezifisch.', 'Kein Nuss-Nougat-Aufstrich (viel Zucker).'],
    important: 'Nur als Mus oder sehr fein gemahlen – ganze Nüsse sind bis ins Kindergartenalter tabu.',
    sources: ['ascia', 'schn'],
  },
  {
    id: 'fisch', name: 'Fisch', emoji: '🐟', starterFoods: ['lachs', 'kabeljau', 'forelle'],
    firstServing: 'Eine kleine Menge durchgegarten, grätenfreien Fisch unter den Gemüsebrei.',
    keepUp: '1–2× pro Woche anstelle von Fleisch.',
    special: ['Fettreicher Fisch wie Lachs liefert Omega-3-Fettsäuren.', 'Laut S3-Leitlinie wirkt Fisch im ersten Jahr eher schützend.'],
    important: 'Gräten sorgfältig entfernen. Kein Thunfisch oder Schwertfisch (Quecksilber), kein geräucherter Fisch (Salz).',
    sources: ['s3', 'gil'],
  },
  {
    id: 'gluten', name: 'Weizen / Gluten', emoji: '🌾', starterFoods: ['dinkel', 'hafer', 'nudeln'],
    firstServing: 'Eine kleine Menge Weizen- oder Dinkelgrieß im Brei oder eine weiche Nudel.',
    keepUp: 'Getreide gehört ohnehin regelmäßig in den Abend- und Nachmittagsbrei.',
    special: ['Ein späterer oder früherer Glutenstart beugt Zöliakie nicht vor – normale Mengen im Rahmen der Beikost sind richtig.'],
    sources: ['s3', 'ascia'],
  },
  {
    id: 'soja', name: 'Soja', emoji: '🫘', starterFoods: ['tofu', 'edamame'],
    firstServing: 'Etwas glatt gerührter Seidentofu im Gemüsebrei.',
    keepUp: 'Danach etwa 2× pro Woche.',
    special: ['Edamame nur weich gekocht und zerdrückt.'],
    important: 'Säuglingsnahrung auf Sojabasis ist laut S3-Leitlinie zur Allergievorbeugung nicht geeignet.',
    sources: ['s3', 'ascia'],
  },
  {
    id: 'sesam', name: 'Sesam', emoji: '🌱', starterFoods: ['sesam'],
    firstServing: 'Etwa ¼ TL Tahin (Sesammus) im Gemüse- oder Getreidebrei.',
    keepUp: 'Danach etwa 2× pro Woche.',
    special: ['Hummus enthält oft Tahin – auf Salz achten.'],
    sources: ['ascia', 'schn'],
  },
]);

/** Gilt für alle Allergene. */
export const HOW_TO_INTRODUCE = tr([
  'Nur ein neues Allergen zur Zeit – so lässt sich eine Reaktion zuordnen.',
  'Mit einer kleinen Menge starten (etwa ¼ TL), untergemischt in gewohntes Essen; beim nächsten Mal steigern.',
  'Tagsüber anbieten, nicht kurz vor dem Schlafen – Reaktionen zeigen sich meist innerhalb von Minuten bis zwei Stunden.',
  'Die App bietet ein neues Allergen 3 Tage hintereinander an, danach bleibt es etwa 2× pro Woche im Plan.',
  'Nie Essen auf die Haut reiben, um zu „testen“ – das zeigt keine Allergie und kann das Risiko erhöhen.',
]);

export const MILD_SIGNS = tr(['Schwellung von Lippen, Augen oder Gesicht', 'Quaddeln oder Nesselausschlag', 'Erbrechen', 'Plötzlich sehr unruhig']);
export const SEVERE_SIGNS = tr(['Schwierige oder geräuschvolle Atmung', 'Schwellung der Zunge', 'Blass und schlapp']);
export const NOT_A_REACTION = 'Leichte Rötung rund um den Mund ist meist eine harmlose Hautreizung, keine Allergie.';
