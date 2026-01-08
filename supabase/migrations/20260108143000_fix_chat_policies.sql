
-- Update conversations status check constraint to include 'payment_negotiation'
alter table "public"."conversations" 
drop constraint if exists "conversations_status_check";

alter table "public"."conversations"
add constraint "conversations_status_check"
check (status in ('pending_approval', 'approved', 'rejected', 'payment_pending', 'paid', 'completed', 'cancelled', 'payment_negotiation'));

-- Enable read access to profiles for all authenticated users
create policy "Enable read access for all users"
on "public"."profiles"
as PERMISSIVE
for SELECT
to authenticated
using (true);

-- Enable read access to checkers for all authenticated users
create policy "Enable read access for all users"
on "public"."checkers"
as PERMISSIVE
for SELECT
to authenticated
using (true);

-- Allow users to insert conversations
create policy "Enable insert for authenticated users"
on "public"."conversations"
as PERMISSIVE
for INSERT
to authenticated
with check (auth.uid() = user_id);

-- Allow users to view their own conversations (Client side)
create policy "Enable select for users based on user_id"
on "public"."conversations"
as PERMISSIVE
for SELECT
to authenticated
using (auth.uid() = user_id);

-- Allow checkers to view their conversations (Admin/Checker side)
create policy "Enable select for checkers based on checker_id"
on "public"."conversations"
as PERMISSIVE
for SELECT
to authenticated
using (
  auth.uid() in (
    select user_id from checkers where id = checker_id
  )
);

-- Allow users to insert messages in their conversations
create policy "Enable insert for messages"
on "public"."messages"
as PERMISSIVE
for INSERT
to authenticated
with check (
  auth.uid() = sender_id 
  and 
  exists (
    select 1 from conversations c
    where c.id = conversation_id
    and (c.user_id = auth.uid() or c.checker_id in (select id from checkers where user_id = auth.uid()))
  )
);

-- Allow users to view messages in their conversations
create policy "Enable select for messages"
on "public"."messages"
as PERMISSIVE
for SELECT
to authenticated
using (
  exists (
    select 1 from conversations c
    where c.id = conversation_id
    and (c.user_id = auth.uid() or c.checker_id in (select id from checkers where user_id = auth.uid()))
  )
);

-- Function to get admin ID securely
CREATE OR REPLACE FUNCTION get_support_admin_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT user_id
  FROM user_roles
  WHERE role = 'admin'
  LIMIT 1;
$$;
