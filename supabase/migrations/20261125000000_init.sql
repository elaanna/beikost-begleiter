-- Beikost-Begleiter: Familienkonto mit Row Level Security
-- Region: EU (Frankfurt, eu-central-1) beim Anlegen des Projekts wählen.
-- Auth: "Anonymous sign-ins" aktivieren, damit Sync ohne Pflicht-Konto funktioniert.

-- ---------------------------------------------------------------------------
-- Familien und Mitglieder
-- ---------------------------------------------------------------------------
create table public.families (
  id uuid primary key,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.family_members (
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member', 'reader')),
  display_name text not null default '',
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table public.family_invites (
  code text primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'reader')),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days'
);

-- Hilfsfunktionen (security definer, damit RLS-Policies nicht rekursiv werden)
create or replace function public.is_family_member(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from family_members where family_id = fid and user_id = auth.uid());
$$;

create or replace function public.can_write_family(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from family_members where family_id = fid and user_id = auth.uid() and role in ('owner', 'member')
  );
$$;

-- Familie anlegen: die lokale Familien-ID der App wird übernommen
create or replace function public.create_family(fid uuid, name text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into families (id, created_by) values (fid, auth.uid()) on conflict (id) do nothing;
  insert into family_members (family_id, user_id, role, display_name)
  values (fid, auth.uid(), 'owner', name) on conflict do nothing;
end;
$$;

-- Einladungscode erzeugen (6 Zeichen, 7 Tage gültig)
create or replace function public.create_invite(fid uuid, invite_role text default 'member')
returns text language plpgsql security definer set search_path = public as $$
declare new_code text;
begin
  if not can_write_family(fid) then raise exception 'not allowed'; end if;
  -- gen_random_uuid() ist ab Postgres 13 eingebaut (kein pgcrypto im search_path nötig)
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into family_invites (code, family_id, role) values (new_code, fid, invite_role);
  return new_code;
end;
$$;

-- Mit Code beitreten; gibt die Familien-ID zurück
create or replace function public.join_family(invite_code text, name text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare inv family_invites;
begin
  select * into inv from family_invites where code = upper(invite_code) and expires_at > now();
  if not found then raise exception 'invalid or expired code'; end if;
  insert into family_members (family_id, user_id, role, display_name)
  values (inv.family_id, auth.uid(), inv.role, name) on conflict do nothing;
  return inv.family_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Daten: Kinder und Tracker
-- updated_at kommt vom Gerät (Last-Write-Wins), server_updated_at dient als Sync-Cursor.
-- ---------------------------------------------------------------------------
create table public.children (
  id uuid primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  birth_date date not null,
  approach text not null check (approach in ('brei', 'blw', 'gemischt')),
  milk text not null check (milk in ('stillen', 'flasche', 'beides')),
  atopic_dermatitis boolean not null default false,
  peanut_cleared boolean not null default false,
  start_date date,
  exclusions jsonb not null default '[]',
  excluded_foods jsonb not null default '[]',
  updated_at timestamptz not null,
  deleted boolean not null default false,
  server_updated_at timestamptz not null default now()
);

create table public.food_logs (
  id uuid primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  food_id text not null,
  date date not null,
  liking smallint not null default 0 check (liking between -1 and 1),
  reaction text not null default 'keine'
    check (reaction in ('keine', 'haut', 'verdauung', 'erbrechen', 'atemwege')),
  note text not null default '',
  updated_at timestamptz not null,
  deleted boolean not null default false,
  server_updated_at timestamptz not null default now()
);

create index children_family_sync on public.children (family_id, server_updated_at);
create index food_logs_family_sync on public.food_logs (family_id, server_updated_at);

-- Last-Write-Wins: ältere Änderungen überschreiben keine neueren
create or replace function public.lww_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return old;
  end if;
  new.server_updated_at := now();
  return new;
end;
$$;

create trigger children_lww before insert or update on public.children
  for each row execute function public.lww_guard();
create trigger food_logs_lww before insert or update on public.food_logs
  for each row execute function public.lww_guard();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invites enable row level security;
alter table public.children enable row level security;
alter table public.food_logs enable row level security;

create policy "Mitglieder sehen ihre Familie" on public.families
  for select using (public.is_family_member(id));

create policy "Mitglieder sehen Mitglieder" on public.family_members
  for select using (public.is_family_member(family_id));
create policy "Mitglieder können austreten" on public.family_members
  for delete using (user_id = auth.uid());

create policy "Mitglieder sehen Einladungen" on public.family_invites
  for select using (public.can_write_family(family_id));

create policy "Kinder lesen" on public.children
  for select using (public.is_family_member(family_id));
create policy "Kinder anlegen" on public.children
  for insert with check (public.can_write_family(family_id));
create policy "Kinder ändern" on public.children
  for update using (public.can_write_family(family_id)) with check (public.can_write_family(family_id));

create policy "Tracker lesen" on public.food_logs
  for select using (public.is_family_member(family_id));
create policy "Tracker anlegen" on public.food_logs
  for insert with check (public.can_write_family(family_id));
create policy "Tracker ändern" on public.food_logs
  for update using (public.can_write_family(family_id)) with check (public.can_write_family(family_id));

-- Kein DELETE auf Daten: Löschen geschieht über deleted = true (für den Sync).

revoke all on function public.create_family(uuid, text) from public, anon;
revoke all on function public.create_invite(uuid, text) from public, anon;
revoke all on function public.join_family(text, text) from public, anon;
grant execute on function public.create_family(uuid, text) to authenticated;
grant execute on function public.create_invite(uuid, text) to authenticated;
grant execute on function public.join_family(text, text) to authenticated;
