
-- Fix Foreign Key for activation_requests to allow joining with profiles
alter table activation_requests
  drop constraint if exists activation_requests_user_id_fkey;

alter table activation_requests
  add constraint activation_requests_user_id_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;
