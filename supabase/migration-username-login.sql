-- Switch login to username only. Run once in the Supabase SQL Editor,
-- after migration.sql. Each username maps to an internal address
-- <username lowercase>@letitgo.app that is never emailed.

do $$
declare bad text;
begin
  select string_agg(username, ', ') into bad
  from public.profiles where username !~ '^[A-Za-z0-9_.-]{2,30}$';
  if bad is not null then
    raise exception 'These usernames need renaming first: %', bad;
  end if;

  select string_agg(n, ', ') into bad from (
    select lower(username) as n from public.profiles group by lower(username) having count(*) > 1
  ) d;
  if bad is not null then
    raise exception 'Usernames that differ only by case: %', bad;
  end if;
end $$;

update auth.users u
set email = lower(p.username) || '@letitgo.app', updated_at = now()
from public.profiles p where p.id = u.id;

update auth.identities i
set identity_data = jsonb_set(i.identity_data, '{email}', to_jsonb(lower(p.username) || '@letitgo.app')),
    updated_at = now()
from public.profiles p where p.id = i.user_id and i.provider = 'email';

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

create or replace function public.username_available(name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(name));
$$;

-- The old table holds the real emails; drop it once you're happy everything works
-- drop table public.users_legacy;
