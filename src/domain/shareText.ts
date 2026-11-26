import { t } from '@/i18n';

/**
 * Listen als Text weitergeben (WhatsApp, Notizen, Einkaufs-Apps) – ohne Konto, ohne Schnittstelle.
 * Es werden nur Lebensmittel geteilt, keine Angaben zum Kind.
 */
export function shoppingText(title: string, items: { name: string; detail?: string }[], footer = t('Erstellt mit nimou')): string {
  const lines = items.map((i) => `• ${i.name}${i.detail ? ` (${i.detail})` : ''}`);
  return [title, '', ...lines, '', footer].join('\n');
}
