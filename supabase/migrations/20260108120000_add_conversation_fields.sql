-- Add missing columns to conversations table to support payment flow and status tracking
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'payment_pending', 'paid', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS client_id UUID; -- Adding client_id as nullable for now to satisfy code if needed, though user_id is likely the client.

-- Update comment
COMMENT ON COLUMN public.conversations.user_id IS 'The user who initiated the conversation (the client)';
COMMENT ON COLUMN public.conversations.client_id IS 'Redundant client ID for compatibility if needed';
