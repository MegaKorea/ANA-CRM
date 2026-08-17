ALTER TABLE public.classes
  RENAME COLUMN teacher_id TO homeroom_teacher_id;

ALTER TABLE public.classes
  ALTER COLUMN timetable TYPE jsonb USING to_jsonb(timetable::text);
