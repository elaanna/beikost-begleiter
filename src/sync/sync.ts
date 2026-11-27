import type { SQLiteDatabase } from 'expo-sqlite';
import { getMeta, setMeta } from '@/db/repo';
import { ensureSession, supabase } from './supabase';
import { t } from '@/i18n';

/**
 * Offline-first-Sync:
 * 1. Alle lokal geänderten Zeilen (dirty = 1) per Upsert hochladen.
 * 2. Alle Zeilen der Familie holen, die sich seit dem letzten Abgleich auf dem Server geändert haben.
 * Konflikte löst der Server per Last-Write-Wins (Trigger lww_guard).
 */

type Table = 'children' | 'food_logs' | 'digestion_logs' | 'caregivers' | 'shift_entries' | 'family_settings' | 'stock_items' | 'plan_swaps' | 'journal_entries';

/** Reihenfolge wichtig: Elterntabellen vor abhängigen (Fremdschlüssel). */
const TABLES: Table[] = ['children', 'food_logs', 'digestion_logs', 'caregivers', 'shift_entries', 'family_settings', 'stock_items', 'plan_swaps', 'journal_entries'];

const COLUMNS: Record<Table, string[]> = {
  children: [
    'id', 'family_id', 'name', 'birth_date', 'approach', 'milk', 'atopic_dermatitis', 'peanut_cleared',
    'start_date', 'exclusions', 'excluded_foods', 'table_since', 'updated_at', 'deleted',
  ],
  food_logs: ['id', 'family_id', 'child_id', 'food_id', 'date', 'liking', 'reaction', 'note', 'updated_at', 'deleted'],
  digestion_logs: ['id', 'family_id', 'child_id', 'date', 'kind', 'note', 'updated_at', 'deleted'],
  caregivers: ['id', 'family_id', 'name', 'emoji', 'updated_at', 'deleted'],
  shift_entries: ['id', 'family_id', 'caregiver_id', 'date', 'kind', 'updated_at', 'deleted'],
  family_settings: ['id', 'family_id', 'data', 'updated_at', 'deleted'],
  stock_items: ['id', 'family_id', 'kind', 'name', 'recipe_id', 'food_id', 'portions', 'made_on', 'updated_at', 'deleted'],
  plan_swaps: ['id', 'family_id', 'child_id', 'date', 'slot', 'recipe_id', 'updated_at', 'deleted'],
  journal_entries: ['id', 'family_id', 'child_id', 'date', 'kind', 'text', 'updated_at', 'deleted'],
};

const BOOL_COLS = new Set(['atopic_dermatitis', 'peanut_cleared', 'deleted']);
const JSON_COLS = new Set(['exclusions', 'excluded_foods', 'data']);

function toRemote(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === 'dirty') continue;
    if (BOOL_COLS.has(k)) out[k] = v === 1;
    else if (JSON_COLS.has(k)) out[k] = JSON.parse(String(v));
    else out[k] = v;
  }
  return out;
}

function toLocal(table: Table, row: Record<string, unknown>): unknown[] {
  return COLUMNS[table].map((c) => {
    const v = row[c];
    if (BOOL_COLS.has(c)) return v ? 1 : 0;
    if (JSON_COLS.has(c)) return JSON.stringify(v ?? []);
    return v ?? null;
  });
}

export interface SyncResult {
  pushed: number;
  pulled: number;
}

export async function registerFamily(db: SQLiteDatabase, displayName: string): Promise<void> {
  if (!supabase) return;
  await ensureSession();
  const familyId = await getMeta(db, 'family_id');
  if (!familyId) return;
  const { error } = await supabase.rpc('create_family', { fid: familyId, name: displayName });
  if (error) throw error;
  await setMeta(db, 'family_registered', '1');
}

/**
 * Daten verlassen das Gerät nur, wenn die Familienfreigabe aktiv ist
 * (Einladung erstellt oder Familie beigetreten). So steht es auch in der Einwilligung.
 */
export async function isSharingEnabled(db: SQLiteDatabase): Promise<boolean> {
  return (await getMeta(db, 'sharing')) === '1';
}

