import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import type { Child, FoodLog, Liking, MealSlot, Reaction } from '@/domain/types';
import type { DigestionLog, StoolKind } from '@/domain/digestion';
import type { Caregiver, FamilySettings, ShiftEntry, ShiftKind } from '@/domain/shifts';
import { DEFAULT_SETTINGS } from '@/domain/shifts';

export const newId = () => Crypto.randomUUID();
const now = () => new Date().toISOString();

interface ChildRow {
  id: string; family_id: string; name: string; birth_date: string; approach: string; milk: string;
  atopic_dermatitis: number; peanut_cleared: number; start_date: string | null;
  exclusions: string; excluded_foods: string; table_since?: string | null;
}

interface LogRow {
  id: string; child_id: string; food_id: string; date: string; liking: number; reaction: string; note: string;
}

const toChild = (r: ChildRow): Child => ({
  id: r.id,
  familyId: r.family_id,
  name: r.name,
  birthDate: r.birth_date,
  approach: r.approach as Child['approach'],
  milk: r.milk as Child['milk'],
  atopicDermatitis: !!r.atopic_dermatitis,
  peanutCleared: !!r.peanut_cleared,
  startDate: r.start_date,
  exclusions: JSON.parse(r.exclusions),
  excludedFoods: JSON.parse(r.excluded_foods),
  tableSince: r.table_since ?? null,
});

const toLog = (r: LogRow): FoodLog => ({
  id: r.id,
  childId: r.child_id,
  foodId: r.food_id,
  date: r.date,
  liking: r.liking as Liking,
  reaction: r.reaction as Reaction,
  note: r.note,
});

// ---------- Meta (Familien-ID, aktives Kind, letzter Sync) ----------

