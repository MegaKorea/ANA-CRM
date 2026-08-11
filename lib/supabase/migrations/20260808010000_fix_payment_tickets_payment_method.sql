-- 20260413180000_add_tuition_fee_and_payment_tickets.sql created a
-- payment_type enum ('cash','bank_transfer','momo','other') and a
-- payment_tickets.payment_type column. Production was changed directly
-- (never through a migration) to a payment_method enum
-- ('cash','bank_personal','bank_company') and a payment_method column,
-- which is what the app code actually reads/writes
-- (constants/enums/lead.enum.ts PaymentMethod,
-- lib/supabase/types/tables/payment_tickets.ts). This migration brings a
-- fresh database in line with that reality. No-ops if payment_type doesn't
-- exist (i.e. the DB already looks like this).

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

    -- Existing values ('bank_transfer', 'momo', 'other') have no equivalent
    -- in the new enum — collapse them to 'cash' rather than fail the
    -- migration; there's no real historical data to preserve on a table
    -- this migration is reconstructing from scratch.
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
