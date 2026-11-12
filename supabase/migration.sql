-- Let It Go: move from the custom `users` table to Supabase Auth.
-- Run the whole file once in the Supabase dashboard -> SQL Editor.
-- Existing accounts keep their ids, emails and bcrypt password hashes,
-- so current users can log in with the same password and their messages
-- still decrypt (the encryption key is derived from password + username).

do $$
begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'id') <> 'uuid' then
    raise exception 'public.users.id is not a uuid - stop and check the schema first';
  end if;
end $$;

-- 1. Profiles: the only app data attached to an account
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

-- 2. Copy existing users into Supabase Auth (same id, same bcrypt hash)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  lower(u.email), u.password_hash, now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('username', u.username),
  now(), now(), '', '', '', ''
from public.users u
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', lower(u.email), 'email_verified', true),
  now(), now(), now()
from public.users u
where not exists (select 1 from auth.identities i where i.user_id = u.id);

insert into public.profiles (id, username)
select id, username from public.users
on conflict (id) do nothing;

-- 3. New signups get a profile automatically (runs after the copy above)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets the signup form check a username without exposing the profiles table
create or replace function public.username_available(name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (select 1 from public.profiles where username = name);
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- 4. Messages: point at auth users and make each row private to its owner
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.messages'::regclass and contype = 'f'
  loop
    execute format('alter table public.messages drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.messages
  add constraint messages_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.messages enable row level security;

drop policy if exists "read own messages" on public.messages;
drop policy if exists "insert own messages" on public.messages;
drop policy if exists "update own messages" on public.messages;
drop policy if exists "delete own messages" on public.messages;

create policy "read own messages" on public.messages
  for select to authenticated using (user_id = auth.uid());
create policy "insert own messages" on public.messages
  for insert to authenticated with check (user_id = auth.uid());
create policy "update own messages" on public.messages
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own messages" on public.messages
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.messages from anon;

-- 5. Lock the old table (kept as a backup; drop it once you've verified everything)
alter table public.users rename to users_legacy;
alter table public.users_legacy enable row level security;
revoke all on public.users_legacy from anon, authenticated;
