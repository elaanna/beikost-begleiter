import { t, tr } from '@/i18n';
/**
 * Reifezeichen-Checkliste: Eltern halten fest, was sie beobachten.
 *
 * Bewusst KEINE Bewertung („bereit“/„nicht bereit“): Die App stellt die Beikostreife nicht fest
 * (Zweckbestimmung: Wissen und Organisation, keine Diagnose). Sie zeigt allgemeine Informationen
 * nach NHS und American Academy of Pediatrics (AAP) und das allgemeine Zeitfenster der
 * S3-Leitlinie Allergieprävention (Beginn 5. bis Beginn 7. Lebensmonat).
 */

export type Observation = 'beobachtet' | 'noch_nicht';

export interface ReadinessSign {
  id: string;
  emoji: string;
  title: string;
  question: string;
  help: string;
}

export const READINESS_SIGNS_LIST: ReadinessSign[] = tr([
  {
    id: 'sitzen', emoji: '🪑', title: 'Aufrecht sitzen',
    question: 'Hast du beobachtet, dass dein Kind mit wenig Hilfe aufrecht sitzt und den Kopf sicher hält?',
    help: 'Zum Beispiel auf deinem Schoß oder im Hochstuhl, ohne zur Seite zu kippen.',
  },
  {
    id: 'greifen', emoji: '✋', title: 'Greifen und zum Mund führen',
    question: 'Hast du beobachtet, dass es Essen anschaut, danach greift und es selbst zum Mund führt?',
    help: 'Auge, Hand und Mund arbeiten zusammen – etwa mit einem Spielzeug oder deinem Brot.',
  },
  {
    id: 'schlucken', emoji: '👅', title: 'Schlucken',
    question: 'Hast du beobachtet, dass es Essen hinunterschluckt, statt es mit der Zunge herauszuschieben?',
    help: 'Etwas Herauslaufen ist anfangs normal.',
  },
  {
    id: 'interesse', emoji: '👀', title: 'Interesse am Essen',
    question: 'Hast du beobachtet, dass es sich für euer Essen interessiert?',
    help: 'Schaut beim Essen zu, greift nach dem Teller, öffnet den Mund, wenn ein Löffel kommt.',
  },
]);

/** Diese Verhaltensweisen gelten laut NHS nicht als Reifezeichen. */
export const NOT_READINESS_SIGNS = tr(['Auf den Fäusten kauen', 'Nachts öfter aufwachen', 'Mehr Milch trinken wollen']);

/** Allgemeine Information, keine Bewertung des einzelnen Kindes. */
export const READINESS_GENERAL =
  'Die meisten Babys zeigen diese Zeichen zwischen dem 5. und 7. Lebensmonat. Die S3-Leitlinie Allergieprävention nennt als Zeitraum für den Beikoststart Beginn des 5. bis Beginn des 7. Monats; für gestillte Kinder empfiehlt die Stillleitlinie, bis etwa zum vollendeten 6. Monat ausschließlich oder überwiegend zu stillen.';

export const READINESS_DECISION =
  'Diese Checkliste hilft dir beim Beobachten – sie ist keine Einschätzung deines Kindes. Wann ihr startet, entscheidest du. Bei Fragen hilft eure Kinderarztpraxis oder Hebamme, zum Beispiel bei der U-Untersuchung.';

export function countObserved(answers: Record<string, Observation>): number {
  return READINESS_SIGNS_LIST.filter((s) => answers[s.id] === 'beobachtet').length;
}
