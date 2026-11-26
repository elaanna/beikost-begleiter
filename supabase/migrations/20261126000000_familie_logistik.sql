-- Version 2: Verdauungs-Tracker, Betreuungspersonen, Dienstplan, Familien-Einstellungen

create table public.digestion_logs (
  id uuid primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  date date not null,
  kind text not null check (kind in ('normal', 'weich', 'hart', 'durchfall', 'keiner')),
  note text not null default '',
  updated_at timestamptz not null,
  deleted boolean not null default false,
  server_updated_at timestamptz not null default now()
);

create table public.caregivers (
  id uuid primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  emoji text not null default '🙂',
  updated_at timestamptz not null,
  deleted boolean not null default false,
  server_updated_at timestamptz not null default now()
);

-- Ein Eintrag pro Person und Tag: id = '<caregiver_id>:<date>'
create table public.shift_entries (
  id text primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  caregiver_id uuid not null references public.caregivers (id) on delete cascade,
  date date not null,
  kind text not null check (kind in ('frei', 'frueh', 'spaet', 'nacht', 'buero')),
  updated_at timestamptz not null,
  deleted boolean not null default false,
  server_updated_at timestamptz not null default now()
);

-- Eine Zeile pro Familie: id = family_id
create table public.family_settings (
  id uuid primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null,
  deleted boolean not null default false,
  server_updated_at timestamptz not null default now()
);

create index digestion_logs_family_sync on public.digestion_logs (family_id, server_updated_at);
create index caregivers_family_sync on public.caregivers (family_id, server_updated_at);
create index shift_entries_family_sync on public.shift_entries (family_id, server_updated_at);
create index family_settings_family_sync on public.family_settings (family_id, server_updated_at);

create trigger digestion_logs_lww before insert or update on public.digestion_logs
  for each row execute function public.lww_guard();
create trigger caregivers_lww before insert or update on public.caregivers
  for each row execute function public.lww_guard();
create trigger shift_entries_lww before insert or update on public.shift_entries
  for each row execute function public.lww_guard();
create trigger family_settings_lww before insert or update on public.family_settings
  for each row execute function public.lww_guard();

alter table public.digestion_logs enable row level security;
alter table public.caregivers enable row level security;
alter table public.shift_entries enable row level security;
alter table public.family_settings enable row level security;

create policy "Verdauung lesen" on public.digestion_logs for select using (public.is_family_member(family_id));
create policy "Verdauung anlegen" on public.digestion_logs for insert with check (public.can_write_family(family_id));
create policy "Verdauung ändern" on public.digestion_logs for update
  using (public.can_write_family(family_id)) with check (public.can_write_family(family_id));

create policy "Betreuung lesen" on public.caregivers for select using (public.is_family_member(family_id));
create policy "Betreuung anlegen" on public.caregivers for insert with check (public.can_write_family(family_id));
create policy "Betreuung ändern" on public.caregivers for update
  using (public.can_write_family(family_id)) with check (public.can_write_family(family_id));

create policy "Dienste lesen" on public.shift_entries for select using (public.is_family_member(family_id));
create policy "Dienste anlegen" on public.shift_entries for insert with check (public.can_write_family(family_id));
create policy "Dienste ändern" on public.shift_entries for update
  using (public.can_write_family(family_id)) with check (public.can_write_family(family_id));

create policy "Einstellungen lesen" on public.family_settings for select using (public.is_family_member(family_id));
create policy "Einstellungen anlegen" on public.family_settings for insert with check (public.can_write_family(family_id));
create policy "Einstellungen ändern" on public.family_settings for update
  using (public.can_write_family(family_id)) with check (public.can_write_family(family_id));
