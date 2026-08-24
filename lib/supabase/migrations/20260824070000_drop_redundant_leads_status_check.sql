-- leads.status is already a `lead_status` enum, which enforces valid values
-- at the type level. An out-of-band CHECK constraint (added outside any
-- migration, so not tracked here) duplicated that with an older, stale
-- value list that never got updated when new statuses (e.g. low_interaction)
-- were added to the enum — silently rejecting valid enum values.
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
