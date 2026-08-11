-- Production's ticket_status enum has 'processing' in addition to the
-- ('pending','approved','rejected') created by
-- 20260413180000_add_tuition_fee_and_payment_tickets.sql — added directly,
-- never through a migration. Additive-only, safe to run regardless of
-- current state.

ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'processing';
