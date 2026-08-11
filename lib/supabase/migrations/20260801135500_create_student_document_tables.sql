-- student_document_types / student_documents / student_deferrals exist in
-- production with no create-table migration in this repo. Column list /
-- types / nullability / defaults and enum values confirmed against the
-- live database (information_schema.columns + pg_enum dump).

do $$
begin
  create type public.student_document_status as enum ('missing', 'submitted', 'verified', 'rejected', 'returned');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.deferral_status as enum ('pending', 'active', 'returned', 'expired', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.deferral_reason as enum ('health', 'family', 'financial', 'work', 'military', 'personal', 'other');
exception
  when duplicate_object then null;
end
$$;

CREATE TABLE IF NOT EXISTS public.student_document_types (
  code          text PRIMARY KEY,
  label         text NOT NULL,
  short_label   text,
  scope         text NOT NULL DEFAULT 'lead',
  is_required   boolean NOT NULL DEFAULT true,
  has_expiry    boolean NOT NULL DEFAULT false,
  sort_order    smallint NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           bigint NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  class_student_id  uuid REFERENCES public.class_students(id) ON DELETE SET NULL,
  doc_type          text NOT NULL REFERENCES public.student_document_types(code) ON DELETE RESTRICT,
  status            public.student_document_status NOT NULL DEFAULT 'missing',
  files             jsonb NOT NULL DEFAULT '[]'::jsonb,
  copies            smallint NOT NULL DEFAULT 1,
  issued_date       date,
  expiry_date       date,
  submitted_at      timestamptz,
  received_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  verified_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at       timestamptz,
  reject_reason     text,
  note              text,
  created_by        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_documents_lead_id ON public.student_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_class_student_id ON public.student_documents(class_student_id);

CREATE TABLE IF NOT EXISTS public.student_deferrals (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                   bigint NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  class_student_id          uuid NOT NULL REFERENCES public.class_students(id) ON DELETE CASCADE,
  status                    public.deferral_status NOT NULL DEFAULT 'pending',
  reason                    public.deferral_reason NOT NULL DEFAULT 'other',
  reason_text               text,
  start_date                date NOT NULL,
  expected_return_date      date,
  actual_return_date        date,
  resumed_class_id          uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  resumed_class_student_id  uuid REFERENCES public.class_students(id) ON DELETE SET NULL,
  requested_by              uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_by               uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at               timestamptz,
  cancel_reason             text,
  note                      text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_deferrals_lead_id ON public.student_deferrals(lead_id);
CREATE INDEX IF NOT EXISTS idx_student_deferrals_class_student_id ON public.student_deferrals(class_student_id);
