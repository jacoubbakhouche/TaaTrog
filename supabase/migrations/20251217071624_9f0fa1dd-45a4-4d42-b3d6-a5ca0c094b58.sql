-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create storage bucket for checker images
INSERT INTO storage.buckets (id, name, public) VALUES ('checker-images', 'checker-images', true);

-- Create storage bucket for reports/attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for checker-images bucket
CREATE POLICY "Checker images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'checker-images');

CREATE POLICY "Admins can upload checker images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'checker-images');

-- Storage policies for reports bucket (private)
CREATE POLICY "Users can view their own reports" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own reports" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);