-- 1. Clean up: Delete reviews where the user does not have a profile
-- This is necessary because we cannot link a review to a non-existent profile
DELETE FROM public.reviews
WHERE client_id NOT IN (SELECT id FROM public.profiles);

-- 2. Drop the old/standard foreign key if it exists (to avoid conflicts)
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_client_id_fkey;

-- 3. Add the correct foreign key pointing to the profiles table
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_client_id_fkey_profiles
  FOREIGN KEY (client_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;
