-- Migration: Add 'nurturing' to leads status check constraint
-- Run this SQL in Supabase Dashboard > SQL Editor
--
-- Purpose: Add new lead status 'nurturing' (ĐANG CHĂM SÓC) to the
--   allowed values for the `status` column in the leads table.

-- Step 1: Drop the existing check constraint (if any) on the status column.
-- NOTE: Replace 'leads_status_check' with the actual constraint name from your DB.
-- You can find it via: SELECT conname FROM pg_constraint WHERE conrelid = 'leads'::regclass;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Step 2: Re-add the constraint with 'nurturing' included
ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN (
    'new',
    'converted',
    'not_contacted',
    'reject',
    'interested',
    'not_interested',
    'nurturing',
    'other'
  ));
