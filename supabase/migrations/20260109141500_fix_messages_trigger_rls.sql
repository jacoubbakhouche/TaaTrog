-- 1. Create/Replace Trigger Function to update timestamp
create or replace function public.handle_new_message()
returns trigger as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

-- 2. Drop and Re-create Trigger
drop trigger if exists on_new_message on public.messages;
create trigger on_new_message
  after insert on public.messages
  for each row execute procedure public.handle_new_message();

-- 3. Fix RLS Policies for Conversations
alter table public.conversations enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can view their own conversations" on public.conversations;
drop policy if exists "Checkers can view their own conversations" on public.conversations;
drop policy if exists "Clients can view their own conversations" on public.conversations;

-- Unified Select Policy
create policy "Users can view their own conversations"
on public.conversations for select
using (
  auth.uid() = user_id 
  OR 
  exists (
    select 1 from public.checkers 
    where checkers.id = conversations.checker_id 
    and checkers.user_id = auth.uid()
  )
);

-- Insert/Update policies
create policy "Users can insert conversations"
on public.conversations for insert
with check ( auth.uid() = user_id );

-- Allow users to update (e.g. delete/soft delete)
create policy "Users can update their own conversations"
on public.conversations for update
using (
  auth.uid() = user_id 
  OR 
  exists (
    select 1 from public.checkers 
    where checkers.id = conversations.checker_id 
    and checkers.user_id = auth.uid()
  )
);
