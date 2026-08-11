-- Two more drifts confirmed against the live database
-- (information_schema.columns dump), neither captured by a migration:
--
-- 1) payment_tickets.created_by is `text` in production, not `uuid` —
--    same reasoning as enrollments.created_by (see
--    20260807180000_relax_enrollments_lead_id_and_created_by.sql): it can
--    hold either a real user uuid or a SMAX supporter id string.
-- 2) users.address is `jsonb` in production, not `text`.

ALTER TABLE public.payment_tickets
  DROP CONSTRAINT IF EXISTS payment_tickets_created_by_fkey;

ALTER TABLE public.payment_tickets
  ALTER COLUMN created_by TYPE text USING created_by::text;

ALTER TABLE public.users
  ALTER COLUMN address TYPE jsonb USING to_jsonb(address::text);
