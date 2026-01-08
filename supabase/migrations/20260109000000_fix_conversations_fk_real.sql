
-- Fix Foreign Key on conversations to point to profiles(id) correctly
-- This enables: supabase.from('conversations').select('*, profiles(*)')

DO $$ 
BEGIN
  -- 1. Try to drop old constraint if it exists (by name)
  ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
EXCEPTION
  WHEN undefined_object THEN 
    NULL;
END $$;

-- 2. Add correct constraint
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 3. Reload schema cache (Supabase does this automatically usually)
NOTIFY pgrst, 'reload config';
