-- Create a secure function for admins to activate conversations
CREATE OR REPLACE FUNCTION admin_activate_conversation(target_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
AS $$
BEGIN
  -- 1. Update the conversation status to 'paid'
  UPDATE conversations
  SET status = 'paid'
  WHERE id = target_conversation_id;

  -- 2. Approve the activation request (if exists)
  UPDATE activation_requests
  SET status = 'approved'
  WHERE conversation_id = target_conversation_id;
END;
$$;
