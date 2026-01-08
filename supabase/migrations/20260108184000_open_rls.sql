
-- Drop existing restrictive policies to avoid conflicts
drop policy if exists "Users can view their own requests" on activation_requests;
drop policy if exists "Users can insert requests" on activation_requests;
drop policy if exists "Checkers can view requests for them" on activation_requests;
drop policy if exists "Admins can update requests" on activation_requests;

-- Create permissive policies for debugging
create policy "Allow all authenticated to select"
  on activation_requests for select
  to authenticated
  using (true);

create policy "Allow all authenticated to insert"
  on activation_requests for insert
  to authenticated
  with check (true);

create policy "Allow all authenticated to update"
  on activation_requests for update
  to authenticated
  using (true);
