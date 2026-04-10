-- Migration: Add current_address_temp column to leads table
-- Run this SQL in Supabase Dashboard > SQL Editor
--
-- Purpose: The old `current_address` field stores data from the legacy
--   open.oapi.vn API (string-based IDs). This new column stores data from
--   the new provinces.open-api.vn API (numeric codes).
--   Both fields coexist to avoid breaking existing data.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS current_address_temp jsonb DEFAULT NULL;

-- Optional: add a comment for documentation
COMMENT ON COLUMN leads.current_address_temp IS
  'Location using new provinces.open-api.vn API (numeric province/district/ward codes). '
  'Replaces current_address for newly created/updated records. '
  'Shape: { provinceCode, districtCode, wardCode, province, district, ward, '
  ' provinceId (string shim), districtId (string shim), wardId (string shim) }';
