CREATE TABLE public.lead_classification_rules (
  id                        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  name                      text NOT NULL,
  is_system                 boolean NOT NULL DEFAULT false,
  is_active                 boolean NOT NULL DEFAULT false,

  recent_interaction_hours  integer NOT NULL DEFAULT 24
                              CHECK (recent_interaction_hours > 0 AND recent_interaction_hours <= 720),
  rac_kqt_statuses          text[] NOT NULL DEFAULT ARRAY['reject','not_interested'],

  created_by                uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_classification_rules_is_system ON public.lead_classification_rules(is_system);


CREATE UNIQUE INDEX uq_lead_classification_rules_active
  ON public.lead_classification_rules (is_active) WHERE is_active;

CREATE OR REPLACE FUNCTION update_lead_classification_rules_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_classification_rules_updated_at
BEFORE UPDATE ON public.lead_classification_rules
FOR EACH ROW
EXECUTE FUNCTION update_lead_classification_rules_updated_at_column();

ALTER TABLE public.lead_classification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all lead classification rules"
ON public.lead_classification_rules FOR SELECT USING (true);

CREATE POLICY "Users can insert lead classification rules"
ON public.lead_classification_rules FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update lead classification rules"
ON public.lead_classification_rules FOR UPDATE USING (true);

CREATE POLICY "Users can delete lead classification rules"
ON public.lead_classification_rules FOR DELETE USING (true);

INSERT INTO public.lead_classification_rules
  (name, is_system, is_active, recent_interaction_hours, rac_kqt_statuses)
VALUES
  ('Mặc định hệ thống', true, true, 24, ARRAY['reject','not_interested']);
