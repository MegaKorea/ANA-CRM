ALTER TABLE public.enrollments
  ALTER COLUMN course_id DROP NOT NULL;

ALTER TABLE public.enrollments
  ADD COLUMN category varchar(20),
  ADD COLUMN item_name text NULL;

-- Backfill existing rows before the NOT NULL / CHECK constraints go on, so
-- the migration doesn't fail against data imported before this feature
-- existed. Rows with a real course_id become 'khóa học'; the rest (raw
-- imported rows with no course match) are classified from course_name_raw —
-- anything mentioning "chứng" (chứng chỉ/chứng nhận) becomes 'chứng chỉ',
-- everything else falls into 'vật tư', preserving the original text in
-- item_name so nothing imported is lost.
UPDATE public.enrollments
SET category = 'khóa học'
WHERE course_id IS NOT NULL;

UPDATE public.enrollments
SET category = 'chứng chỉ',
    item_name = COALESCE(course_name_raw, 'Chứng chỉ (dữ liệu cũ)')
WHERE course_id IS NULL AND course_name_raw ILIKE '%chứng%';

UPDATE public.enrollments
SET category = 'vật tư',
    item_name = COALESCE(course_name_raw, 'Vật tư (dữ liệu cũ)')
WHERE course_id IS NULL AND category IS NULL;

ALTER TABLE public.enrollments
  ALTER COLUMN category SET DEFAULT 'khóa học',
  ALTER COLUMN category SET NOT NULL;

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_category_check CHECK (category IN ('khóa học', 'vật tư', 'chứng chỉ'));

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_category_consistency CHECK (
    (category = 'khóa học' AND course_id IS NOT NULL AND item_name IS NULL)
    OR
    (category <> 'khóa học' AND course_id IS NULL AND class_id IS NULL AND item_name IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_enrollments_category ON public.enrollments(category);
