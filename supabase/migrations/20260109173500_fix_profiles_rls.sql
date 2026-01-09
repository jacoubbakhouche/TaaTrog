-- Enable RLS on profiles if not already
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view all profiles (public)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow Admin to update ANY profile (for approval sync)
CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'yakoubbakhouche011@gmail.com'
  OR 
  auth.jwt() ->> 'email' = 'yakoubbakhouche011@gmail.com'
);
