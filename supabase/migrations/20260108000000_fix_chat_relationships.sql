-- Add missing foreign keys to conversations and messages to allow joining profiles
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Realtime for messages more robustly
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add trigger to update conversation updated_at when a new message is inserted
CREATE OR REPLACE FUNCTION public.handle_new_message_sync()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_message_sync();
