-- Version 3: Sicherheits- und Datenschutz-Härtung (Audit 26.11.2026)
--
--  1. create_family: kein Übernehmen fremder Familien mehr (Rechteausweitung zum Owner)
--  2. Einladungen: 10 Zeichen (~49 Bit), einmalig, 48 h gültig, Fehlversuche begrenzt
--  3. join_family gibt die Rolle zurück (Leser-Geräte laden keine eigenen Daten hoch)
--  4. Mitglieder verwalten: Owner kann entfernen, Einladungen widerrufen, Familie löschen
--  5. Recht auf Löschung: delete_my_account() löscht Konto und Daten (Art. 17 DSGVO)
--  6. Datenintegrität: Kind/Person muss zur selben Familie gehören, Längenlimits, Formatprüfungen
--  7. Last-Write-Wins: Zeitstempel aus der Zukunft werden gekappt (sonst Sperren von Zeilen möglich)
--  8. Weiche Löschungen werden nach 30 Tagen endgültig entfernt (Speicherbegrenzung, Art. 5 DSGVO)
--  9. anon-Rolle hat keinen Zugriff auf Tabellen und Funktionen

-- ---------------------------------------------------------------------------
-- 1. Familie anlegen: nur neue IDs, nie eine bestehende Familie übernehmen
-- ---------------------------------------------------------------------------
alter table public.families alter column created_by drop not null;
alter table public.families drop constraint families_created_by_fkey;
alter table public.families add constraint families_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete set null;

create or replace function public.create_family(fid uuid, name text default '')
returns void language plpgsql security definer set search_path = public as $$
declare inserted int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into families (id, created_by) values (fid, auth.uid()) on conflict (id) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then
    -- Familie existiert schon: nur erlaubt, wenn man bereits Mitglied ist (idempotent), sonst Fehler
    if not is_family_member(fid) then raise exception 'family exists'; end if;
    return;
  end if;
  insert into family_members (family_id, user_id, role, display_name)
  values (fid, auth.uid(), 'owner', left(coalesce(name, ''), 60));
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Einladungen
-- ---------------------------------------------------------------------------
create table public.invite_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);
create index invite_attempts_user on public.invite_attempts (user_id, at);
alter table public.invite_attempts enable row level security; -- keine Policies: nur über Funktionen

alter table public.family_invites alter column expires_at set default now() + interval '48 hours';
-- Bestehende kurze Codes sofort ungültig machen
delete from public.family_invites;

create or replace function public.create_invite(fid uuid, invite_role text default 'member')
returns text language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- ohne 0/O, 1/I/L
  bytes bytea;
  new_code text := '';
  i int;
begin
  if not can_write_family(fid) then raise exception 'not allowed'; end if;
  if invite_role not in ('member', 'reader') then raise exception 'invalid role'; end if;
  if (select count(*) from family_invites where family_id = fid and expires_at > now()) >= 10 then
    raise exception 'too many open invites';
  end if;
  bytes := uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid());
  for i in 0..9 loop
    -- Bytes 6 und 8 einer UUID v4 enthalten feste Bits; daher nur Bytes 0–5 und 16–19 verwenden
    new_code := new_code || substr(alphabet, 1 + (get_byte(bytes, case when i < 6 then i else i + 10 end) % 31), 1);
  end loop;
  insert into family_invites (code, family_id, role) values (new_code, fid, invite_role);
  return new_code;
end;
$$;

