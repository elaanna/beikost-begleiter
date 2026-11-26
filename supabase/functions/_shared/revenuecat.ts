// Gemeinsamer Server-Code: Kaufstatus bei RevenueCat abfragen und in public.entitlements speichern.
// Secrets: REVENUECAT_SECRET_KEY (geheimer API-Schlüssel, v1), SUPABASE_SERVICE_ROLE_KEY (automatisch vorhanden)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { accessUntilFromSubscriber, type RcSubscriberResponse } from './entitlementLogic.ts';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

/** Fragt RevenueCat nach dem Zugang der Familie und speichert das Ergebnis. Gibt das Ablaufdatum zurück (null = kein Zugang). */
export async function refreshEntitlement(familyId: string): Promise<string | null> {
  const key = Deno.env.get('REVENUECAT_SECRET_KEY');
  if (!key) throw new Error('REVENUECAT_SECRET_KEY fehlt');
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(familyId)}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`RevenueCat ${res.status}`);
  const until = accessUntilFromSubscriber((await res.json()) as RcSubscriberResponse);
  const { error } = await adminClient()
    .from('entitlements')
    .upsert({ family_id: familyId, active_until: until, checked_at: new Date().toISOString() });
  if (error) throw error;
  return until;
}