export async function syncNow(db: SQLiteDatabase): Promise<SyncResult> {
  if (!supabase || !(await isSharingEnabled(db))) return { pushed: 0, pulled: 0 };
  await ensureSession();
  if ((await getMeta(db, 'family_registered')) !== '1') await registerFamily(db, '');
  const familyId = await getMeta(db, 'family_id');
  if (!familyId) return { pushed: 0, pulled: 0 };

  let pushed = 0;
  for (const table of TABLES) {
    const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} WHERE dirty = 1`);
    if (rows.length === 0) continue;
    const { error } = await supabase.from(table).upsert(rows.map(toRemote));
    if (error) throw error;
    await db.withTransactionAsync(async () => {
      for (const r of rows) {
        // Nur zurücksetzen, wenn die Zeile seitdem nicht erneut geändert wurde
        await db.runAsync(`UPDATE ${table} SET dirty = 0 WHERE id = ? AND updated_at = ?`, r.id as string, r.updated_at as string);
      }
    });
    pushed += rows.length;
  }

  let pulled = 0;
  const since = (await getMeta(db, 'last_pull')) ?? '1970-01-01T00:00:00Z';
  let newest = since;
  for (const table of TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select([...COLUMNS[table], 'server_updated_at'].join(','))
      .eq('family_id', familyId)
      .gt('server_updated_at', since)
      .order('server_updated_at');
    if (error) throw error;
    const remote = (data ?? []) as unknown as Record<string, unknown>[];
    const cols = COLUMNS[table];
    await db.withTransactionAsync(async () => {
      for (const r of remote) {
        const placeholders = cols.map(() => '?').join(', ');
        const updates = cols.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`).join(', ');
        // Lokale, noch nicht hochgeladene neuere Änderungen bleiben erhalten
        await db.runAsync(
          `INSERT INTO ${table} (${cols.join(', ')}, dirty) VALUES (${placeholders}, 0)
           ON CONFLICT(id) DO UPDATE SET ${updates}, dirty = 0
           WHERE ${table}.dirty = 0 OR ${table}.updated_at <= excluded.updated_at`,
          ...(toLocal(table, r) as (string | number | null)[]),
        );
        const s = String(r.server_updated_at);
        if (s > newest) newest = s;
      }
    });
    pulled += remote.length;
  }
  await setMeta(db, 'last_pull', newest);
  return { pushed, pulled };
}

/** Einladungscode für Partner, Großeltern oder Kita erzeugen. */
export async function createInvite(db: SQLiteDatabase, role: 'member' | 'reader'): Promise<string> {
  if (!supabase) throw new Error('Sync ist nicht eingerichtet');
  await ensureSession();
  if ((await getMeta(db, 'family_registered')) !== '1') await registerFamily(db, '');
  const familyId = await getMeta(db, 'family_id');
  // Kaufstatus serverseitig auffrischen (falls der RevenueCat-Webhook noch nicht da war). Fehler hier sind egal –
  // die Datenbank entscheidet in create_invite selbst, ob die Familie Zugang hat.
  await supabase.functions.invoke('kauf-abgleich', { body: { familyId } }).catch(() => undefined);
  const { data, error } = await supabase.rpc('create_invite', { fid: familyId, invite_role: role });
  if (error) throw new Error(friendlyError(error.message));
  await setMeta(db, 'sharing', '1');
  void syncNow(db);
  return formatInviteCode(data as string);
}

/** Code in Fünfergruppen anzeigen: ABCDE-FGHJK */
export function formatInviteCode(code: string): string {
  const c = normalizeInviteCode(code);
  return c.length > 5 ? `${c.slice(0, 5)}-${c.slice(5)}` : c;
}

export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export const INVITE_CODE_LENGTH = 10;

/** Server-Fehler in verständliche Sätze übersetzen (keine technischen Details anzeigen). */
export function friendlyError(message: string): string {
  if (/no entitlement/.test(message)) return t('Die Familienfreigabe gehört zum Beikost-Paket. Wenn du es gerade gekauft hast, versuche es in einer Minute noch einmal.');
  if (/too many attempts/.test(message)) return t('Zu viele falsche Codes. Bitte in einer Stunde noch einmal versuchen.');
  if (/too many open invites/.test(message)) return t('Es gibt schon 10 offene Einladungen. Widerrufe alte Codes oder warte, bis sie ablaufen.');
  if (/not allowed/.test(message)) return t('Dafür fehlt dir die Berechtigung in dieser Familie.');
  if (/family exists/.test(message)) return t('Diese Familie gibt es schon. Bitte lass dich mit einem Code einladen.');
  if (/network|fetch/i.test(message)) return t('Keine Verbindung. Bitte später noch einmal versuchen.');
  return t('Das hat nicht geklappt. Bitte später noch einmal versuchen.');
}

export type FamilyRole = 'owner' | 'member' | 'reader';

/**
 * Mit Code einer bestehenden Familie beitreten.
 * Schreibberechtigte übernehmen ihre lokalen Einträge in die Familie.
 * Leser-Geräte (z. B. Kita) laden nichts hoch – eigene Einträge bleiben nur auf dem Gerät.
 */
export async function joinFamily(db: SQLiteDatabase, code: string, displayName: string): Promise<FamilyRole> {
  if (!supabase) throw new Error('Sync ist nicht eingerichtet');
  await ensureSession();
  const { data, error } = await supabase.rpc('join_family', { invite_code: normalizeInviteCode(code), name: displayName });
  if (error) throw new Error(friendlyError(error.message));
  const row = (data as { family_id: string; role: FamilyRole }[] | null)?.[0];
  if (!row) throw new Error(t('Code ungültig oder abgelaufen. Bitte einen neuen Code anfordern.'));
  await adoptFamily(db, row.family_id, row.role);
  await syncNow(db);
  return row.role;
}

