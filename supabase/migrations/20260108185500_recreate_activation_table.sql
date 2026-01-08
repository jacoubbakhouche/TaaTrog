
-- NUCLEAR OPTION: Drop and Recreate Table to fix all hidden issues
-- Caution: This deletes existing requests (which are broken anyway)

-- 1. Drop Table and Policies
drop table if exists activation_requests cascade;

-- 2. Re-create Table (Clean Schema)
create table activation_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null, -- We will link FK separately to be safe or just standard
  checker_id uuid not null,
  conversation_id uuid not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- 3. Add Foreign Keys (Correctly pointing to Profiles/Checkers)
alter table activation_requests 
  add constraint activation_requests_user_id_fkey 
  foreign key (user_id) references public.profiles(id) 
  on delete cascade;

alter table activation_requests 
  add constraint activation_requests_checker_id_fkey 
  foreign key (checker_id) references public.checkers(id) 
  on delete cascade;

alter table activation_requests 
  add constraint activation_requests_conversation_id_fkey 
  foreign key (conversation_id) references public.conversations(id) 
  on delete cascade;

-- 4. Enable RLS
alter table activation_requests enable row level security;

-- 5. Policies (Simple and Open)

-- READ: Everyone (Admins/Users) can see requests
create policy "activation_requests_select_policy"
  on activation_requests for select
  to authenticated
  using (true);

-- INSERT: Everyone can create requests
create policy "activation_requests_insert_policy"
  on activation_requests for insert
  to authenticated
  with check (true);

-- UPDATE: Everyone can update (Admins approving)
create policy "activation_requests_update_policy"
  on activation_requests for update
  to authenticated
  using (true);

-- 6. GRANT PERMISSIONS (Often missed!)
grant all on activation_requests to authenticated;
grant all on activation_requests to service_role;
