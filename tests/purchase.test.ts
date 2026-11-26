import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { accessUntilFromSubscriber, affectedFamilyIds, LIFETIME, safeEqual } from '../src/purchases/entitlementLogic';

const FID = '3f2b8c1e-1111-4a2b-8c3d-1234567890ab';

test('Zugang aus RevenueCat-Antwort', () => {
  assert.equal(accessUntilFromSubscriber({ subscriber: { entitlements: {} } }), null);
  assert.equal(accessUntilFromSubscriber({}), null);
  assert.equal(
    accessUntilFromSubscriber({ subscriber: { entitlements: { beikost_paket: { expires_date: '2027-11-26T10:00:00Z', purchase_date: '2026-11-26T10:00:00Z' } } } }),
    '2027-11-26T10:00:00.000Z',
  );
  assert.equal(accessUntilFromSubscriber({ subscriber: { entitlements: { beikost_paket: { expires_date: null, purchase_date: '2026-11-26T10:00:00Z' } } } }), LIFETIME);
  assert.equal(accessUntilFromSubscriber({ subscriber: { entitlements: { anderes: { expires_date: '2030-01-01T00:00:00Z' } } } }), null);
  assert.equal(accessUntilFromSubscriber({ subscriber: { entitlements: { beikost_paket: { expires_date: 'kaputt' } } } }), null);
});

test('Betroffene Familien eines Webhooks, auch bei Übertragung', () => {
  const other = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  assert.deepEqual(affectedFamilyIds({ app_user_id: FID, original_app_user_id: FID.toUpperCase(), aliases: [FID, '$RCAnonymousID:abc'] }), [FID]);
  assert.deepEqual(affectedFamilyIds({ transferred_from: [other], transferred_to: [FID] }), [other, FID]);
  assert.deepEqual(affectedFamilyIds({ app_user_id: "x'; drop table" }), []);
  assert.deepEqual(affectedFamilyIds({ aliases: 'kein-array' }), []);
});

test('Geheimnis-Vergleich', () => {
  assert.equal(safeEqual('Bearer abc', 'Bearer abc'), true);
  assert.equal(safeEqual('Bearer abd', 'Bearer abc'), false);
  assert.equal(safeEqual('Bearer ab', 'Bearer abc'), false);
  assert.equal(safeEqual('', 'Bearer abc'), false);
});

test('Server-Kopie der Kauflogik ist identisch', () => {
  const app = readFileSync('src/purchases/entitlementLogic.ts', 'utf8');
  const server = readFileSync('supabase/functions/_shared/entitlementLogic.ts', 'utf8').split('\n').slice(1).join('\n');
  assert.equal(server, app);
});
