ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_imported boolean NOT NULL DEFAULT false;

-- Backfill the 2026-08-11 bulk data-fix import (ids 1106-1159) so it stops
-- being counted as new leads/conversions in the month it was imported.
UPDATE public.leads SET is_imported = true WHERE id BETWEEN 1106 AND 1159;
