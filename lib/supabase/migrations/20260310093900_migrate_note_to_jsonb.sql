-- Step 1: Add a temporary column for the new jsonb data
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS note_new jsonb DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing text notes into the new jsonb array format
UPDATE public.leads
SET note_new = jsonb_build_array(
  jsonb_build_object(
    'content', note,
    'created_at', COALESCE(created_at, now())
  )
)
WHERE note IS NOT NULL AND note != '';

-- Step 3: Drop the old text column
ALTER TABLE public.leads DROP COLUMN IF EXISTS note;

-- Step 4: Rename the new column to 'note'
ALTER TABLE public.leads RENAME COLUMN note_new TO note;