drop function public.join_family(text, text);
create function public.join_family(invite_code text, name text default '')
returns table (family_id uuid, role text) language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  inv family_invites;
  clean text := upper(regexp_replace(coalesce(invite_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  -- Fehlversuche werden gespeichert; deshalb bei falschem Code KEINE Exception (die würde das Insert zurückrollen),
  -- sondern eine leere Ergebnismenge. Die App zeigt dann „Code ungültig oder abgelaufen“.
  if (select count(*) from invite_attempts a where a.user_id = auth.uid() and a.at > now() - interval '1 hour') >= 10 then
    raise exception 'too many attempts';
  end if;
  select * into inv from family_invites i where i.code = clean and i.expires_at > now() for update;
  if not found then
    insert into invite_attempts (user_id) values (auth.uid());
    return;
  end if;
  insert into family_members (family_id, user_id, role, display_name)
  values (inv.family_id, auth.uid(), inv.role, left(coalesce(name, ''), 60))
  on conflict on constraint family_members_pkey do nothing;
  delete from family_invites i where i.code = inv.code; -- einmalig verwendbar
  return query select m.family_id, m.role from family_members m where m.family_id = inv.family_id and m.user_id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Mitglieder verwalten
-- ---------------------------------------------------------------------------
create or replace function public.is_family_owner(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from family_members where family_id = fid and user_id = auth.uid() and role = 'owner');
$$;

create policy "Owner entfernt Mitglieder" on public.family_members
  for delete using (public.is_family_owner(family_id) and role <> 'owner');
create policy "Owner widerruft Einladungen" on public.family_invites
  for delete using (public.is_family_owner(family_id));

create or replace function public.delete_family(fid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_family_owner(fid) then raise exception 'not allowed'; end if;
  delete from families where id = fid; -- löscht per Cascade alle Daten der Familie
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Konto und Daten löschen (Art. 17 DSGVO)
--    Gibt es weitere schreibberechtigte Mitglieder, geht die Familie an das älteste über.
--    Sonst wird die Familie samt allen Daten gelöscht.
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  fam record;
  heir uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  for fam in select m.family_id from family_members m where m.user_id = auth.uid() and m.role = 'owner' loop
    if exists (select 1 from family_members o where o.family_id = fam.family_id and o.role = 'owner' and o.user_id <> auth.uid()) then
      continue;
    end if;
    select user_id into heir from family_members
      where family_id = fam.family_id and user_id <> auth.uid() and role = 'member'
      order by joined_at limit 1;
    if heir is null then
      delete from families where id = fam.family_id;
    else
      update family_members set role = 'owner' where family_id = fam.family_id and user_id = heir;
    end if;
  end loop;
  delete from auth.users where id = auth.uid(); -- entfernt Mitgliedschaften und Einladungen per Cascade
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Datenintegrität und Längenlimits
-- ---------------------------------------------------------------------------
alter table public.children add constraint children_id_family unique (id, family_id);
alter table public.caregivers add constraint caregivers_id_family unique (id, family_id);

alter table public.food_logs drop constraint food_logs_child_id_fkey;
alter table public.food_logs add constraint food_logs_child_same_family
  foreign key (child_id, family_id) references public.children (id, family_id) on delete cascade on update cascade;
alter table public.digestion_logs drop constraint digestion_logs_child_id_fkey;
alter table public.digestion_logs add constraint digestion_logs_child_same_family
  foreign key (child_id, family_id) references public.children (id, family_id) on delete cascade on update cascade;
alter table public.shift_entries drop constraint shift_entries_caregiver_id_fkey;
alter table public.shift_entries add constraint shift_entries_caregiver_same_family
  foreign key (caregiver_id, family_id) references public.caregivers (id, family_id) on delete cascade on update cascade;

alter table public.shift_entries add constraint shift_entries_id_format check (id = caregiver_id::text || ':' || date::text);
alter table public.family_settings add constraint family_settings_one_per_family check (id = family_id);

alter table public.children add constraint children_name_len check (char_length(name) between 1 and 60);
alter table public.children add constraint children_json_arrays
  check (jsonb_typeof(exclusions) = 'array' and jsonb_typeof(excluded_foods) = 'array');
alter table public.food_logs add constraint food_logs_lengths check (char_length(food_id) <= 60 and char_length(note) <= 500);
alter table public.digestion_logs add constraint digestion_logs_note_len check (char_length(note) <= 500);
alter table public.caregivers add constraint caregivers_lengths check (char_length(name) <= 40 and char_length(emoji) <= 16);
alter table public.family_settings add constraint family_settings_size check (pg_column_size(data) <= 16384);
alter table public.family_members add constraint family_members_name_len check (char_length(display_name) <= 60);

-- ---------------------------------------------------------------------------
-- 7. Last-Write-Wins mit gekappten Zeitstempeln
-- ---------------------------------------------------------------------------
create or replace function public.lww_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.updated_at > now() + interval '5 minutes' then
    new.updated_at := now();
  end if;
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return old;
  end if;
  new.server_updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Weich gelöschte Zeilen nach 30 Tagen endgültig entfernen
--    Einplanen mit pg_cron (Dashboard → Integrations → Cron):
--    select cron.schedule('purge-deleted', '17 3 * * *', 'select public.purge_deleted()');
-- ---------------------------------------------------------------------------
create or replace function public.purge_deleted()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from food_logs where deleted and server_updated_at < now() - interval '30 days';
  delete from digestion_logs where deleted and server_updated_at < now() - interval '30 days';
  delete from shift_entries where deleted and server_updated_at < now() - interval '30 days';
  delete from caregivers where deleted and server_updated_at < now() - interval '30 days';
  delete from children where deleted and server_updated_at < now() - interval '30 days';
  delete from family_invites where expires_at < now();
  delete from invite_attempts where at < now() - interval '1 day';
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Rechte: anon bekommt nichts, Funktionen nur für angemeldete Nutzer
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on public.invite_attempts from anon, authenticated;

revoke all on function public.is_family_member(uuid) from public, anon;
revoke all on function public.can_write_family(uuid) from public, anon;
revoke all on function public.is_family_owner(uuid) from public, anon;
revoke all on function public.create_family(uuid, text) from public, anon;
revoke all on function public.create_invite(uuid, text) from public, anon;
revoke all on function public.join_family(text, text) from public, anon;
revoke all on function public.delete_family(uuid) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
revoke all on function public.purge_deleted() from public, anon, authenticated;

grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.can_write_family(uuid) to authenticated;
grant execute on function public.is_family_owner(uuid) to authenticated;
grant execute on function public.create_family(uuid, text) to authenticated;
grant execute on function public.create_invite(uuid, text) to authenticated;
grant execute on function public.join_family(text, text) to authenticated;
grant execute on function public.delete_family(uuid) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
