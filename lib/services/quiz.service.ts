import { createAdminClient } from '@/lib/supabase/admin';
import { fail, throwIfSupabaseError } from '@/errors';
import {
  HttpStatusCode,
  QuizAttemptStatus,
  QuizErrorCode,
  QuizLimit,
} from '@/constants/enums';
import {
  gradeQuizAnswers,
  stripQuizAnswers,
  type Quiz,
  type QuizAttempt,
  type QuizAttemptReview,
  type QuizCreateInput,
  type QuizQuestion,
  type QuizUpdateInput,
} from '@/lib/types/quiz';

function mapQuiz(row: Record<string, unknown>): Quiz {
  return {
    id: row.id as string,
    class_id: row.class_id as string,
    session_id: (row.session_id as string | null) ?? null,
    title: row.title as string,
    duration_minutes: Number(row.duration_minutes ?? QuizLimit.DURATION_MIN),
    passing_score: Number(row.passing_score ?? QuizLimit.PASSING_SCORE_MIN),
    is_published: Boolean(row.is_published),
    has_essay: Boolean(row.has_essay),
    questions: Array.isArray(row.questions) ? (row.questions as QuizQuestion[]) : [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapAttempt(row: Record<string, unknown>): QuizAttempt {
  return {
    id: row.id as string,
    quiz_id: row.quiz_id as string,
    student_id: row.student_id as string,
    score: Number(row.score ?? 0),
    total_questions: Number(row.total_questions ?? 0),
    correct_answers: Number(row.correct_answers ?? 0),
    is_passed: Boolean(row.is_passed),
    status: (row.status as string) ?? QuizAttemptStatus.COMPLETED,
    user_answers:
      row.user_answers && typeof row.user_answers === 'object' && !Array.isArray(row.user_answers)
        ? (row.user_answers as Record<string, string[]>)
        : {},
    teacher_feedback: (row.teacher_feedback as string | null) ?? null,
    graded_by: (row.graded_by as string | null) ?? null,
    submitted_at: row.submitted_at as string,
  };
}

async function syncSessionHasQuiz(sessionId: string): Promise<void> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from('quizzes')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('is_published', true);

  throwIfSupabaseError(error, QuizErrorCode.HAS_QUIZ_SYNC_FAILED);
  await supabase
    .from('class_sessions')
    .update({
      has_quiz: (count ?? 0) > 0,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', sessionId);
}

export async function listSessionQuizzes(
  sessionId: string,
  opts?: { forStudent?: boolean },
): Promise<Quiz[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('quizzes')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (opts?.forStudent) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, QuizErrorCode.FETCH_FAILED);
  const quizzes = ((data as unknown as Record<string, unknown>[]) || []).map(mapQuiz);
  return opts?.forStudent ? quizzes.map(stripQuizAnswers) : quizzes;
}

export async function getQuizById(quizId: string): Promise<Quiz> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
  throwIfSupabaseError(error, QuizErrorCode.NOT_FOUND);
  if (!data) fail(QuizErrorCode.NOT_FOUND, HttpStatusCode.NOT_FOUND);
  return mapQuiz(data as unknown as Record<string, unknown>);
}

export async function createSessionQuiz(
  classId: string,
  sessionId: string,
  input: QuizCreateInput,
): Promise<Quiz> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      class_id: classId,
      session_id: sessionId,
      title: input.title,
      duration_minutes: input.duration_minutes ?? QuizLimit.DURATION_MIN,
      passing_score: input.passing_score ?? QuizLimit.PASSING_SCORE_DEFAULT,
      is_published: input.is_published ?? false,
      has_essay: false,
      questions: input.questions,
    } as never)
    .select('*')
    .single();

  throwIfSupabaseError(error, QuizErrorCode.CREATE_FAILED);
  if (!data) fail(QuizErrorCode.CREATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
  const quiz = mapQuiz(data as unknown as Record<string, unknown>);
  if (quiz.is_published) await syncSessionHasQuiz(sessionId);
  return quiz;
}

