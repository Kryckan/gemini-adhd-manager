-- User Profile System mapping to Supabase Auth
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Core Execution Tasks
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  title text not null,
  status text not null check (status in ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE')),
  priority text not null check (priority in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  is_now boolean default false, -- Flags the item for the massive 'NOW' focus block
  delegated_to_user_id uuid references auth.users on delete set null,
  delegated_to_external text, -- String name for external follow-ups
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Timeline Events
create table public.timeline_events (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  event_time time not null, -- e.g., '09:00:00'
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Timeline Context Notes
create table public.timeline_notes (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.timeline_events on delete cascade not null,
  content text not null,
  type text not null check (type in ('NOTE', 'LINK', 'TAG')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.timeline_events enable row level security;
alter table public.timeline_notes enable row level security;

-- Strict Auth Policies: Users can only see their own data
create policy "Users view own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

create policy "Users view own tasks" on tasks for select using (auth.uid() = owner_id or auth.uid() = delegated_to_user_id);
create policy "Users insert own tasks" on tasks for insert with check (auth.uid() = owner_id);
create policy "Users update own tasks" on tasks for update using (auth.uid() = owner_id or auth.uid() = delegated_to_user_id);
create policy "Users delete own tasks" on tasks for delete using (auth.uid() = owner_id);

create policy "Users view own timeline events" on timeline_events for select using (auth.uid() = owner_id);
create policy "Users insert own timeline events" on timeline_events for insert with check (auth.uid() = owner_id);
create policy "Users update own timeline events" on timeline_events for update using (auth.uid() = owner_id);
create policy "Users delete own timeline events" on timeline_events for delete using (auth.uid() = owner_id);

-- Note: timeline_notes inherit access based on who can access the parent event. We simplify by joining against the event owner.
create policy "Users manage notes for own events" on timeline_notes 
  for all 
  using (
    exists (
      select 1 from timeline_events te 
      where te.id = timeline_notes.event_id 
      and te.owner_id = auth.uid()
    )
  );
