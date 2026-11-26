// KOPIE von src/purchases/entitlementLogic.ts – bei Änderungen beide Dateien aktualisieren (Test prüft Gleichheit).
/**
 * Kaufstatus aus RevenueCat-Daten ableiten – gemeinsam für App-Tests und Server (Edge Functions).
 * Reine Funktionen ohne Abhängigkeiten.
 */
export const ENTITLEMENT_ID = 'beikost_paket';
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Lebenslanger Zugang hat in RevenueCat kein Ablaufdatum. */
export const LIFETIME = '9999-12-31T00:00:00.000Z';

export interface RcEntitlement {
  expires_date?: string | null;
  purchase_date?: string | null;
}

export interface RcSubscriberResponse {
  subscriber?: { entitlements?: Record<string, RcEntitlement> };
}

/** Ablauf des Zugangs laut RevenueCat-API (GET /v1/subscribers/{id}); null = kein Zugang. */
export function accessUntilFromSubscriber(res: RcSubscriberResponse, entitlementId = ENTITLEMENT_ID): string | null {
  const e = res.subscriber?.entitlements?.[entitlementId];
  if (!e) return null;
  if (e.expires_date === null || e.expires_date === undefined) return e.purchase_date ? LIFETIME : null;
  const t = Date.parse(e.expires_date);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

export interface RcWebhookEvent {
  app_user_id?: unknown;
  original_app_user_id?: unknown;
  aliases?: unknown;
  transferred_from?: unknown;
  transferred_to?: unknown;
}

/** Alle Familien-IDs, deren Zugang sich durch das Ereignis geändert haben kann (auch bei Übertragungen). */
export function affectedFamilyIds(event: RcWebhookEvent): string[] {
  const raw: unknown[] = [
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
    ...(Array.isArray(event.transferred_from) ? event.transferred_from : []),
    ...(Array.isArray(event.transferred_to) ? event.transferred_to : []),
  ];
  const ids = raw.filter((v): v is string => typeof v === 'string' && UUID_RE.test(v)).map((v) => v.toLowerCase());
  return [...new Set(ids)].slice(0, 20);
}

/** Vergleich in konstanter Zeit, damit das Webhook-Geheimnis nicht über Antwortzeiten erraten werden kann. */
export function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
