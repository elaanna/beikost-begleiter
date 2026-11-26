import { addMonths } from './dates';
import type { MilkFeeding } from './types';
import { t } from '@/i18n';

export interface StartWindow {
  /** Beginn des 5. Lebensmonats (= 4 Monate vollendet). */
  earliest: string;
  /** Beginn des 7. Lebensmonats (= 6 Monate vollendet). */
  latest: string;
  /** Vorschlag der App für den Plan, wenn noch kein Start gesetzt ist. */
  suggested: string;
  /** Erklärung für Eltern. */
  note: string;
}

/**
 * Berechnet das Startfenster nach S3 Allergieprävention (Beginn 5. bis Beginn 7. Monat).
 * Für gestillte Kinder berücksichtigt der Vorschlag zusätzlich die S3-Leitlinie Stilldauer
 * (ausschließlich oder überwiegend stillen bis zum vollendeten 6. Monat).
 * Der Zeitpunkt richtet sich immer zuerst nach den Reifezeichen des Kindes.
 */
export function computeStartWindow(birthDate: string, milk: MilkFeeding): StartWindow {
  const earliest = addMonths(birthDate, 4);
  const latest = addMonths(birthDate, 6);

  if (milk === 'stillen') {
    return {
      earliest,
      latest,
      suggested: latest,
      note:
        t('Für gestillte Kinder empfiehlt die S3-Leitlinie Stilldauer (2026), bis zum vollendeten 6. Monat ') +
        t('ausschließlich oder überwiegend zu stillen. Die S3-Leitlinie Allergieprävention nennt ein ') +
        t('Fenster ab Beginn des 5. Monats. Achte auf die Reifezeichen und sprich den Start bei der ') +
        t('U-Untersuchung an. Stillen neben der Beikost bis mindestens zum 1. Geburtstag.'),
    };
  }

  return {
    earliest,
    latest,
    suggested: addMonths(birthDate, 5),
    note:
      t('Die S3-Leitlinie Allergieprävention empfiehlt den Beikoststart frühestens ab Beginn des 5. und ') +
      t('spätestens ab Beginn des 7. Lebensmonats – abhängig von den Reifezeichen. ') +
      t('Achte auf die Reifezeichen.'),
  };
}