const SYNC_TABLES = TABLES;

/**
 * Gerät einer Familie zuordnen (Beitritt per Code oder Anmeldung mit Konto auf neuem Gerät).
 * Schreibberechtigte übernehmen ihre lokalen Einträge in die Familie, Leser laden nichts hoch.
 */
export async function adoptFamily(db: SQLiteDatabase, familyId: string, role: FamilyRole): Promise<void> {
  await db.withTransactionAsync(async () => {
    if (role === 'reader') {
      for (const t of SYNC_TABLES) await db.runAsync(`UPDATE ${t} SET dirty = 0`);
    } else {
      await db.runAsync('UPDATE children SET family_id = ?, dirty = 1', familyId);
      for (const t of ['food_logs', 'digestion_logs', 'caregivers', 'shift_entries', 'stock_items', 'plan_swaps', 'journal_entries'] as const) {
        await db.runAsync(`UPDATE ${t} SET family_id = ?, dirty = 1`, familyId);
      }
    }
    // Einstellungen gehören der Familie: die der beigetretenen Familie werden übernommen
    await db.runAsync('DELETE FROM family_settings');
    await setMeta(db, 'family_id', familyId);
    await setMeta(db, 'family_registered', '1');
    await setMeta(db, 'family_role', role);
    await setMeta(db, 'sharing', '1');
    await setMeta(db, 'last_pull', '1970-01-01T00:00:00Z');
  });
}

export interface FamilyMember {
  userId: string;
  role: FamilyRole;
  displayName: string;
  joinedAt: string;
  isMe: boolean;
}

export async function listMembers(db: SQLiteDatabase): Promise<FamilyMember[]> {
  if (!supabase || !(await isSharingEnabled(db))) return [];
  const me = await ensureSession();
  const familyId = await getMeta(db, 'family_id');
  const { data, error } = await supabase
    .from('family_members')
    .select('user_id, role, display_name, joined_at')
    .eq('family_id', familyId)
    .order('joined_at');
  if (error) throw new Error(friendlyError(error.message));
  return (data ?? []).map((m) => ({
    userId: m.user_id as string,
    role: m.role as FamilyRole,
    displayName: (m.display_name as string) || '',
    joinedAt: m.joined_at as string,
    isMe: m.user_id === me,
  }));
}

/** Owner entfernt ein Mitglied. */
export async function removeMember(db: SQLiteDatabase, userId: string): Promise<void> {
  if (!supabase) return;
  const familyId = await getMeta(db, 'family_id');
  const { error } = await supabase.from('family_members').delete().eq('family_id', familyId).eq('user_id', userId);
  if (error) throw new Error(friendlyError(error.message));
}

/** Alle offenen Einladungscodes der Familie ungültig machen. */
export async function revokeInvites(db: SQLiteDatabase): Promise<void> {
  if (!supabase) return;
  const familyId = await getMeta(db, 'family_id');
  const { error } = await supabase.from('family_invites').delete().eq('family_id', familyId);
  if (error) throw new Error(friendlyError(error.message));
}

/**
 * Familienfreigabe beenden. Owner löschen die Familie in der Cloud, Mitglieder treten aus.
 * Lokale Einträge bleiben erhalten und bekommen eine neue, eigene Familien-ID.
 */
export async function stopSharing(db: SQLiteDatabase, newFamilyId: string): Promise<void> {
  if (supabase && (await isSharingEnabled(db))) {
    const me = await ensureSession();
    const familyId = await getMeta(db, 'family_id');
    const role = (await getMeta(db, 'family_role')) ?? 'owner';
    const { error } = role === 'owner'
      ? await supabase.rpc('delete_family', { fid: familyId })
      : await supabase.from('family_members').delete().eq('family_id', familyId).eq('user_id', me);
    if (error) throw new Error(friendlyError(error.message));
  }
  await db.withTransactionAsync(async () => {
    for (const t of SYNC_TABLES) await db.runAsync(`UPDATE ${t} SET family_id = ?, dirty = 1`, newFamilyId);
    await db.runAsync('UPDATE family_settings SET id = ?', newFamilyId);
    await setMeta(db, 'family_id', newFamilyId);
    await setMeta(db, 'family_registered', '0');
    await setMeta(db, 'family_role', 'owner');
    await setMeta(db, 'sharing', '0');
    await setMeta(db, 'last_pull', '1970-01-01T00:00:00Z');
  });
}

/** Recht auf Löschung: Konto in der Cloud löschen (falls vorhanden), dann alles auf dem Gerät. */
export async function deleteEverything(db: SQLiteDatabase): Promise<void> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw new Error(friendlyError(error.message));
      await supabase.auth.signOut({ scope: 'local' });
    }
  }
  await db.withTransactionAsync(async () => {
    for (const t of [...SYNC_TABLES, 'shopping_checks', 'appointments', 'meta']) await db.runAsync(`DELETE FROM ${t}`);
  });
}
