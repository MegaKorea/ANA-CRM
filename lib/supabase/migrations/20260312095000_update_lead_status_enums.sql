ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'other';

UPDATE public.leads SET status = 'other' WHERE status = 'contacted';

ALTER TYPE lead_status RENAME TO lead_status_old;

CREATE TYPE lead_status AS ENUM (
  'new', 
  'qualified', 
  'converted', 
  'nurturing', 
  'not_contacted', 
  'reject', 
  'interested', 
  'not_interested', 
  'other'
);

ALTER TABLE public.leads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.leads ALTER COLUMN status TYPE lead_status USING status::text::lead_status;
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'new'::lead_status;

DROP TYPE lead_status_old;
