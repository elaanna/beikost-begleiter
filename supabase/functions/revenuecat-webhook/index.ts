// Supabase Edge Function: RevenueCat-Webhook (Kauf, Verlängerung, Ablauf, Übertragung)
//
// RevenueCat ruft diese Adresse bei jedem Kaufereignis auf. Wir vertrauen dem Inhalt des Ereignisses nicht,
// sondern fragen für jede betroffene Familie den aktuellen Stand direkt bei der RevenueCat-API ab.
//
// Einrichtung:
//   supabase functions deploy revenuecat-webhook --no-verify-jwt
//   supabase secrets set REVENUECAT_WEBHOOK_SECRET=<langes Zufallsgeheimnis> REVENUECAT_SECRET_KEY=<sk_…>
//   RevenueCat → Integrations → Webhooks: URL https://<projekt>.supabase.co/functions/v1/revenuecat-webhook,
//   Authorization-Header: Bearer <REVENUECAT_WEBHOOK_SECRET>

import { affectedFamilyIds, safeEqual, type RcWebhookEvent } from '../_shared/entitlementLogic.ts';
import { json, refreshEntitlement } from '../_shared/revenuecat.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';
  if (secret.length < 24 || !safeEqual(req.headers.get('Authorization') ?? '', `Bearer ${secret}`)) {
    return json({ error: 'auth' }, 401);
  }
  let event: RcWebhookEvent;
  try {
    event = ((await req.json()) as { event?: RcWebhookEvent }).event ?? {};
  } catch {
    return json({ error: 'input' }, 400);
  }
  const ids = affectedFamilyIds(event);
  try {
    for (const id of ids) await refreshEntitlement(id);
  } catch {
    // 5xx → RevenueCat versucht es später erneut
    return json({ error: 'upstream' }, 502);
  }
  return json({ ok: true, updated: ids.length });
});
