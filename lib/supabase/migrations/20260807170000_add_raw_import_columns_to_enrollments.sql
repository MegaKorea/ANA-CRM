-- These columns already exist on the live enrollments table (written by a
-- direct import into the DB, never through a migration) but have no
-- migration in this repo. They hold the raw/unmatched text captured during
-- that import (used as a display fallback for rows whose course_id/lead
-- link couldn't be resolved) — see lib/services/enrollment.service.ts and
-- lib/supabase/types/tables/enrollments.ts.

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS student_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS course_name_raw text,
  ADD COLUMN IF NOT EXISTS course_name_normalized text,
  ADD COLUMN IF NOT EXISTS course_key text,
  ADD COLUMN IF NOT EXISTS advisor_name text;
