-- Two drifts on classes confirmed against the live database
-- (information_schema.columns dump), neither captured by a migration:
--
-- 1) teacher_id was renamed to homeroom_teacher_id — matches
--    lib/services/class.service.ts / lib/validators/class.validator.ts,
--    which only ever reference homeroom_teacher_id.
-- 2) 20260311155000_add_timetable_to_classes.sql added timetable as the
--    single-value class_timetable enum; production has since widened it
--    to jsonb.

ALTER TABLE public.classes
  RENAME COLUMN teacher_id TO homeroom_teacher_id;

ALTER TABLE public.classes
  ALTER COLUMN timetable TYPE jsonb USING to_jsonb(timetable::text);
