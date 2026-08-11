CREATE TABLE IF NOT EXISTS public.quizzes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id          uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_id        uuid REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  title             text NOT NULL,
  duration_minutes  integer NOT NULL DEFAULT 0,
  passing_score     integer NOT NULL DEFAULT 0,
  is_published      boolean NOT NULL DEFAULT false,
  has_essay         boolean NOT NULL DEFAULT false,
  questions         jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_class_id ON public.quizzes(class_id);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id           uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score             integer NOT NULL DEFAULT 0,
  total_questions   integer NOT NULL DEFAULT 0,
  correct_answers   integer NOT NULL DEFAULT 0,
  is_passed         boolean NOT NULL DEFAULT false,
  status            text NOT NULL DEFAULT 'COMPLETED',
  user_answers      jsonb NOT NULL DEFAULT '{}'::jsonb,
  teacher_feedback  text,
  graded_by         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  submitted_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);

CREATE TABLE IF NOT EXISTS public.session_attendances (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status            text NOT NULL,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_attendances_session_id ON public.session_attendances(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendances_student_id ON public.session_attendances(student_id);

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type              varchar(50) NOT NULL,
  title             text NOT NULL,
  body              text NOT NULL,
  payload           jsonb DEFAULT '{}'::jsonb,
  read_at           timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
