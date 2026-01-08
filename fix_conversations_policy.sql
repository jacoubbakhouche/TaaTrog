-- Add update policy for conversations
CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.checkers WHERE id = checker_id))
WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.checkers WHERE id = checker_id));
