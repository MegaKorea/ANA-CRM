ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS rate smallint NOT NULL DEFAULT 0;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_rate_range;

ALTER TABLE leads
  ADD CONSTRAINT leads_rate_range CHECK (rate >= 0 AND rate <= 5);
