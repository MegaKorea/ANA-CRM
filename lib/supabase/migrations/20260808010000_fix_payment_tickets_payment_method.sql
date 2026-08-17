do $$
begin
  if exists (
    select 1 from pg_type where typname = 'payment_type'
  ) and not exists (
    select 1 from pg_type where typname = 'payment_method'
  ) then
    create type public.payment_method as enum ('cash', 'bank_personal', 'bank_company');

    alter table public.payment_tickets
      alter column payment_type drop default;

    alter table public.payment_tickets
      alter column payment_type type text using payment_type::text;

    update public.payment_tickets
      set payment_type = 'cash'
      where payment_type not in ('cash', 'bank_personal', 'bank_company');

    alter table public.payment_tickets
      alter column payment_type type public.payment_method using payment_type::public.payment_method;

    alter table public.payment_tickets
      alter column payment_type set default 'cash'::public.payment_method;

    alter table public.payment_tickets
      rename column payment_type to payment_method;

    drop type public.payment_type;
  end if;
end
$$;
