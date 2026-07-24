-- Add Smax log field to leads table.
-- Stores the raw customer object returned by Smax when the lead-form is
-- submitted from an embedded Smax form (event __SM_FORM_CUSTOMER).
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS smax_log JSONB;
