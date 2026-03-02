create table public.calendar_connections (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  provider text not null check (provider in ('GOOGLE', 'WEBCAL')),
  status text not null default 'DISCONNECTED' check (status in ('CONNECTED', 'DISCONNECTED')),
  sync_enabled boolean not null default true,
  account_label text,
  webcal_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (owner_id, provider)
);

create or replace function public.touch_calendar_connections_updated_at()
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

create trigger calendar_connections_set_updated_at
  before update on public.calendar_connections
  for each row
  execute function public.touch_calendar_connections_updated_at();

alter table public.calendar_connections enable row level security;

create policy "Users view own calendar connections"
  on public.calendar_connections
  for select
  using (auth.uid() = owner_id);

create policy "Users insert own calendar connections"
  on public.calendar_connections
  for insert
  with check (auth.uid() = owner_id);

create policy "Users update own calendar connections"
  on public.calendar_connections
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users delete own calendar connections"
  on public.calendar_connections
  for delete
  using (auth.uid() = owner_id);
