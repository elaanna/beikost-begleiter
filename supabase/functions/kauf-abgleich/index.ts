// Supabase Edge Function: Kaufstatus sofort abgleichen (direkt nach dem Kauf, vor der ersten Einladung)
//
// Der Webhook kommt manchmal mit Verzögerung. Die App ruft deshalb vor dem Erstellen einer Einladung diese Funktion auf.
// Nur Mitglieder der Familie dürfen den Abgleich auslösen. Die App liefert keinen Kaufstatus –
// der Server fragt ihn selbst bei RevenueCat ab.
//
// Einrichtung: supabase functions deploy kauf-abgleich   (Secrets wie beim Webhook)

import { createClient } from 'npm:@supabase/supabase-js@2';
import { UUID_RE } from '../_shared/entitlementLogic.ts';
import { CORS, json, refreshEntitlement } from '../_shared/revenuecat.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const user = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: auth } = await user.auth.getUser();
  if (!auth?.user) return json({ error: 'auth' }, 401);

  let familyId = '';
  try {
    familyId = String(((await req.json()) as { familyId?: unknown }).familyId ?? '').toLowerCase();
  } catch {
    return json({ error: 'input' }, 400);
  }
  if (!UUID_RE.test(familyId)) return json({ error: 'input' }, 400);

  const { data: member } = await user.rpc('is_family_member', { fid: familyId });
  if (member !== true) return json({ error: 'not allowed' }, 403);

  try {
    const until = await refreshEntitlement(familyId);
    return json({ active: until !== null && Date.parse(until) > Date.now() });
  } catch {
    return json({ error: 'upstream' }, 502);
  }
});
