alter table public.leads alter column date_of_birth type text using extract(year from date_of_birth)::text;
