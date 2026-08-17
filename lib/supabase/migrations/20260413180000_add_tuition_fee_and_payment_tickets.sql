ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tuition_fee bigint DEFAULT 0;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM ('cash', 'bank_transfer', 'momo', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.payment_tickets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id bigint NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  payment_type payment_type NOT NULL DEFAULT 'cash',
  payment_date timestamptz NOT NULL DEFAULT now(),
  images text[] DEFAULT '{}',
  note text,
  status ticket_status NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES public.users(id),
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_tickets_lead_id ON public.payment_tickets(lead_id);
CREATE INDEX IF NOT EXISTS idx_payment_tickets_status ON public.payment_tickets(status);
CREATE INDEX IF NOT EXISTS idx_payment_tickets_payment_date ON public.payment_tickets(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_tickets_created_by ON public.payment_tickets(created_by);

ALTER TABLE public.payment_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all payment_tickets"
ON public.payment_tickets FOR SELECT USING (true);

CREATE POLICY "Users can insert payment_tickets"
ON public.payment_tickets FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update payment_tickets"
ON public.payment_tickets FOR UPDATE USING (true);

CREATE POLICY "Users can delete payment_tickets"
ON public.payment_tickets FOR DELETE USING (true);
