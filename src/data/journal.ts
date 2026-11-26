/**
 * Journal „Erste Male“: Vorschläge für Momente, die Eltern festhalten möchten.
 * Bewusst ohne Altersangaben, Zielzeiten oder Vergleiche – jedes Kind hat sein eigenes Tempo.
 */
export interface JournalKind { id: string; emoji: string; label: string }

export const JOURNAL_KINDS: JournalKind[] = [
  { id: 'loeffel', emoji: '🥄', label: 'Erster Löffel' },
  { id: 'lieblingsessen', emoji: '😋', label: 'Erstes Lieblingsessen' },
  { id: 'selbst', emoji: '✋', label: 'Zum ersten Mal selbst gegessen' },
  { id: 'becher', emoji: '🥤', label: 'Zum ersten Mal aus dem Becher getrunken' },
  { id: 'familientisch', emoji: '🍽️', label: 'Zum ersten Mal am Familientisch' },
  { id: 'zahn', emoji: '🦷', label: 'Erster Zahn' },
  { id: 'wort', emoji: '💬', label: 'Erstes Wort' },
  { id: 'schritte', emoji: '👣', label: 'Erste Schritte' },
  { id: 'eigenes', emoji: '⭐', label: 'Eigener Moment' },
];

export const JOURNAL_BY_ID: Record<string, JournalKind> = Object.fromEntries(JOURNAL_KINDS.map((k) => [k.id, k]));
