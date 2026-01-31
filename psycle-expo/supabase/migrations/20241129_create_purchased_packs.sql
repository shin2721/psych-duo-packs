-- Create table for tracking purchased packs
create table purchased_packs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  genre_id text not null,
  purchased_at timestamp with time zone default now(),
  amount_paid integer, -- In cents or smallest currency unit
  currency text default 'JPY',
  
  -- Prevent duplicate purchases of same pack by same user
  unique(user_id, genre_id)
);

-- Enable RLS
alter table purchased_packs enable row level security;

-- Policies
create policy "Users can view their own purchases"
  on purchased_packs for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own purchases"
  on purchased_packs for insert
  with check ( auth.uid() = user_id );

-- Add to realtime
alter publication supabase_realtime add table purchased_packs;
