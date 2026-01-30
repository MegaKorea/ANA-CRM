do $$
begin
  create type user_status as enum ('active', 'banned', 'deleted');
exception
  when duplicate_object then null;
end
$$;

create table if not exists users (
  id bigint generated always as identity primary key,
  full_name text not null,
  password text not null,
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

