CREATE TABLE IF NOT EXISTS public.enrollments (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  lead_id           bigint NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
  course_id         uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  class_id          uuid NULL REFERENCES public.classes(id) ON DELETE SET NULL,

  enrollment_date   date NOT NULL DEFAULT CURRENT_DATE,
  sales_month       varchar(7) NOT NULL, 
  source            varchar(50),         

  expected_study_month text NULL,

  tuition_fee       bigint NOT NULL DEFAULT 0,
  deposit_amount    bigint NOT NULL DEFAULT 0,
  paid_amount       bigint NOT NULL DEFAULT 0, 
  debt_amount       bigint GENERATED ALWAYS AS (tuition_fee - paid_amount) STORED,
  debt_note         text NULL,

  status            varchar(20) NOT NULL DEFAULT 'cọc'
                      CHECK (status IN ('cọc', 'đang học', 'hoàn thành', 'hủy')),

  note              text,
  created_by        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_lead_id         ON public.enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id       ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id        ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_sales_month     ON public.enrollments(sales_month);
CREATE INDEX IF NOT EXISTS idx_enrollments_status          ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrollment_date ON public.enrollments(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_enrollments_source          ON public.enrollments(source);

CREATE OR REPLACE FUNCTION update_enrollments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION update_enrollments_updated_at_column();

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all enrollments"
ON public.enrollments FOR SELECT USING (true);

CREATE POLICY "Users can insert enrollments"
ON public.enrollments FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update enrollments"
ON public.enrollments FOR UPDATE USING (true);

CREATE POLICY "Users can delete enrollments"
ON public.enrollments FOR DELETE USING (true);

ALTER TABLE public.payment_tickets
  ADD COLUMN IF NOT EXISTS enrollment_id bigint NULL
    REFERENCES public.enrollments(id) ON DELETE SET NULL;

ALTER TABLE public.payment_tickets
  ADD COLUMN IF NOT EXISTS recipient_account text NULL;

CREATE INDEX IF NOT EXISTS idx_payment_tickets_enrollment_id ON public.payment_tickets(enrollment_id);

ALTER TABLE public.class_students
  ADD COLUMN IF NOT EXISTS enrollment_id bigint NULL
    REFERENCES public.enrollments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_class_students_enrollment_id ON public.class_students(enrollment_id);

CREATE OR REPLACE FUNCTION recalc_enrollment_paid_amount(p_enrollment_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE public.enrollments e
  SET
    paid_amount = COALESCE((
      SELECT SUM(pt.amount)
      FROM public.payment_tickets pt
      WHERE pt.enrollment_id = p_enrollment_id
        AND pt.status = 'approved'
    ), 0),
    updated_at = now()
  WHERE e.id = p_enrollment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_enrollment_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.enrollment_id IS DISTINCT FROM NEW.enrollment_id
     AND OLD.enrollment_id IS NOT NULL THEN
    PERFORM recalc_enrollment_paid_amount(OLD.enrollment_id);
  END IF;

  IF COALESCE(NEW.enrollment_id, OLD.enrollment_id) IS NOT NULL THEN
    PERFORM recalc_enrollment_paid_amount(COALESCE(NEW.enrollment_id, OLD.enrollment_id));
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enrollments_sync_paid
AFTER INSERT OR UPDATE OF amount, status, enrollment_id OR DELETE ON public.payment_tickets
FOR EACH ROW
EXECUTE FUNCTION update_enrollment_paid_amount();
