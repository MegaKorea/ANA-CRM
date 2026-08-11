ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS note_new jsonb DEFAULT '[]'::jsonb;

UPDATE public.leads
SET note_new = jsonb_build_array(
  jsonb_build_object(
    'content', note,
    'created_at', COALESCE(created_at, now())
  )
)
WHERE note IS NOT NULL AND note != '';

ALTER TABLE public.leads DROP COLUMN IF EXISTS note;

ALTER TABLE public.leads RENAME COLUMN note_new TO note;
