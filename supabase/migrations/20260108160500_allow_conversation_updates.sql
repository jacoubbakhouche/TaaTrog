
-- Allow users to update their own conversations (e.g. for status updates)
create policy "Enable update for users based on user_id"
on "public"."conversations"
as PERMISSIVE
for UPDATE
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Allow checkers to update their conversations (e.g. for status updates)
create policy "Enable update for checkers based on checker_id"
on "public"."conversations"
as PERMISSIVE
for UPDATE
to authenticated
using (
  auth.uid() in (
    select user_id from checkers where id = checker_id
  )
)
with check (
  auth.uid() in (
    select user_id from checkers where id = checker_id
  )
);
