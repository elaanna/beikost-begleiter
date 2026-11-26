\set VERBOSITY terse
insert into auth.users values ('00000000-0000-0000-0000-000000000011'),('00000000-0000-0000-0000-000000000012') on conflict do nothing;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';
select public.create_family('11111111-0000-0000-0000-000000000000', '');
select public.create_invite('11111111-0000-0000-0000-000000000000', 'member') as code \gset
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000012';
select public.create_family('22222222-0000-0000-0000-000000000000', '');
insert into children (id, family_id, name, birth_date, approach, milk, updated_at) values ('cccccccc-0000-0000-0000-000000000012','22222222-0000-0000-0000-000000000000','Lea','2026-04-01','brei','flasche', now());
insert into food_logs (id, family_id, child_id, food_id, date, updated_at) values ('dddddddd-0000-0000-0000-000000000012','22222222-0000-0000-0000-000000000000','cccccccc-0000-0000-0000-000000000012','ei','2026-11-20', now());
select 'J1 ' || role from public.join_family(:'code', '');
-- Sync-Upsert wie in der App: erst Kinder, dann Logs
insert into children (id, family_id, name, birth_date, approach, milk, updated_at) values ('cccccccc-0000-0000-0000-000000000012','11111111-0000-0000-0000-000000000000','Lea','2026-04-01','brei','flasche', now())
  on conflict (id) do update set family_id = excluded.family_id, updated_at = excluded.updated_at;
insert into food_logs (id, family_id, child_id, food_id, date, updated_at) values ('dddddddd-0000-0000-0000-000000000012','11111111-0000-0000-0000-000000000000','cccccccc-0000-0000-0000-000000000012','ei','2026-11-20', now())
  on conflict (id) do update set family_id = excluded.family_id, updated_at = excluded.updated_at;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';
select 'J2 Owner sieht Kind+Log: ' || (select count(*) from children where family_id = '11111111-0000-0000-0000-000000000000') || '/' || (select count(*) from food_logs where family_id = '11111111-0000-0000-0000-000000000000');
-- Version 4: Vorrat und Tausch
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';
insert into stock_items (id, family_id, kind, name, portions, made_on, updated_at) values (gen_random_uuid(), '11111111-0000-0000-0000-000000000000', 'gefroren', 'Kürbisbrei', 4, '2026-11-20', now());
insert into plan_swaps (id, family_id, child_id, date, slot, recipe_id, updated_at) values ('cccccccc-0000-0000-0000-000000000012:2026-11-27:mittag', '11111111-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000012', '2026-11-27', 'mittag', 'kuerbis-kartoffel', now());
select 'V1 Vorrat+Tausch: ' || (select count(*) from stock_items) || '/' || (select count(*) from plan_swaps);
select 'V2 falsches ID-Format:'; insert into plan_swaps (id, family_id, child_id, date, slot, recipe_id, updated_at) values ('x', '11111111-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000012', '2026-11-28', 'mittag', 'a', now());
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
select 'V3 Fremder sieht Vorrat: ' || count(*) from stock_items;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000012';
select 'V4 KI-Kontingent (Limit 2): ' || public.take_ai_quota(2) || ',' || public.take_ai_quota(2) || ',' || public.take_ai_quota(2);
