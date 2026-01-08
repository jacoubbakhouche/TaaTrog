
-- 1. CLEANUP: Drop the complicated table we don't need anymore
drop table if exists activation_requests cascade;

-- 2. ADMIN SUPER ACCESS (Policies)

-- A. CONVERSATIONS
-- Allow Admin to SEE ALL conversations
create policy "Admin can view all conversations"
  on conversations for select
  to authenticated
  using (
    auth.uid() = user_id 
    or auth.uid() = checker_id 
    or auth.jwt() ->> 'email' = 'yakoubbakhouche011@gmail.com'
  );

-- Allow Admin to UPDATE ALL conversations (e.g. to mark as paid)
create policy "Admin can update all conversations"
  on conversations for update
  to authenticated
  using (
    auth.uid() = user_id 
    or auth.uid() = checker_id 
    or auth.jwt() ->> 'email' = 'yakoubbakhouche011@gmail.com'
  );

-- B. MESSAGES
-- Allow Admin to READ ALL messages
create policy "Admin can view all messages"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (
        c.user_id = auth.uid() 
        or c.checker_id = auth.uid() 
        or auth.jwt() ->> 'email' = 'yakoubbakhouche011@gmail.com'
      )
    )
  );

-- Allow Admin to SEND messages in ANY conversation
create policy "Admin can insert messages"
  on messages for insert
  to authenticated
  with check (
    -- Normal users can only send to their own chats
    exists (
      select 1 from conversations c
      where c.id = conversation_id
      and (c.user_id = auth.uid() or c.checker_id = auth.uid())
    )
    -- Admin can send anywhere
    or auth.jwt() ->> 'email' = 'yakoubbakhouche011@gmail.com'
  );

-- C. PROFILES (Ensure Admin can see names)
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" 
  on profiles for select 
  to authenticated 
  using (true);
