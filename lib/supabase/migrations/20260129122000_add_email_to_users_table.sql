alter table public.users add column if not exists email text;

create unique index if not exists users_email_unique on public.users(email) where email is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (
    id,
    full_name,
    email,
    phone,
    role_id
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.phone,
    (select id from roles where name = 'user' limit 1)
  );
  return new;
end;
$$;
