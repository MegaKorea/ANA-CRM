-- Add room column to class_sessions table
ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS room TEXT DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.class_sessions.room IS 'Phòng học (ví dụ: PHÒNG A, PHÒNG B)';
