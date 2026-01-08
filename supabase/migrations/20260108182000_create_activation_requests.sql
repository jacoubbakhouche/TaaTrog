
-- Create activation_requests table
create table if not exists activation_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  conversation_id uuid references conversations(id) not null,
  checker_id uuid references checkers(id) not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- RLS Policies
alter table activation_requests enable row level security;

-- Allow users to view their own requests
create policy "Users can view their own requests"
  on activation_requests for select
  using (auth.uid() = user_id);

-- Allow users to insert requests
create policy "Users can insert requests"
  on activation_requests for insert
  with check (auth.uid() = user_id);

-- Allow Admins (via RPC or policy if strict) to view all
-- Ideally we check if auth.uid() is an admin, but for now allow authenticated users to read (assuming admin dashboard filters)
-- Or better: Allow read if user is the checker linked
create policy "Checkers can view requests for them"
  on activation_requests for select
  using (
    exists (
      select 1 from checkers
      where user_id = auth.uid()
      and id = activation_requests.checker_id
    )
    OR
    -- Check if user is the global admin email (hardcoded for safety if needed)
    auth.jwt() ->> 'email' = 'yakoubbakhouche011@gmail.com'
  );

-- Allow Admins to update (approve/reject)
create policy "Admins can update requests"
  on activation_requests for update
  using (
    exists (
      select 1 from checkers
      where user_id = auth.uid()
      and id = activation_requests.checker_id
    )
    OR
    auth.jwt() ->> 'email' = 'yakoubbakhouche011@gmail.com'
  );
