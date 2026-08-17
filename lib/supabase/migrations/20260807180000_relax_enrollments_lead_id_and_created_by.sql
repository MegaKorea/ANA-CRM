ALTER TABLE public.enrollments
  ALTER COLUMN lead_id DROP NOT NULL;

ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_created_by_fkey;

ALTER TABLE public.enrollments
  ALTER COLUMN created_by TYPE text USING created_by::text;
