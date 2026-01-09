-- Drop the existing foreign key to auth.users if it exists
-- (Constraint name usually auto-generated, we try to drop by column or known name, 
-- but safer to just add the new one for profiles if possible, or force replace)

-- First, let's look for the constraint name effectively or just alter table
-- We will try to add the FK to profiles. 
-- Note: A column can reference multiple tables in standard SQL (rare), 
-- but PostgREST relies on ONE clear path usually.
-- Ideally we want client_id to point to public.profiles.

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_client_id_fkey; -- standard naming

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_client_id_fkey_profiles
  FOREIGN KEY (client_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;
