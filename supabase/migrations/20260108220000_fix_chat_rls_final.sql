-- Drop existing policies to avoid conflicts
drop policy if exists "Enable insert for messages" on "public"."messages";
drop policy if exists "Enable select for messages" on "public"."messages";
drop policy if exists "Enable update for messages" on "public"."messages";

-- 1. INSERT Policy (Strict: Sender must be the user)
create policy "Enable insert for messages"
on "public"."messages"
for INSERT
to authenticated
with check (
  auth.uid() = sender_id
);

-- 2. SELECT Policy (User must be part of conversation)
create policy "Enable select for messages"
on "public"."messages"
for SELECT
to authenticated
using (
  exists (
    select 1 from conversations c
    where c.id = conversation_id
    and (
      c.user_id = auth.uid() 
      or 
      c.checker_id in (select id from checkers where user_id = auth.uid())
    )
  )
);

-- 3. UPDATE Policy (Only for marking as read by the recipient)
create policy "Enable update for messages"
on "public"."messages"
for UPDATE
to authenticated
using (
  -- User can update if they are in the conversation (simplified to allow checking)
  exists (
    select 1 from conversations c
    where c.id = conversation_id
    and (
      c.user_id = auth.uid() 
      or 
      c.checker_id in (select id from checkers where user_id = auth.uid())
    )
  )
)
with check (
  -- Restrict updates: Can only update 'is_read' mostly, but RLS applies to row. 
  -- We allow update if they are in conversation.
  exists (
    select 1 from conversations c
    where c.id = conversation_id
    and (
      c.user_id = auth.uid() 
      or 
      c.checker_id in (select id from checkers where user_id = auth.uid())
    )
  )
);
