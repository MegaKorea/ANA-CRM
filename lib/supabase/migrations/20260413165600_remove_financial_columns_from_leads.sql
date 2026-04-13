alter table public.leads
drop column if exists sales_amount,
drop column if exists deposit,
drop column if exists outstanding_balance;
