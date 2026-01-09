-- Allow authenticated users to upload their own avatar
-- We assume the user uploads to 'avatars' bucket
-- Policy for INSERT
create policy "Authenticated users can upload avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated'
);

-- Policy for SELECT (public access already likely exists, but ensuring public view)
create policy "Public Access to Avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );
