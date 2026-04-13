-- Add facebook_url and conversation fields to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS conversation TEXT;
