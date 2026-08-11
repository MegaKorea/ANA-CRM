ALTER TABLE public.enrollments
  ALTER COLUMN course_id DROP NOT NULL;

ALTER TABLE public.enrollments
  ADD COLUMN category varchar(20) NOT NULL DEFAULT 'khóa học'
    CHECK (category IN ('khóa học', 'vật tư', 'chứng chỉ')),
  ADD COLUMN item_name text NULL;

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_category_consistency CHECK (
    (category = 'khóa học' AND course_id IS NOT NULL AND item_name IS NULL)
    OR
    (category <> 'khóa học' AND course_id IS NULL AND class_id IS NULL AND item_name IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_enrollments_category ON public.enrollments(category);
