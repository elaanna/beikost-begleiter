import { t } from '@/i18n';
/** Reine Hilfsfunktionen fürs Konto (testbar ohne Supabase). */

export function isValidEmail(email: string): boolean {
  const e = email.trim();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

/** Code aus der E-Mail: nur Ziffern, 6–10 Stellen (je nach Supabase-Einstellung). */
export function cleanOtp(code: string): string {
  return code.replace(/\D/g, '').slice(0, 10);
}

/** Supabase-Fehler in verständliche Sätze übersetzen (keine technischen Details anzeigen). */
export function accountError(message: string): string {
  if (/already (been )?registered|already exists|email_exists/i.test(message)) return t('Diese E-Mail gehört schon zu einem Konto. Melde dich damit auf diesem Gerät an.');
  if (/signups? not allowed|user not found|otp_disabled/i.test(message)) return t('Zu dieser E-Mail gibt es noch kein Konto. Verknüpfe sie zuerst auf deinem bisherigen Handy.');
  if (/expired|invalid/i.test(message)) return t('Der Code stimmt nicht oder ist abgelaufen. Fordere einen neuen an.');
  if (/rate limit|security purposes|too many/i.test(message)) return t('Bitte warte kurz, bevor du einen neuen Code anforderst.');
  if (/network|fetch/i.test(message)) return t('Keine Verbindung. Bitte später noch einmal versuchen.');
  return t('Das hat nicht geklappt. Bitte später noch einmal versuchen.');
}
