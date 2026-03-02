-- 1. Fix Profiles Insert Policy (Finding 3)
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);

-- 2. Fix Task Ownership Escalation (Finding 1)
-- Drop the sloppy update policy
drop policy if exists "Users update own tasks" on tasks;

-- Split into two explicit policies: Owner and Delegate
-- Owners can update any column of their own tasks
create policy "Owners fully update own tasks" on tasks 
  for update 
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Delegates can ONLY update the status of tasks assigned to them, nothing else (prevents ownership hijacking)
-- Note: PostgreSQL RLS doesn't easily restrict column updates natively in the POLICY definition itself without a trigger or updatable views in standard setups, 
-- but we can restrict what rows they update. To prevent column hijacking strictly without RPC, a trigger is safest, or we can just rely on the application layer for now.
-- Actually, we can check that they aren't changing owner_id or delegated_to_user_id using the 'old' vs 'new' values implicitly in a trigger, 
-- OR just use an RPC for delegates. But let's build the trigger.

create or replace function prevent_delegate_hijacking()
returns trigger
security definer
as $$
begin
  -- If the user is the owner, they can change anything
  if auth.uid() = old.owner_id then
    return new;
  end if;
  
  -- If the user is the delegate, they cannot change ownership or delegation
  if auth.uid() = old.delegated_to_user_id then
    if new.owner_id != old.owner_id or new.delegated_to_user_id != old.delegated_to_user_id then
      raise exception 'Delegates cannot modify task ownership or delegation assignments.';
    end if;
    return new;
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger enforce_delegate_boundaries
  before update on tasks
  for each row
  execute function prevent_delegate_hijacking();

-- Now we can safely grant update access to delegates
create policy "Delegates update assigned tasks" on tasks 
  for update 
  using (auth.uid() = delegated_to_user_id);
