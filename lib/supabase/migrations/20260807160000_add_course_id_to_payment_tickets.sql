ALTER TABLE public.payment_tickets
  ADD COLUMN IF NOT EXISTS course_id uuid NULL
    REFERENCES public.courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_tickets_course_id ON public.payment_tickets(course_id);
