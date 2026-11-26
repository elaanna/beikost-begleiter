import { router } from 'expo-router';

export type WissenSection = 'sicherheit' | 'allergene' | 'portionen' | 'leitlinien';
export type MengenTopic = 'brei' | 'eisen' | 'trinken';

/**
 * Öffnet den Wissen-Tab direkt im gewünschten Reiter.
 * Der Zeitstempel sorgt dafür, dass der Sprung auch beim zweiten Mal mit gleichem Ziel greift.
 */
export function openWissen(section: WissenSection, topic?: MengenTopic) {
  router.push({ pathname: '/wissen', params: { section, ...(topic ? { topic } : {}), t: String(Date.now()) } });
}
