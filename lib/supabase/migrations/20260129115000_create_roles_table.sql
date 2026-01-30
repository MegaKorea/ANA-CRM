create table if not exists roles (
  id bigint generated always as identity primary key,
  name text not null unique,
  code text not null unique,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_roles_code on roles(code);