export async function updateSessionQuiz(
  quizId: string,
  sessionId: string,
  input: QuizUpdateInput,
): Promise<Quiz> {
  const supabase = createAdminClient();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title;
  if (input.duration_minutes !== undefined) patch.duration_minutes = input.duration_minutes;
  if (input.passing_score !== undefined) patch.passing_score = input.passing_score;
  if (input.is_published !== undefined) patch.is_published = input.is_published;
  if (input.questions !== undefined) patch.questions = input.questions;

  const { data, error } = await supabase
    .from('quizzes')
    .update(patch as never)
    .eq('id', quizId)
    .eq('session_id', sessionId)
    .select('*')
    .single();

  throwIfSupabaseError(error, QuizErrorCode.UPDATE_FAILED);
  if (!data) fail(QuizErrorCode.NOT_FOUND, HttpStatusCode.NOT_FOUND);
  const quiz = mapQuiz(data as unknown as Record<string, unknown>);
  await syncSessionHasQuiz(sessionId);
  return quiz;
}

export async function deleteSessionQuiz(quizId: string, sessionId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId)
    .eq('session_id', sessionId);
  throwIfSupabaseError(error, QuizErrorCode.DELETE_FAILED);
  await syncSessionHasQuiz(sessionId);
}

export async function getMyQuizAttempt(
  quizId: string,
  studentId: string,
): Promise<QuizAttempt | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError(error, QuizErrorCode.ATTEMPT_FETCH_FAILED);
  if (!data) return null;
  return mapAttempt(data as unknown as Record<string, unknown>);
}

export async function listQuizAttemptsForTeacher(
  quizId: string,
): Promise<QuizAttemptReview[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .order('submitted_at', { ascending: false });

  throwIfSupabaseError(error, QuizErrorCode.ATTEMPT_FETCH_FAILED);
  const attempts = ((data as unknown as Record<string, unknown>[]) || []).map(mapAttempt);
  if (attempts.length === 0) return [];

  const studentIds = [...new Set(attempts.map((item) => item.student_id))];
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, email')
    .in('id', studentIds);

  throwIfSupabaseError(usersError, QuizErrorCode.ATTEMPT_FETCH_FAILED);

  const userById = new Map(
    ((users as unknown as { id: string; full_name: string | null; email: string | null }[]) || []).map(
      (user) => [user.id, user],
    ),
  );

  return attempts.map((attempt) => {
    const user = userById.get(attempt.student_id);
    return {
      ...attempt,
      student_name: user?.full_name?.trim() || user?.email || 'Học viên',
      student_email: user?.email ?? null,
    };
  });
}

export async function submitQuizAttempt(
  quizId: string,
  studentId: string,
  answers: Record<string, string[]>,
): Promise<QuizAttempt> {
  const quiz = await getQuizById(quizId);
  if (!quiz.is_published) {
    fail(QuizErrorCode.NOT_PUBLISHED, HttpStatusCode.FORBIDDEN);
  }

  const existing = await getMyQuizAttempt(quizId, studentId);
  if (existing) {
    fail(QuizErrorCode.ALREADY_SUBMITTED, HttpStatusCode.CONFLICT);
  }

  const { correct, total, score } = gradeQuizAnswers(quiz.questions, answers);
  const is_passed = score >= quiz.passing_score;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      student_id: studentId,
      score,
      total_questions: total,
      correct_answers: correct,
      is_passed,
      status: QuizAttemptStatus.COMPLETED,
      user_answers: answers,
      submitted_at: new Date().toISOString(),
    } as never)
    .select('*')
    .single();

  throwIfSupabaseError(error, QuizErrorCode.ATTEMPT_FAILED);
  if (!data) fail(QuizErrorCode.ATTEMPT_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
  return mapAttempt(data as unknown as Record<string, unknown>);
}
