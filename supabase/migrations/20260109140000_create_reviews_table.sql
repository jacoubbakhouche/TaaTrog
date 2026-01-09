-- Create reviews table
create table public.reviews (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  checker_id uuid not null references public.checkers (id) on delete cascade,
  client_id uuid not null references auth.users (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text null,
  constraint reviews_pkey primary key (id)
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies
create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "Authenticated users can create reviews"
  on public.reviews for insert
  with check (auth.uid() = client_id);

-- Optional: Index for performance
create index reviews_checker_id_idx on public.reviews (checker_id);
