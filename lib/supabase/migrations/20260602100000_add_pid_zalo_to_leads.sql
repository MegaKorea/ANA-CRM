-- Add Zalo PID field to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS pid_zalo VARCHAR;
