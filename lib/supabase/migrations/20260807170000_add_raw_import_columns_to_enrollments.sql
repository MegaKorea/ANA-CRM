ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS student_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS course_name_raw text,
  ADD COLUMN IF NOT EXISTS course_name_normalized text,
  ADD COLUMN IF NOT EXISTS course_key text,
  ADD COLUMN IF NOT EXISTS advisor_name text;
