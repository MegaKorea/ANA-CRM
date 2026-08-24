ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS note_summarize jsonb DEFAULT '[]'::jsonb;
