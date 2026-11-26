-- Version 5: Kauf serverseitig prüfen, Zugang pro Familie
--
-- Die App meldet sich bei RevenueCat mit der Familien-ID als App User ID an. Ein Kauf gilt damit für die ganze Familie.
-- Der Server erfährt den Kaufstatus nur von RevenueCat selbst (Webhook bzw. Abgleich über die RevenueCat-API in den
-- Edge Functions „revenuecat-webhook“ und „kauf-abgleich“), nie von der App. Nutzer können die Tabelle nur lesen.

create table public.entitlements (
  family_id uuid primary key,              -- bewusst ohne Fremdschlüssel: Kauf kann vor der ersten Familienfreigabe passieren
  active_until timestamptz,                -- null = kein Zugang
  checked_at timestamptz not null default now()
);
alter table public.entitlements enable row level security;
create policy "Zugang lesen" on public.entitlements for select using (public.is_family_member(family_id));
revoke all on public.entitlements from anon;
revoke insert, update, delete, truncate on public.entitlements from authenticated;

-- Schalter für Entwicklung und Tests ohne RevenueCat. Standard: Kauf wird geprüft.
create table public.app_config (key text primary key, value text not null);
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;
insert into public.app_config values ('require_entitlement', 'true');

create or replace function public.family_has_access(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_family_member(fid) and (
    coalesce((select value from app_config where key = 'require_entitlement'), 'true') <> 'true'
    or exists (select 1 from entitlements e where e.family_id = fid and e.active_until > now())
  );
$$;
revoke all on function public.family_has_access(uuid) from public, anon;
grant execute on function public.family_has_access(uuid) to authenticated;

-- Einladen (= Familienfreigabe) gehört zum Beikost-Paket
create or replace function public.create_invite(fid uuid, invite_role text default 'member')
returns text language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- ohne 0/O, 1/I/L
  bytes bytea;
  new_code text := '';
  i int;
begin
  if not can_write_family(fid) then raise exception 'not allowed'; end if;
  if not family_has_access(fid) then raise exception 'no entitlement'; end if;
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

-- Konto auf neuem Gerät: zu welcher Familie gehöre ich? (nur eigene Zeile)
create or replace function public.my_family()
returns table (family_id uuid, role text) language sql stable security definer set search_path = public as $$
  select m.family_id, m.role from family_members m where m.user_id = auth.uid() order by m.joined_at limit 1;
$$;
revoke all on function public.my_family() from public, anon;
grant execute on function public.my_family() to authenticated;
