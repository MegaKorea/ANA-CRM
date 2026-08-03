CREATE INDEX IF NOT EXISTS idx_quizzes_session_created
ON public.quizzes (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_quizzes_published_session_created
ON public.quizzes (session_id, created_at)
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_quiz_submitted
ON public.quiz_attempts (student_id, quiz_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_submitted
ON public.quiz_attempts (quiz_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
ON public.user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_unread_user_created
ON public.user_notifications (user_id, created_at DESC)
WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_lead_id
ON public.users (lead_id)
WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_phone
ON public.users (phone)
WHERE phone IS NOT NULL;
