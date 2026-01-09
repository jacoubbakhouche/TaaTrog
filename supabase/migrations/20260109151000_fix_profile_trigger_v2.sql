-- 1. Create Function to handle new user setup (Corrected)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- We insert new.id into BOTH 'id' and 'user_id' to satisfy schemas 
  -- where id is PK and user_id is explicit FK or redundant column
  insert into public.profiles (id, user_id, full_name, avatar_url)
  values (
    new.id,
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Backfill: Create profiles for existing users (Corrected)
insert into public.profiles (id, user_id, full_name, avatar_url)
select 
  id,
  id, -- Populate user_id with the same UUID
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
where id not in (select id from public.profiles);
