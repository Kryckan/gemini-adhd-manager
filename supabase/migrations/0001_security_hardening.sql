-- 1) Profiles policy hardening: explicitly allow authenticated users
-- to create only their own profile row.
drop policy if exists "Users insert own profile" on profiles;
create policy "Users insert own profile"
  on profiles
  for insert
  with check (auth.uid() = id);

-- 2) Replace vulnerable task update policy model.
drop policy if exists "Users update own tasks" on tasks;
drop policy if exists "Owners fully update own tasks" on tasks;
drop policy if exists "Delegates update assigned tasks" on tasks;

-- Owners can update their own tasks.
create policy "Owners fully update own tasks"
  on tasks
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Delegates can update only rows delegated to them, and must remain delegates
-- after the update.
create policy "Delegates update assigned tasks"
  on tasks
  for update
  using (auth.uid() = delegated_to_user_id)
  with check (auth.uid() = delegated_to_user_id);

drop trigger if exists enforce_delegate_boundaries on tasks;
drop function if exists public.prevent_delegate_hijacking();

-- Delegates are allowed to modify status only.
create function public.prevent_delegate_hijacking()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() = old.owner_id then
    return new;
  end if;

  if auth.uid() = old.delegated_to_user_id then
    -- Null-safe comparison of every column except status.
    if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
      raise exception 'Delegates may only update task status.';
    end if;
    return new;
  end if;

  return new;
end;
$$;

create trigger enforce_delegate_boundaries
  before update on tasks
  for each row
  execute function public.prevent_delegate_hijacking();
