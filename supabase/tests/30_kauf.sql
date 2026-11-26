-- Kaufprüfung pro Familie. Erwartet: K1 "no entitlement", K2 Code, K3 RLS/permission denied, K4 1, K5 0,
-- K6 "no entitlement" (abgelaufen), K7 Familie+Rolle, K8 leer, K9 false.
\set VERBOSITY terse
reset role;
update public.app_config set value = 'true' where key = 'require_entitlement';
insert into auth.users values ('00000000-0000-0000-0000-000000000021'),('00000000-0000-0000-0000-000000000022') on conflict do nothing;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000021';
select public.create_family('33333333-0000-0000-0000-000000000000', '');
select 'K1 ohne Kauf:'; select public.create_invite('33333333-0000-0000-0000-000000000000', 'member');
reset role;
insert into public.entitlements (family_id, active_until) values ('33333333-0000-0000-0000-000000000000', now() + interval '1 year');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000021';
select 'K2 mit Kauf: ' || length(public.create_invite('33333333-0000-0000-0000-000000000000', 'member'));
select 'K3 Nutzer schreibt Zugang selbst:'; insert into public.entitlements (family_id, active_until) values ('44444444-0000-0000-0000-000000000000', now() + interval '9 years');
select 'K3b Nutzer verlängert:'; update public.entitlements set active_until = now() + interval '9 years';
select 'K4 Mitglied sieht Zugang: ' || count(*) from public.entitlements;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000022';
select 'K5 Fremder sieht Zugang: ' || count(*) from public.entitlements;
reset role;
update public.entitlements set active_until = now() - interval '1 day' where family_id = '33333333-0000-0000-0000-000000000000';
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000021';
select 'K6 abgelaufen:'; select public.create_invite('33333333-0000-0000-0000-000000000000', 'member');
select 'K7 my_family: ' || family_id || ' ' || role from public.my_family();
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000022';
select 'K8 my_family Fremder: ' || count(*) from public.my_family();
select 'K9 Fremder family_has_access: ' || public.family_has_access('33333333-0000-0000-0000-000000000000');
