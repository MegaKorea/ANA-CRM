ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS current_address_temp jsonb DEFAULT NULL;

COMMENT ON COLUMN leads.current_address_temp IS
  'Location using provinces.open-api.vn numeric province/district/ward codes. '
  'Shape: { provinceCode, districtCode, wardCode, province, district, ward, '
  ' provinceId, districtId, wardId }';
