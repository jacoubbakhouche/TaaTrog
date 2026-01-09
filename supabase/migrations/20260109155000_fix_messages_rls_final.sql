-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Enable select for messages" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for messages" ON public.messages;
DROP POLICY IF EXISTS "Enable update for messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

-- 1. SELECT Policy
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  -- User is the sender
  auth.uid() = sender_id
  OR
  -- User is a participant in the conversation
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (
      -- As Client
      c.user_id = auth.uid()
      OR
      -- As Checker
      c.checker_id IN (
        SELECT id FROM public.checkers WHERE user_id = auth.uid()
      )
    )
  )
);

-- 2. INSERT Policy
CREATE POLICY "Users can insert messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (
      c.user_id = auth.uid()
      OR
      c.checker_id IN (
        SELECT id FROM public.checkers WHERE user_id = auth.uid()
      )
    )
  )
);
