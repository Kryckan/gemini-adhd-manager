alter table public.calendar_connections
  add column if not exists selected_calendar_ids text[] not null default '{}';
