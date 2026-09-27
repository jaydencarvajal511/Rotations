-- RLS tests for the initial schema. Run with: npx supabase test db
begin;
select plan(14);

-- Two users; the signup trigger should create their profiles
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com', '{"full_name": "User A"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com', '{}');

select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'User A',
  'signup trigger creates a profile with display name'
);

-- Seed as superuser (bypasses RLS), mirroring the server-side album upsert
insert into public.albums (id, name, artist) values
  ('album1', 'Album One', 'Artist'),
  ('album2', 'Album Two', 'Artist');

insert into public.listening_entries (user_id, album_id, status) values
  ('22222222-2222-2222-2222-222222222222', 'album1', 'want_to_listen');

-- ---- anonymous visitor ----------------------------------------------------
set local role anon;

select is((select count(*)::int from public.albums), 2, 'anon can read albums');
select is((select count(*)::int from public.listening_entries), 0, 'anon cannot read entries');
select is((select count(*)::int from public.profiles), 0, 'anon cannot read profiles');

-- ---- signed in as user A --------------------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select is((select count(*)::int from public.profiles), 1, 'user sees only their own profile');
select is((select count(*)::int from public.listening_entries), 0, 'user cannot see another user''s entries');

select lives_ok(
  $$ insert into public.listening_entries (user_id, album_id, status)
     values ('11111111-1111-1111-1111-111111111111', 'album1', 'want_to_listen') $$,
  'user can add an entry for themselves'
);

select throws_ok(
  $$ insert into public.listening_entries (user_id, album_id, status)
     values ('22222222-2222-2222-2222-222222222222', 'album2', 'want_to_listen') $$,
  '42501',
  null,
  'user cannot add an entry for someone else'
);

select lives_ok(
  $$ update public.listening_entries
     set status = 'listened', listened_at = now()
     where user_id = '11111111-1111-1111-1111-111111111111' and album_id = 'album1' $$,
  'user can move their own entry to listened'
);

select throws_ok(
  $$ update public.listening_entries
     set user_id = '22222222-2222-2222-2222-222222222222'
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'user cannot reassign their entry to another user'
);

-- Updates/deletes on other users' rows silently match zero rows under RLS
update public.listening_entries set status = 'listened', listened_at = now()
  where user_id = '22222222-2222-2222-2222-222222222222';
delete from public.listening_entries
  where user_id = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  $$ insert into public.albums (id, name, artist) values ('album3', 'X', 'Y') $$,
  '42501',
  null,
  'user cannot write to albums directly'
);

select lives_ok(
  $$ delete from public.listening_entries where album_id = 'album1' $$,
  'user can delete their own entry'
);

-- ---- back to superuser to verify user B's row was untouched ---------------
reset role;

select is(
  (select status from public.listening_entries
   where user_id = '22222222-2222-2222-2222-222222222222' and album_id = 'album1'),
  'want_to_listen',
  'another user''s entry is unchanged by update/delete attempts'
);

select throws_ok(
  $$ insert into public.listening_entries (user_id, album_id, status)
     values ('11111111-1111-1111-1111-111111111111', 'album2', 'listened') $$,
  '23514',
  null,
  'listened entries require listened_at'
);

select * from finish();
rollback;
