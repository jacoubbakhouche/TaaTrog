-- Function to update conversation timestamp on new message
create or replace function public.handle_new_message()
returns trigger as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to fire after insert on messages
drop trigger if exists on_new_message on public.messages;
create trigger on_new_message
  after insert on public.messages
  for each row execute procedure public.handle_new_message();