export async function getMeta(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setMeta(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
}

/** Lokale Familien-ID. Wird beim ersten Start erzeugt und beim Beitritt zu einer Familie ersetzt. */
export async function ensureFamilyId(db: SQLiteDatabase): Promise<string> {
  const existing = await getMeta(db, 'family_id');
  if (existing) return existing;
  const id = newId();
  await setMeta(db, 'family_id', id);
  return id;
}

// ---------- Kinder ----------

export async function listChildren(db: SQLiteDatabase): Promise<Child[]> {
  const rows = await db.getAllAsync<ChildRow>('SELECT * FROM children WHERE deleted = 0 ORDER BY birth_date');
  return rows.map(toChild);
}

export async function saveChild(db: SQLiteDatabase, child: Child): Promise<void> {
  await db.runAsync(
    `INSERT INTO children (id, family_id, name, birth_date, approach, milk, atopic_dermatitis, peanut_cleared,
       start_date, exclusions, excluded_foods, table_since, updated_at, deleted, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, birth_date = excluded.birth_date, approach = excluded.approach, milk = excluded.milk,
       atopic_dermatitis = excluded.atopic_dermatitis, peanut_cleared = excluded.peanut_cleared,
       start_date = excluded.start_date, exclusions = excluded.exclusions, excluded_foods = excluded.excluded_foods,
       table_since = excluded.table_since, updated_at = excluded.updated_at, deleted = 0, dirty = 1`,
    child.id, child.familyId, child.name, child.birthDate, child.approach, child.milk,
    child.atopicDermatitis ? 1 : 0, child.peanutCleared ? 1 : 0, child.startDate,
    JSON.stringify(child.exclusions), JSON.stringify(child.excludedFoods), child.tableSince ?? null, now(),
  );
}

export async function deleteChild(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE children SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', now(), id);
}

// ---------- Tracker ----------

export async function listLogs(db: SQLiteDatabase, childId: string): Promise<FoodLog[]> {
  const rows = await db.getAllAsync<LogRow>(
    'SELECT * FROM food_logs WHERE child_id = ? AND deleted = 0 ORDER BY date DESC',
    childId,
  );
  return rows.map(toLog);
}

export async function addLog(
  db: SQLiteDatabase,
  familyId: string,
  log: Omit<FoodLog, 'id'>,
): Promise<string> {
  const id = newId();
  await db.runAsync(
    `INSERT INTO food_logs (id, family_id, child_id, food_id, date, liking, reaction, note, updated_at, deleted, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
    id, familyId, log.childId, log.foodId, log.date, log.liking, log.reaction, log.note, now(),
  );
  return id;
}

export async function deleteLog(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE food_logs SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', now(), id);
}

// ---------- Einkaufsliste (abgehakt, nur lokal) ----------

export async function listChecks(db: SQLiteDatabase, week: string): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ food_id: string }>('SELECT food_id FROM shopping_checks WHERE week = ?', week);
  return new Set(rows.map((r) => r.food_id));
}

export async function toggleCheck(db: SQLiteDatabase, week: string, foodId: string, checked: boolean): Promise<void> {
  if (checked) await db.runAsync('INSERT OR IGNORE INTO shopping_checks (week, food_id) VALUES (?, ?)', week, foodId);
  else await db.runAsync('DELETE FROM shopping_checks WHERE week = ? AND food_id = ?', week, foodId);
}

// ---------- Verdauung ----------


export async function listDigestion(db: SQLiteDatabase, childId: string): Promise<DigestionLog[]> {
  const rows = await db.getAllAsync<{ id: string; child_id: string; date: string; kind: string; note: string }>(
    'SELECT * FROM digestion_logs WHERE child_id = ? AND deleted = 0 ORDER BY date DESC, updated_at DESC',
    childId,
  );
  return rows.map((r) => ({ id: r.id, childId: r.child_id, date: r.date, kind: r.kind as StoolKind, note: r.note }));
}

export async function addDigestion(db: SQLiteDatabase, familyId: string, childId: string, date: string, kind: StoolKind): Promise<string> {
  const id = newId();
  await db.runAsync(
    `INSERT INTO digestion_logs (id, family_id, child_id, date, kind, note, updated_at, deleted, dirty)
     VALUES (?, ?, ?, ?, ?, '', ?, 0, 1)`,
    id, familyId, childId, date, kind, now(),
  );
  return id;
}

export async function deleteDigestion(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE digestion_logs SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', now(), id);
}

// ---------- Betreuungspersonen und Dienste ----------

export async function listCaregivers(db: SQLiteDatabase): Promise<Caregiver[]> {
  return db.getAllAsync<Caregiver>('SELECT id, name, emoji FROM caregivers WHERE deleted = 0 ORDER BY updated_at');
}

export async function saveCaregiver(db: SQLiteDatabase, familyId: string, c: Caregiver): Promise<void> {
  await db.runAsync(
    `INSERT INTO caregivers (id, family_id, name, emoji, updated_at, deleted, dirty) VALUES (?, ?, ?, ?, ?, 0, 1)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, emoji = excluded.emoji, updated_at = excluded.updated_at, deleted = 0, dirty = 1`,
    c.id, familyId, c.name, c.emoji, now(),
  );
}

export async function deleteCaregiver(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE caregivers SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', now(), id);
}

export async function listShifts(db: SQLiteDatabase, from: string, to: string): Promise<ShiftEntry[]> {
  const rows = await db.getAllAsync<{ caregiver_id: string; date: string; kind: string }>(
    'SELECT caregiver_id, date, kind FROM shift_entries WHERE deleted = 0 AND date >= ? AND date <= ?',
    from, to,
  );
  return rows.map((r) => ({ caregiverId: r.caregiver_id, date: r.date, kind: r.kind as ShiftKind }));
}

/** Ein Eintrag pro Person und Tag – die ID ist daher zusammengesetzt. */
export async function setShift(db: SQLiteDatabase, familyId: string, caregiverId: string, date: string, kind: ShiftKind): Promise<void> {
  await db.runAsync(
    `INSERT INTO shift_entries (id, family_id, caregiver_id, date, kind, updated_at, deleted, dirty) VALUES (?, ?, ?, ?, ?, ?, 0, 1)
     ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, updated_at = excluded.updated_at, deleted = 0, dirty = 1`,
    `${caregiverId}:${date}`, familyId, caregiverId, date, kind, now(),
  );
}

// ---------- Familien-Einstellungen (Dienstzeiten, Kita, Essenszeiten) ----------

export async function getFamilySettings(db: SQLiteDatabase, familyId: string): Promise<FamilySettings> {
  const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM family_settings WHERE id = ? AND deleted = 0', familyId);
  if (!row) return DEFAULT_SETTINGS;
  const stored = JSON.parse(row.data) as Partial<FamilySettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    shiftTimes: { ...DEFAULT_SETTINGS.shiftTimes, ...stored.shiftTimes },
    kita: { ...DEFAULT_SETTINGS.kita, ...stored.kita },
    mealTimes: { ...DEFAULT_SETTINGS.mealTimes, ...stored.mealTimes },
  };
}

export async function saveFamilySettings(db: SQLiteDatabase, familyId: string, s: FamilySettings): Promise<void> {
  await db.runAsync(
    `INSERT INTO family_settings (id, family_id, data, updated_at, deleted, dirty) VALUES (?, ?, ?, ?, 0, 1)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, deleted = 0, dirty = 1`,
    familyId, familyId, JSON.stringify(s), now(),
  );
}

// ---------- Vorrat & Gefrierfach ----------

export type StockKind = 'gefroren' | 'vorrat';

export interface StockItem {
  id: string;
  kind: StockKind;
  name: string;
  recipeId: string | null;
  foodId: string | null;
  portions: number;
  madeOn: string;
}

export async function listStock(db: SQLiteDatabase): Promise<StockItem[]> {
  const rows = await db.getAllAsync<{ id: string; kind: string; name: string; recipe_id: string | null; food_id: string | null; portions: number; made_on: string }>(
    'SELECT id, kind, name, recipe_id, food_id, portions, made_on FROM stock_items WHERE deleted = 0 ORDER BY made_on',
  );
  return rows.map((r) => ({ id: r.id, kind: r.kind as StockKind, name: r.name, recipeId: r.recipe_id, foodId: r.food_id, portions: r.portions, madeOn: r.made_on }));
}

export async function saveStock(db: SQLiteDatabase, familyId: string, item: StockItem): Promise<void> {
  await db.runAsync(
    `INSERT INTO stock_items (id, family_id, kind, name, recipe_id, food_id, portions, made_on, updated_at, deleted, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, portions = excluded.portions, made_on = excluded.made_on,
       updated_at = excluded.updated_at, deleted = 0, dirty = 1`,
    item.id, familyId, item.kind, item.name.slice(0, 60), item.recipeId, item.foodId, Math.max(0, Math.min(99, item.portions)), item.madeOn, now(),
  );
}

export async function deleteStock(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE stock_items SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', now(), id);
}

// ---------- Getauschte Mahlzeiten ----------

export interface PlanSwap {
  date: string;
  slot: MealSlot;
  recipeId: string;
}

export async function listSwaps(db: SQLiteDatabase, childId: string): Promise<PlanSwap[]> {
  const rows = await db.getAllAsync<{ date: string; slot: string; recipe_id: string }>(
    'SELECT date, slot, recipe_id FROM plan_swaps WHERE deleted = 0 AND child_id = ?', childId,
  );
  return rows.map((r) => ({ date: r.date, slot: r.slot as MealSlot, recipeId: r.recipe_id }));
}

/** Eine Mahlzeit pro Kind, Tag und Mahlzeit-Slot – die ID ist zusammengesetzt. recipeId null = Tausch zurücknehmen. */
export async function setSwap(db: SQLiteDatabase, familyId: string, childId: string, date: string, slot: MealSlot, recipeId: string | null): Promise<void> {
  const id = `${childId}:${date}:${slot}`;
  if (recipeId === null) {
    await db.runAsync('UPDATE plan_swaps SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', now(), id);
    return;
  }
  await db.runAsync(
    `INSERT INTO plan_swaps (id, family_id, child_id, date, slot, recipe_id, updated_at, deleted, dirty) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)
     ON CONFLICT(id) DO UPDATE SET recipe_id = excluded.recipe_id, updated_at = excluded.updated_at, deleted = 0, dirty = 1`,
    id, familyId, childId, date, slot, recipeId, now(),
  );
}

// ---------- Journal „Erste Male“ ----------

export interface JournalEntry {
  id: string;
  childId: string;
  date: string;
  kind: string;
  text: string;
}

export async function listJournal(db: SQLiteDatabase, childId: string): Promise<JournalEntry[]> {
  const rows = await db.getAllAsync<{ id: string; child_id: string; date: string; kind: string; text: string }>(
    'SELECT id, child_id, date, kind, text FROM journal_entries WHERE child_id = ? AND deleted = 0 ORDER BY date DESC',
    childId,
  );
  return rows.map((r) => ({ id: r.id, childId: r.child_id, date: r.date, kind: r.kind, text: r.text }));
}

export async function saveJournal(db: SQLiteDatabase, familyId: string, e: JournalEntry): Promise<void> {
  await db.runAsync(
    `INSERT INTO journal_entries (id, family_id, child_id, date, kind, text, updated_at, deleted, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)
     ON CONFLICT(id) DO UPDATE SET date = excluded.date, kind = excluded.kind, text = excluded.text,
       updated_at = excluded.updated_at, deleted = 0, dirty = 1`,
    e.id, familyId, e.childId, e.date, e.kind.slice(0, 30), e.text.slice(0, 200), now(),
  );
}

export async function deleteJournal(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE journal_entries SET deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', now(), id);
}
