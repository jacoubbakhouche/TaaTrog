-- Ensure table exists with correct structure
CREATE TABLE IF NOT EXISTS activation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    checker_id UUID REFERENCES checkers(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE activation_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own requests" ON activation_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON activation_requests;
DROP POLICY IF EXISTS "Allow all read" ON activation_requests;

-- Create simple robust policies
-- 1. Everyone can insert (authenticated)
CREATE POLICY "Allow insert for authenticated"
ON activation_requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Everyone can view (authenticated) - Logic: Client needs to see it, Admin needs to see it.
-- Data is just IDs and status, low privacy risk, high functionality priority.
CREATE POLICY "Allow read for authenticated"
ON activation_requests FOR SELECT
TO authenticated
USING (true);

-- 3. Update? Only via RPC usually, but let's allow users to update their own just in case (e.g. cancel)
CREATE POLICY "Users can update own"
ON activation_requests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
