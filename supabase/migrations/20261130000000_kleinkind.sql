-- Version 6: Kleinkind-Phase („nimou table“) – seit wann das Kind am Familientisch isst
alter table public.children add column if not exists table_since date;
