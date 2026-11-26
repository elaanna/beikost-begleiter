import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Lokale Datenbank – die App funktioniert vollständig offline.
 * Jede synchronisierte Zeile trägt updated_at, deleted und dirty:
 * dirty = 1 bedeutet „noch nicht an Supabase übertragen“.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS children (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    approach TEXT NOT NULL,
    milk TEXT NOT NULL,
    atopic_dermatitis INTEGER NOT NULL DEFAULT 0,
    peanut_cleared INTEGER NOT NULL DEFAULT 0,
    start_date TEXT,
    exclusions TEXT NOT NULL DEFAULT '[]',
    excluded_foods TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS food_logs (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    child_id TEXT NOT NULL,
    food_id TEXT NOT NULL,
    date TEXT NOT NULL,
    liking INTEGER NOT NULL DEFAULT 0,
    reaction TEXT NOT NULL DEFAULT 'keine',
    note TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_logs_child ON food_logs (child_id, date);
  CREATE TABLE IF NOT EXISTS shopping_checks (
    week TEXT NOT NULL,
    food_id TEXT NOT NULL,
    PRIMARY KEY (week, food_id)
  );
  `,
  // Version 2: Verdauung, Betreuungspersonen, Dienste, Familien-Einstellungen
  `
  CREATE TABLE IF NOT EXISTS digestion_logs (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    child_id TEXT NOT NULL,
    date TEXT NOT NULL,
    kind TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_digestion_child ON digestion_logs (child_id, date);
  CREATE TABLE IF NOT EXISTS caregivers (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🙂',
    updated_at TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS shift_entries (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    caregiver_id TEXT NOT NULL,
    date TEXT NOT NULL,
    kind TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_shift_date ON shift_entries (date);
  CREATE TABLE IF NOT EXISTS family_settings (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  `,
  // 3: Vorrat & Gefrierfach, getauschte Mahlzeiten
  `
  CREATE TABLE IF NOT EXISTS stock_items (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    recipe_id TEXT,
    food_id TEXT,
    portions INTEGER NOT NULL DEFAULT 1,
    made_on TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS plan_swaps (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    child_id TEXT NOT NULL,
    date TEXT NOT NULL,
    slot TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_swaps_child ON plan_swaps (child_id, date);
  `,
  // 4: Kleinkind-Phase („nimou table“)
  `ALTER TABLE children ADD COLUMN table_since TEXT;`,
  // 5: Journal „Erste Male“
  `
  CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    child_id TEXT NOT NULL,
    date TEXT NOT NULL,
    kind TEXT NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    dirty INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_journal_child ON journal_entries (child_id, date);
  `,
];

export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
    });
    version += 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
