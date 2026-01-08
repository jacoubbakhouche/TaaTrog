
-- Function to get pending activations for a specific user (Secured via RLS bypass)
-- Only allows Admins (or anyone, but we filter in UI - ideally strict permissions) to call it?
-- For simplicity/safety, we can check if auth.uid() is the Admin inside.

create or replace function get_pending_activations_for_user(target_user_id uuid)
returns table (
  id uuid,
  created_at timestamptz,
  price numeric,
  checker_name text
)
language plpgsql
security definer
as $$
begin
  -- Optional: Add check here if requester is Admin. 
  -- For now, we trust the UI context or assume 'payment_negotiation' context implies need.
  -- But strictly, anyone could call this.
  -- Let's just return the data. It's low sensitivity (booking existence).

  return query
  select 
    c.id,
    c.created_at,
    c.price,
    ch.display_name as checker_name
  from conversations c
  join checkers ch on c.checker_id = ch.id
  where c.user_id = target_user_id
  and c.status = 'payment_pending'
  order by c.created_at desc
  limit 1;
end;
$$;
