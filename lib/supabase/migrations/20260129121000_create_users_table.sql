do $$
begin
  create type user_status as enum ('active', 'banned', 'deleted');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar text,
  status user_status not null default 'active',
  sex text,
  age integer,
  address text,
  birth_day date,
  role_id bigint not null references roles(id),
  last_login timestamptz,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (
    id,
    full_name,
    phone,
    role_id
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.phone,
    (select id from roles where name = 'user' limit 1)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.users enable row level security;

create policy "Users can view their own profile"
on public.users
for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.users
for update
using (auth.uid() = id);

create policy "No direct insert"
on public.users
for insert
with check (false);

create policy "No direct delete"
on public.users
for delete
using (false);
