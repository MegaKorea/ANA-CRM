-- education_level/education_detail on leads, and the job-commitment/PCLN
-- fields on class_students, already exist on the live tables (added
-- directly, never through a migration). Column types/nullability/defaults
-- and education_level enum values confirmed against the live database
-- (information_schema.columns + pg_enum dump).

do $$
begin
  create type public.education_level as enum (
    'primary', 'secondary', 'high_school', 'intermediate',
    'college', 'university', 'postgraduate', 'other'
  );
exception
  when duplicate_object then null;
end
$$;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS education_level public.education_level,
  ADD COLUMN IF NOT EXISTS education_detail jsonb;

ALTER TABLE public.class_students
  ADD COLUMN IF NOT EXISTS has_job_commitment boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS no_commitment_reason text,
  ADD COLUMN IF NOT EXISTS commitment_updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commitment_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS pcln_registered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pcln_registered_at date;
