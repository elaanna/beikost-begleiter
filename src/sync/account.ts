/**
 * Konto per E-Mail: schützt vor Datenverlust beim Handywechsel.
 *
 * 1. Konto erstellen: Die anonyme Sitzung bekommt eine E-Mail-Adresse (Bestätigung per Code).
 *    Die Cloud-Sicherung der Einträge ist ein eigener, freiwilliger Schritt (enableBackup).
 * 2. Neues Gerät: Anmeldung per Code an die E-Mail, danach holt die App die Familie und alle Einträge.
 * Kein Passwort – der Code kommt jedes Mal per E-Mail.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import { getMeta, setMeta } from '@/db/repo';
import { ensureSession, supabase } from './supabase';
import { adoptFamily, isSharingEnabled, registerFamily, syncNow, type FamilyRole } from './sync';
import { accountError, cleanOtp, isValidEmail } from './accountRules';
import { t } from '@/i18n';

export { accountError, cleanOtp, isValidEmail };

export interface AccountInfo {
  email: string | null;
}

export async function getAccount(): Promise<AccountInfo> {
  if (!supabase) return { email: null };
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return { email: user && !user.is_anonymous ? user.email ?? null : null };
}

function client() {
  if (!supabase) throw new Error(t('Die Cloud ist in dieser Version nicht eingerichtet.'));
  return supabase;
}

/** Schritt 1 (Verknüpfen): Code an die E-Mail senden. */
export async function requestLinkCode(email: string): Promise<void> {
  const sb = client();
  if (!isValidEmail(email)) throw new Error(t('Bitte gib eine gültige E-Mail-Adresse ein.'));
  await ensureSession();
  const { error } = await sb.auth.updateUser({ email: email.trim().toLowerCase() });
  if (error) throw new Error(accountError(error.message));
}

/** Schritt 2 (Konto erstellen): Code bestätigen. Die Einträge bleiben auf dem Gerät, bis die Sicherung eingeschaltet wird. */
export async function confirmLinkCode(email: string, code: string): Promise<void> {
  const sb = client();
  const { error } = await sb.auth.verifyOtp({ email: email.trim().toLowerCase(), token: cleanOtp(code), type: 'email_change' });
  if (error) throw new Error(accountError(error.message));
}

/**
 * Cloud-Sicherung einschalten (freiwillig, eigene Einwilligung – nicht an das Konto gekoppelt, Art. 7 Abs. 4 DSGVO).
 * Nutzt denselben Weg wie die Familienfreigabe.
 */
export async function enableBackup(db: SQLiteDatabase): Promise<void> {
  client();
  await ensureSession();
  if ((await getMeta(db, 'family_registered')) !== '1') await registerFamily(db, '');
  await setMeta(db, 'sharing', '1');
  await syncNow(db);
}

export async function isBackupEnabled(db: SQLiteDatabase): Promise<boolean> {
  return isSharingEnabled(db);
}

/** Neues Gerät, Schritt 1: Anmeldecode senden (legt kein neues Konto an). */
export async function requestSignInCode(email: string): Promise<void> {
  const sb = client();
  if (!isValidEmail(email)) throw new Error(t('Bitte gib eine gültige E-Mail-Adresse ein.'));
  const { error } = await sb.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false } });
  if (error) throw new Error(accountError(error.message));
}

/**
 * Neues Gerät, Schritt 2: Code prüfen; gibt es eine Sicherung, Familie übernehmen und alles herunterladen.
 * Rückgabe: true = Einträge wiederhergestellt, false = Konto ohne Sicherung (es geht mit dem Einrichten weiter).
 */
export async function confirmSignIn(db: SQLiteDatabase, email: string, code: string): Promise<boolean> {
  const sb = client();
  const { error } = await sb.auth.verifyOtp({ email: email.trim().toLowerCase(), token: cleanOtp(code), type: 'email' });
  if (error) throw new Error(accountError(error.message));
  const { data, error: famError } = await sb.rpc('my_family');
  if (famError) throw new Error(accountError(famError.message));
  const row = (data as { family_id: string; role: FamilyRole }[] | null)?.[0];
  if (!row) return false;
  await adoptFamily(db, row.family_id, row.role);
  await syncNow(db);
  return true;
}
