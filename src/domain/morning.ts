/**
 * Frühstück im Breiplan: Den Frühstücksbrei gibt es im Schema von Gesund ins Leben nicht – morgens bleibt es
 * im ersten Jahr bei Milch. Ab etwa 10 Monaten kann das Familienfrühstück langsam beginnen.
 * Reine Orientierung, keine Bewertung.
 */
import { ageInMonths } from './dates';
import type { Child } from './types';
import { t } from '@/i18n';

/** Ab diesem Alter zeigt die App den Hinweis aufs Familienfrühstück. */
export const FAMILY_BREAKFAST_FROM_MONTHS = 10;

export interface MorningInfo {
  stage: 'milch' | 'uebergang';
  title: string;
  text: string;
}

export function morningInfo(child: Child, today: string): MorningInfo {
  const milk = child.milk === 'stillen' ? t('Stillen') : child.milk === 'flasche' ? t('Fläschchen') : t('Stillen oder Fläschchen');
  if (ageInMonths(child.birthDate, today) >= FAMILY_BREAKFAST_FROM_MONTHS) {
    return {
      stage: 'uebergang',
      title: t('Frühstück: langsam ans Familienfrühstück'),
      text: t('Ab etwa 10 Monaten kann {0} morgens nach und nach mitessen, zum Beispiel Brot mit Butter, Haferflocken mit Milch oder weiches Obst. Ohne Eile – {1} ist weiter in Ordnung.', { 0: child.name, 1: milk }),
    };
  }
  return {
    stage: 'milch',
    title: t('Frühstück: {0}', { 0: milk }),
    text: t('Einen Frühstücksbrei gibt es im Breiplan nicht. Morgens und nachts bleibt es im ersten Jahr bei Milch – die drei Breie kommen mittags, abends und nachmittags dazu.'),
  };
}

/** Am ersten Geburtstag: Was sich ab jetzt ändert (allgemeine Empfehlungen, keine Pflicht). */
export function firstBirthdayChanges(): string[] {
  return [
    t('5 Mahlzeiten am Tag: Frühstück, Snack, Mittag, Nachmittag und Abendbrot'),
    t('Mitessen am Familientisch – die Kinderportion vor dem Salzen und scharfen Würzen abnehmen'),
    t('Kuhmilch darf jetzt Getränk sein, am besten aus dem Becher; die Flasche langsam abgewöhnen'),
    t('Weiterhin: wenig Salz und Zucker, keine ganzen Nüsse, runde Sachen vierteln'),
  ];
}
