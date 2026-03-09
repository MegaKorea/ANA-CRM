alter table public.leads
add column if not exists sales_amount numeric,
add column if not exists deposit numeric,
add column if not exists outstanding_balance numeric,
add column if not exists appointment_date timestamptz,
add column if not exists images text[];
