
-- Allow users to delete their own conversations
create policy "Enable delete for users based on user_id"
on "public"."conversations"
as PERMISSIVE
for DELETE
to authenticated
using (auth.uid() = user_id);

-- Allow checkers to delete their conversations
create policy "Enable delete for checkers based on checker_id"
on "public"."conversations"
as PERMISSIVE
for DELETE
to authenticated
using (
  auth.uid() in (
    select user_id from checkers where id = checker_id
  )
);
