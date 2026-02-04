do $$
begin
  create type lead_status as enum ('new', 'contacted', 'qualified', 'converted', 'lost');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.leads (
  id bigint generated always as identity primary key,
  email text,
  phone_number text,
  full_name text not null,
  date_of_birth date,
  place_of_birth text,
  place_of_origin text,
  current_address text,
  citizen_id text,
  nationality text,
  ethnicity text,
  meta_data jsonb default '{}'::jsonb,
  source text,
  telesales_id uuid references public.users(id) on delete set null,
  status lead_status not null default 'new',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_phone_number on public.leads(phone_number);
create index if not exists idx_leads_telesales_id on public.leads(telesales_id);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_created_at on public.leads(created_at);

alter table public.leads enable row level security;

create policy "Users can view all leads"
on public.leads
for select
using (true);

create policy "Users can insert leads"
on public.leads
for insert
with check (true);

create policy "Users can update leads"
on public.leads
for update
using (true);

create policy "Users can delete leads"
on public.leads
for delete
using (true);
