import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform, Share } from 'react-native';

/** Tabellen mit personenbezogenen Daten (Art. 15/20 DSGVO: Auskunft und Datenübertragbarkeit). */
const EXPORT_TABLES = ['children', 'food_logs', 'digestion_logs', 'caregivers', 'shift_entries', 'family_settings', 'stock_items', 'plan_swaps', 'journal_entries', 'shopping_checks', 'appointments'] as const;
const EXPORT_META = ['consent_health', 'reminders', 'family_role', 'sharing', 'parent_name', 'packliste'];

export async function collectExport(db: SQLiteDatabase): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {
    app: 'nimou',
    exportedAt: new Date().toISOString(),
    hinweis: 'Alle auf diesem Gerät gespeicherten Daten im JSON-Format.',
  };
  for (const t of EXPORT_TABLES) {
    const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${t}`);
    out[t] = rows.map(({ dirty: _dirty, ...rest }) => rest);
  }
  const meta: Record<string, string> = {};
  for (const key of EXPORT_META) {
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', key);
    if (row) meta[key] = row.value;
  }
  out.einstellungen = meta;
  return out;
}

/** Export teilen: auf dem Handy über das Teilen-Menü, im Browser als Datei-Download. */
export async function shareExport(db: SQLiteDatabase): Promise<void> {
  const json = JSON.stringify(await collectExport(db), null, 2);
  const name = `nimou-daten-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: name, message: json });
}
