-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  website text,
  
  -- Game Data
  xp integer default 0,
  level integer default 1,
  streak integer default 0,
  gems integer default 50,
  
  -- Plan Data
  plan_id text default 'free',
  active_until timestamp with time zone,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Set up Realtime!
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;

-- Create a trigger to automatically create a profile entry when a new user signs up
-- This is crucial for ensuring every user has a corresponding profile row
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, xp, gems)
  values (new.id, new.raw_user_meta_data->>'username', 0, 50);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
