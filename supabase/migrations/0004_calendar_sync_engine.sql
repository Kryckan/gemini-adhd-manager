alter table public.calendar_connections
  add column if not exists access_token text,
  add column if not exists refresh_token text,
  add column if not exists token_expires_at timestamp with time zone,
  add column if not exists last_synced_at timestamp with time zone,
  add column if not exists last_sync_error text;

create table if not exists public.calendar_events (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  connection_id uuid references public.calendar_connections on delete cascade not null,
  provider text not null check (provider in ('GOOGLE', 'WEBCAL')),
  external_event_id text not null,
  title text not null,
  description text,
  location text,
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone not null,
  is_all_day boolean not null default false,
  source_calendar_id text,
  source_calendar_name text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (connection_id, external_event_id)
);

create index if not exists calendar_events_owner_starts_idx
  on public.calendar_events (owner_id, starts_at);

create or replace function public.touch_calendar_events_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row
  execute function public.touch_calendar_events_updated_at();

alter table public.calendar_events enable row level security;

create policy "Users view own calendar events"
  on public.calendar_events
  for select
  using (auth.uid() = owner_id);

create policy "Users insert own calendar events"
  on public.calendar_events
  for insert
  with check (auth.uid() = owner_id);

create policy "Users update own calendar events"
  on public.calendar_events
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users delete own calendar events"
  on public.calendar_events
  for delete
  using (auth.uid() = owner_id);
