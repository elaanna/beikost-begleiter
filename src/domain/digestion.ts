import { t, tr } from '@/i18n';

export type StoolKind = 'normal' | 'weich' | 'hart' | 'durchfall' | 'keiner';

export interface DigestionLog {
  id: string;
  childId: string;
  date: string;
  kind: StoolKind;
  note: string;
}

export const STOOL_LABEL: Record<StoolKind, { label: string; emoji: string }> = tr({
  normal: { label: 'Normal', emoji: '🙂' },
  weich: { label: 'Weich', emoji: '💧' },
  hart: { label: 'Hart', emoji: '🪨' },
  durchfall: { label: 'Durchfall', emoji: '🌊' },
  keiner: { label: 'Kein Stuhl', emoji: '⏸️' },
});

/** Warnzeichen, bei denen Eltern die Kinderarztpraxis anrufen sollten. */
export const DIGESTION_RED_FLAGS = tr([
  'Blut oder Schleim im Stuhl',
  'Starke Bauchschmerzen, harter aufgeblähter Bauch',
  'Fieber oder wiederholtes Erbrechen',
  'Durchfall mit wenig nassen Windeln, trockenen Lippen oder Schlappheit',
]);

/** Allgemeines Wissen zur Verdauung in der Beikostzeit (keine Auswertung der Einträge). */
export const DIGESTION_INFO = tr([
  'Mit der Beikost wird der Stuhl meist fester, dunkler und riecht stärker – das ist normal.',
  'Unverdaute Stückchen (z. B. Karotte, Erbsen) sind in der Windel häufig zu sehen.',
  'Wasser aus dem Becher, Birne, Pflaume und Vollkorn können bei festem Stuhl helfen.',
]);
