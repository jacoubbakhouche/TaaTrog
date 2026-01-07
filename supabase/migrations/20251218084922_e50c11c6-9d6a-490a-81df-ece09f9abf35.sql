-- Create a function to add admin role when user with specific email signs up
CREATE OR REPLACE FUNCTION public.check_and_add_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user email is the admin email
  IF NEW.email = 'yakoubbakhouche011@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_check_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_check_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_and_add_admin_role();

-- Also add admin role for existing user with this email if exists
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'yakoubbakhouche011@gmail.com' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;