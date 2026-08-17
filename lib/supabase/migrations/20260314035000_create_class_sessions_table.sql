CREATE TABLE IF NOT EXISTS public.class_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id          uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_number    integer NOT NULL,
  date              date NOT NULL,
  teacher_id        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content           text,
  qr_code_token     text,
  qr_code_expires_at timestamptz,
  body_json         jsonb DEFAULT '{}'::jsonb,
  attachments       jsonb DEFAULT '[]'::jsonb,
  has_content       boolean NOT NULL DEFAULT false,
  has_quiz          boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_sessions_class_id ON public.class_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher_id ON public.class_sessions(teacher_id);

CREATE OR REPLACE FUNCTION update_class_sessions_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_class_sessions_updated_at
BEFORE UPDATE ON public.class_sessions
FOR EACH ROW
EXECUTE FUNCTION update_class_sessions_updated_at_column();
