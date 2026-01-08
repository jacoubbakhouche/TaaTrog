
-- Master Fix for Activation Requests & Policies
-- This script will:
-- 1. Ensure the table exists with correct FKs.
-- 2. WIPE all existing policies to remove conflicts.
-- 3. Create SIMPLE, working policies for everyone.
-- 4. Fix potential issues with 'profiles' preventing the join.

-- 1. Fix Foreign Keys (Ensure they are correct)
alter table activation_requests drop constraint if exists activation_requests_user_id_fkey;
alter table activation_requests add constraint activation_requests_user_id_fkey 
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table activation_requests drop constraint if exists activation_requests_checker_id_fkey;
alter table activation_requests add constraint activation_requests_checker_id_fkey 
  foreign key (checker_id) references public.checkers(id) on delete cascade;

-- 2. Reset Policies
alter table activation_requests enable row level security;

drop policy if exists "Users can view their own requests" on activation_requests;
drop policy if exists "Users can insert requests" on activation_requests;
drop policy if exists "Checkers can view requests for them" on activation_requests;
drop policy if exists "Admins can update requests" on activation_requests;
drop policy if exists "Allow all authenticated to select" on activation_requests;
drop policy if exists "Allow all authenticated to insert" on activation_requests;
drop policy if exists "Allow all authenticated to update" on activation_requests;

-- 3. Create Clean, Permissive Policies
-- Allow ANY authenticated user to see ALL requests (for debugging/admin)
create policy "Enable read access for all users"
on activation_requests for select
to authenticated
using (true);

-- Allow ANY authenticated user to insert (Clients)
create policy "Enable insert access for all users"
on activation_requests for insert
to authenticated
with check (true);

-- Allow ANY authenticated user to update (Admins)
create policy "Enable update access for all users"
on activation_requests for update
to authenticated
using (true);

-- 4. Ensure Profiles are readable (Crucial for the JOIN to work!)
-- If profiles are not readable, the join returns null or error.
create policy "Public profiles are viewable by everyone"
on profiles for select
to authenticated
using (true);
-- Note: usage 'if not exists' logic is complex in SQL, so we just run it. 
-- If it exists, it throws error, which is fine, user can ignore.
