-- Version 4: Vorrat & Gefrierfach, getauschte Mahlzeiten, Begrenzung der KI-Rezeptsuche
-- Gleiche Sicherheitsregeln wie die übrigen Familientabellen (RLS, Familienbezug, Längenlimits, LWW).

create table public.stock_items (
  id uuid primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  kind text not null check (kind in ('gefroren', 'vorrat')),
  name text not null check (char_length(name) between 1 and 60),
  recipe_id text check (char_length(recipe_id) <= 60),
  food_id text check (char_length(food_id) <= 60),
  portions smallint not null default 1 check (portions between 0 and 99),
  made_on date not null,
  updated_at timestamptz not null,
  deleted boolean not null default false,
  server_updated_at timestamptz not null default now()
);

-- Ein Tausch pro Kind, Tag und Mahlzeit: id = '<child_id>:<date>:<slot>'
create table public.plan_swaps (
  id text primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null,
  date date not null,
  slot text not null check (slot in ('mittag', 'abend', 'nachmittag')),
  recipe_id text not null check (char_length(recipe_id) <= 60),
  updated_at timestamptz not null,
  deleted boolean not null default false,
  server_updated_at timestamptz not null default now(),
  constraint plan_swaps_child_same_family foreign key (child_id, family_id)
    references public.children (id, family_id) on delete cascade on update cascade,
  constraint plan_swaps_id_format check (id = child_id::text || ':' || date::text || ':' || slot)
);

create index stock_items_family_sync on public.stock_items (family_id, server_updated_at);
create index plan_swaps_family_sync on public.plan_swaps (family_id, server_updated_at);

create trigger stock_items_lww before insert or update on public.stock_items
  for each row execute function public.lww_guard();
create trigger plan_swaps_lww before insert or update on public.plan_swaps
  for each row execute function public.lww_guard();

alter table public.stock_items enable row level security;
alter table public.plan_swaps enable row level security;

create policy "Vorrat lesen" on public.stock_items for select using (public.is_family_member(family_id));
create policy "Vorrat anlegen" on public.stock_items for insert with check (public.can_write_family(family_id));
create policy "Vorrat ändern" on public.stock_items for update
  using (public.can_write_family(family_id)) with check (public.can_write_family(family_id));

create policy "Tausch lesen" on public.plan_swaps for select using (public.is_family_member(family_id));
create policy "Tausch anlegen" on public.plan_swaps for insert with check (public.can_write_family(family_id));
create policy "Tausch ändern" on public.plan_swaps for update
  using (public.can_write_family(family_id)) with check (public.can_write_family(family_id));

revoke all on public.stock_items, public.plan_swaps from anon;

-- Weich gelöschte Zeilen der neuen Tabellen ebenfalls nach 30 Tagen entfernen
create or replace function public.purge_deleted()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from food_logs where deleted and server_updated_at < now() - interval '30 days';
  delete from digestion_logs where deleted and server_updated_at < now() - interval '30 days';
  delete from shift_entries where deleted and server_updated_at < now() - interval '30 days';
  delete from caregivers where deleted and server_updated_at < now() - interval '30 days';
  delete from stock_items where deleted and server_updated_at < now() - interval '30 days';
  delete from plan_swaps where deleted and server_updated_at < now() - interval '30 days';
  delete from children where deleted and server_updated_at < now() - interval '30 days';
  delete from family_invites where expires_at < now();
  delete from invite_attempts where at < now() - interval '1 day';
  delete from ai_requests where at < now() - interval '2 days';
end;
$$;

-- ---------------------------------------------------------------------------
-- KI-Rezeptsuche: Kontingent pro Nutzer (Kostenschutz und Missbrauchsschutz).
-- Gespeichert wird nur der Zeitpunkt – keine Inhalte der Anfrage.
-- ---------------------------------------------------------------------------
create table public.ai_requests (
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);
create index ai_requests_user on public.ai_requests (user_id, at);
alter table public.ai_requests enable row level security; -- keine Policies: nur über die Funktion

create or replace function public.take_ai_quota(daily_limit int default 30)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if (select count(*) from ai_requests where user_id = auth.uid() and at > now() - interval '1 day') >= daily_limit then
    return false;
  end if;
  insert into ai_requests (user_id) values (auth.uid());
  return true;
end;
$$;

revoke all on public.ai_requests from anon, authenticated;
revoke all on function public.take_ai_quota(int) from public, anon;
grant execute on function public.take_ai_quota(int) to authenticated;
revoke all on function public.purge_deleted() from public, anon, authenticated;
