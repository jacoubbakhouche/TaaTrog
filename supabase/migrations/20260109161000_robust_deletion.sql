-- 1. Add Columns
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 2. Trigger: Set read_at when message is read
CREATE OR REPLACE FUNCTION public.handle_message_read()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_read changed to true, and read_at is null, set it
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_read ON public.messages;
CREATE TRIGGER on_message_read
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_message_read();

-- 3. Trigger: Hard Delete when both deleted
CREATE OR REPLACE FUNCTION public.handle_full_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_by_sender = TRUE AND NEW.deleted_by_receiver = TRUE THEN
    DELETE FROM public.messages WHERE id = NEW.id;
    RETURN NULL; -- Row is gone
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_full_delete ON public.messages;
CREATE TRIGGER on_message_full_delete
  AFTER UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_full_deletion();


-- 4. Update RLS Policies to Enforce Visibility
-- We need to drop the simple policies created in previous steps and replace with robust ones

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

-- RLS: SELECT Logic
-- 1. Must be Participant
-- 2. AND (If Sender: deleted_by_sender must be false)
-- 3. AND (If Receiver: deleted_by_receiver must be false)
-- 4. AND Ephemeral: (read_at IS NULL OR read_at > NOW() - INTERVAL '1 minute')

CREATE POLICY "Robust visibility for messages"
ON public.messages
FOR SELECT
USING (
  -- Ephemeral Check (Applies to everyone)
  (read_at IS NULL OR read_at > NOW() - INTERVAL '1 minute')
  AND
  (
    -- Case 1: I am the Sender
    (
      auth.uid() = sender_id 
      AND deleted_by_sender = FALSE
    )
    OR
    -- Case 2: I am the Receiver (Participant but not sender)
    (
      auth.uid() != sender_id
      AND
      EXISTS (
         SELECT 1 FROM public.conversations c
         WHERE c.id = messages.conversation_id
         AND (
           c.user_id = auth.uid() OR 
           c.checker_id IN (SELECT id FROM public.checkers WHERE user_id = auth.uid())
         )
      )
      AND deleted_by_receiver = FALSE
    )
  )
);

-- RLS: INSERT (Standard)
CREATE POLICY "Enable insert for messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
);

-- RLS: UPDATE (Needed for marking read or deleting)
CREATE POLICY "Enable update for messages"
ON public.messages
FOR UPDATE
USING (
  auth.uid() = sender_id 
  OR
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid() OR 
      c.checker_id IN (SELECT id FROM public.checkers WHERE user_id = auth.uid())
    )
  )
);
