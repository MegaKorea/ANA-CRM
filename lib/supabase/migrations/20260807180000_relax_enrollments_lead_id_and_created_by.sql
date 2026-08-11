-- Two more drifts on enrollments confirmed against the live database
-- (information_schema.columns dump), never captured by a migration:
--
-- 1) lead_id is nullable in production (20260807150000 created it NOT
--    NULL). Matches an orphaned row found in production (enrollment with
--    no lead at all, created by the same raw import that added the
--    student_name/phone/course_name_raw columns).
-- 2) created_by is `text` in production, not `uuid`, and has no FK to
--    users — it holds either a real user uuid or a SMAX supporter id
--    string (see SMAX_SUPPORTER_DIRECTORY lookup in
--    lib/services/enrollment.service.ts), so it can't stay a uuid FK.

ALTER TABLE public.enrollments
  ALTER COLUMN lead_id DROP NOT NULL;

ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_created_by_fkey;

ALTER TABLE public.enrollments
  ALTER COLUMN created_by TYPE text USING created_by::text;
