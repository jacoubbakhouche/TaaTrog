-- 1. Drop the incorrect foreign key (pointing to profiles.id)
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_client_id_fkey_profiles;

-- 2. Add the CORRECT foreign key (pointing to profiles.user_id)
-- We know user_id corresponds to the Auth UUID used in client_id
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_client_id_fkey_profiles
  FOREIGN KEY (client_id)
  REFERENCES public.profiles(user_id)
  ON DELETE CASCADE;
