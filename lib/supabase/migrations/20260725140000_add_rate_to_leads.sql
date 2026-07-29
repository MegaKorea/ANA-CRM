-- Customer potential rating (0–5 stars), edited inline on the lead table.
-- 0 = not yet rated. Constrained to the 0–5 range at the DB level.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS rate smallint NOT NULL DEFAULT 0;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_rate_range;

ALTER TABLE leads
  ADD CONSTRAINT leads_rate_range CHECK (rate >= 0 AND rate <= 5);
