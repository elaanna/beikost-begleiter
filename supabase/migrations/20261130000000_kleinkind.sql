-- Version 6: Kleinkind-Phase („nimou table“) und Journal „Erste Male“
alter table public.children add column if not exists table_since date;

-- Journal „Erste Male“: kurze Notizen ohne Fotos und ohne Bewertung. Gleiche Regeln wie die übrigen Familientabellen.
create table public.journal_entries (
  id uuid primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null,
  date date not null,
  kind text not null check (char_length(kind) between 1 and 30),
  text text not null default '' check (char_length(text) <= 200),
  updated_at timestamptz not null,
  deleted boolean not null default false,
  server_updated_at timestamptz not null default now(),
  constraint journal_child_same_family foreign key (child_id, family_id)
    references public.children (id, family_id) on delete cascade on update cascade
);
create index journal_entries_family_sync on public.journal_entries (family_id, server_updated_at);
create trigger journal_entries_lww before insert or update on public.journal_entries
  for each row execute function public.lww_guard();
alter table public.journal_entries enable row level security;
create policy "Journal lesen" on public.journal_entries for select using (public.is_family_member(family_id));
create policy "Journal anlegen" on public.journal_entries for insert with check (public.can_write_family(family_id));
create policy "Journal ändern" on public.journal_entries for update
  using (public.can_write_family(family_id)) with check (public.can_write_family(family_id));
revoke all on public.journal_entries from anon;

create or replace function public.purge_deleted()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from food_logs where deleted and server_updated_at < now() - interval '30 days';
  delete from digestion_logs where deleted and server_updated_at < now() - interval '30 days';
  delete from shift_entries where deleted and server_updated_at < now() - interval '30 days';
  delete from caregivers where deleted and server_updated_at < now() - interval '30 days';
  delete from stock_items where deleted and server_updated_at < now() - interval '30 days';
  delete from plan_swaps where deleted and server_updated_at < now() - interval '30 days';
  delete from journal_entries where deleted and server_updated_at < now() - interval '30 days';
  delete from children where deleted and server_updated_at < now() - interval '30 days';
  delete from family_invites where expires_at < now();
  delete from invite_attempts where at < now() - interval '1 day';
  delete from ai_requests where at < now() - interval '2 days';
end;
$$;
revoke all on function public.purge_deleted() from public, anon, authenticated;
