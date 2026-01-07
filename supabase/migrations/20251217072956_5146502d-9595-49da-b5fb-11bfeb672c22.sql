-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'checker');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthdate DATE,
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Create checkers table
CREATE TABLE public.checkers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    languages TEXT[] DEFAULT '{}',
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    tests_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    social_media JSONB DEFAULT '{}',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checkers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checkers are viewable by everyone" ON public.checkers
FOR SELECT USING (is_active = true);

CREATE POLICY "Checkers can update their own profile" ON public.checkers
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage checkers" ON public.checkers
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create checker_requests table (to become a checker)
CREATE TABLE public.checker_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    display_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    languages TEXT[] DEFAULT '{}',
    experience TEXT,
    social_media JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checker_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests" ON public.checker_requests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests" ON public.checker_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all requests" ON public.checker_requests
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create loyalty_tests table
CREATE TABLE public.loyalty_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    checker_id UUID REFERENCES public.checkers(id),
    target_name TEXT NOT NULL,
    target_contact TEXT NOT NULL,
    contact_method TEXT NOT NULL CHECK (contact_method IN ('instagram', 'whatsapp', 'snapchat', 'telegram', 'other')),
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_payment', 'payment_review', 'active', 'in_progress', 'completed', 'cancelled')),
    report TEXT,
    report_files TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tests" ON public.loyalty_tests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tests" ON public.loyalty_tests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Checkers can view assigned tests" ON public.loyalty_tests
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.checkers WHERE user_id = auth.uid() AND id = loyalty_tests.checker_id)
);

CREATE POLICY "Checkers can update assigned tests" ON public.loyalty_tests
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.checkers WHERE user_id = auth.uid() AND id = loyalty_tests.checker_id)
);

CREATE POLICY "Admins can manage all tests" ON public.loyalty_tests
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    loyalty_test_id UUID REFERENCES public.loyalty_tests(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'wallet', 'card', 'other')),
    proof_image_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON public.payments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON public.payments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments" ON public.payments
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_checkers_updated_at
BEFORE UPDATE ON public.checkers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checker_requests_updated_at
BEFORE UPDATE ON public.checker_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_tests_updated_at
BEFORE UPDATE ON public.loyalty_tests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();