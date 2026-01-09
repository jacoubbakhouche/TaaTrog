-- Add unique constraint to ensure one review per client per checker
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_checker_client_unique UNIQUE (checker_id, client_id);
