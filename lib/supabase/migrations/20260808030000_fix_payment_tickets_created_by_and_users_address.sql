ALTER TABLE public.payment_tickets
  DROP CONSTRAINT IF EXISTS payment_tickets_created_by_fkey;

ALTER TABLE public.payment_tickets
  ALTER COLUMN created_by TYPE text USING created_by::text;

ALTER TABLE public.users
  ALTER COLUMN address TYPE jsonb USING to_jsonb(address::text);
