-- 1. Create Function (Robust)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_id, full_name, avatar_url)
  values (
    new.id,
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing; -- Handle potential race conditions or existing data
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Backfill: Create profiles for existing users (Robust)
-- We check if `user_id` already exists to avoid unique constraint violations
insert into public.profiles (id, user_id, full_name, avatar_url)
select 
  id,
  id,
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
where id not in (select user_id from public.profiles); -- Check against user_id, not just id
