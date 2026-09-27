-- Initial schema: profiles, albums (cached catalog metadata), listening_entries.
-- See design.md → "Data model (initial)".

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, mirrors auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Create a profile automatically when a user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- albums: cached catalog metadata (Spotify album ID as the key)
-- ---------------------------------------------------------------------------
create table public.albums (
  id text primary key,
  name text not null,
  artist text not null,
  cover_url text,
  release_date date,
  fetched_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- listening_entries: the user ↔ album relationship
-- ---------------------------------------------------------------------------
create table public.listening_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  album_id text not null references public.albums (id),
  status text not null check (status in ('want_to_listen', 'listened')),
  added_at timestamptz not null default now(),
  listened_at timestamptz,
  unique (user_id, album_id),
  -- listened_at is set exactly when the album has been listened to
  constraint listened_at_matches_status check (
    (status = 'listened') = (listened_at is not null)
  )
);

-- Each tab loads one user's entries for one status
create index listening_entries_user_status_idx
  on public.listening_entries (user_id, status);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.albums enable row level security;
alter table public.listening_entries enable row level security;

-- profiles: users can read and update only their own row.
-- Inserts happen via the handle_new_user trigger; deletes cascade from auth.users.
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- albums: public cached metadata, readable by anyone.
-- No insert/update/delete policies: writes happen server-side with the
-- service role, which bypasses RLS.
create policy "Albums are viewable by everyone"
  on public.albums for select
  to anon, authenticated
  using (true);

-- listening_entries: users have full CRUD over their own rows only
create policy "Users can view their own entries"
  on public.listening_entries for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own entries"
  on public.listening_entries for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own entries"
  on public.listening_entries for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own entries"
  on public.listening_entries for delete
  to authenticated
  using ((select auth.uid()) = user_id);
