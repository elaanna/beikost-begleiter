-- Erwartet: T2/T7 "family exists", T6 RLS-Fehler, T8 Treffer 0, T9/T13 "too many attempts",
-- T10 Fremdschlüssel, T11 true, T12 Längenprüfung, T15 0, T17 permission denied, T18 alles 0, T20 alles 0.
\set ON_ERROR_STOP 0
\set VERBOSITY terse
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select public.create_family('aaaaaaaa-0000-0000-0000-000000000000', 'Mama');
select public.create_family('aaaaaaaa-0000-0000-0000-000000000000', 'Mama'); -- idempotent für Mitglied
insert into children (id, family_id, name, birth_date, approach, milk, updated_at) values ('cccccccc-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000000','Mia','2026-04-01','brei','flasche', now());
insert into food_logs (id, family_id, child_id, food_id, date, updated_at) values (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000000','cccccccc-0000-0000-0000-000000000001','ei','2026-11-20', now());
select public.create_invite('aaaaaaaa-0000-0000-0000-000000000000', 'reader') as code \gset
select 'T1 Code: ' || :'code' || ' Länge ' || length(:'code');
-- Fremder (3) kennt die Familien-ID
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
select 'T2 Fremder create_family:'; select public.create_family('aaaaaaaa-0000-0000-0000-000000000000', 'x');
select 'T3 Fremder liest Kinder: ' || count(*) from children;
-- Leser (2) tritt bei, Code mit Kleinbuchstaben und Bindestrich
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
select 'T4 join: ' || role from public.join_family(lower(substr(:'code',1,5)) || '-' || substr(:'code',6), 'Kita');
select 'T5 Leser liest Kinder: ' || count(*) from children;
select 'T6 Leser schreibt:'; insert into food_logs (id, family_id, child_id, food_id, date, updated_at) values (gen_random_uuid(),'aaaaaaaa-0000-0000-0000-000000000000','cccccccc-0000-0000-0000-000000000001','ei','2026-11-21', now());
select 'T7 Leser verlässt + create_family:'; delete from family_members where user_id = auth.uid(); select public.create_family('aaaaaaaa-0000-0000-0000-000000000000', 'x');
select 'T7b Leser liest nach Austritt: ' || count(*) from children;
-- Code nochmal (3)
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
select 'T8 Code erneut, Treffer: ' || count(*) from public.join_family(:'code', '');
-- Brute Force (4)
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000004';
select count(*) from generate_series(1,10) g, lateral public.join_family('AAAAAAAAA' || g, '') j;
select 'T9 11. Versuch:'; select * from public.join_family('BBBBBBBBBB', '');
-- Owner: fremdes Kind, Zukunftszeitstempel
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
select public.create_family('bbbbbbbb-0000-0000-0000-000000000000', 'Andere');
select 'T10 Log auf fremdes Kind:'; insert into food_logs (id, family_id, child_id, food_id, date, updated_at) values (gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000000','cccccccc-0000-0000-0000-000000000001','ei','2026-11-21', now());
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
update children set name = 'Mia2', updated_at = '2099-01-01' where id = 'cccccccc-0000-0000-0000-000000000001';
select 'T11 Zeitstempel gekappt: ' || (updated_at < now() + interval '1 hour') from children;
select 'T12 Notiz zu lang:'; update food_logs set note = repeat('x', 600), updated_at = now() + interval '1 second';
-- Mitglied entfernen
select public.create_invite('aaaaaaaa-0000-0000-0000-000000000000', 'member') as code2 \gset
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000004';
select 'T13 Brute-Force-Nutzer gesperrt, auch mit richtigem Code:'; select * from public.join_family(:'code2', '');
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
select 'T14 join member: ' || role from public.join_family(:'code2', 'Papa');
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
delete from family_members where user_id = '00000000-0000-0000-0000-000000000002';
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
select 'T15 Entfernter liest: ' || count(*) from children;
select 'T16 Mitglied entfernt Owner: '; delete from family_members where role = 'owner';
-- anon
reset role; set role anon;
select 'T17 anon:'; select count(*) from children;
select 'T17b anon rpc:'; select public.create_invite('aaaaaaaa-0000-0000-0000-000000000000');
-- Konto löschen
reset role; set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select public.delete_my_account();
reset role;
select 'T18 nach Löschen: Familien ' || (select count(*) from families where id = 'aaaaaaaa-0000-0000-0000-000000000000') || ', Kinder ' || (select count(*) from children) || ', Logs ' || (select count(*) from food_logs) || ', User ' || (select count(*) from auth.users where id = '00000000-0000-0000-0000-000000000001');
select public.purge_deleted(); select 'T19 purge ok';

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
insert into children (id, family_id, name, birth_date, approach, milk, updated_at) values ('cccccccc-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000000','Ben','2026-04-01','brei','flasche', now());
select public.delete_my_account();
reset role;
select 'T20 Allein-Owner gelöscht: Familien ' || (select count(*) from families where id = 'bbbbbbbb-0000-0000-0000-000000000000') || ', Kinder ' || (select count(*) from children where id = 'cccccccc-0000-0000-0000-000000000003');
select 'T21 Erbe ist Owner: ' || role from family_members where family_id = 'aaaaaaaa-0000-0000-0000-000000000000';
