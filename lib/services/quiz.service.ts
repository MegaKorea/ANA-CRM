import { createAdminClient } from '@/lib/supabase/admin';
import { fail, throwIfSupabaseError } from '@/errors';
import {
  HttpStatusCode,
  QuizAttemptStatus,
  QuizErrorCode,
  QuizLimit,
  QuizUiMessage,
} from '@/constants/enums';
import {
  gradeQuizAnswers,
  quizHasEssayQuestions,
  stripQuizAnswers,
  type Quiz,
  type QuizAttempt,
  type QuizAttemptReview,
  type QuizCreateInput,
  type QuizQuestion,
  type QuizUpdateInput,
} from '@/lib/types/quiz';
import { deleteQuizNotificationsSafe } from '@/lib/services/user-notification.service';

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
  const status = (row.status as string) || QuizAttemptStatus.COMPLETED;
  const submittedRaw =
    typeof row.submitted_at === 'string' && row.submitted_at ? row.submitted_at : null;
  const startedRaw =
    typeof row.started_at === 'string' && row.started_at ? row.started_at : null;
    
  const started_at =
    startedRaw ?? (status === QuizAttemptStatus.IN_PROGRESS ? submittedRaw : null);
  const submitted_at = status === QuizAttemptStatus.COMPLETED ? submittedRaw : null;

  return {
    id: row.id as string,
    quiz_id: row.quiz_id as string,
    student_id: row.student_id as string,
    score: Number(row.score ?? 0),
    total_questions: Number(row.total_questions ?? 0),
    correct_answers: Number(row.correct_answers ?? 0),
    is_passed: Boolean(row.is_passed),
    status,
    user_answers:
      row.user_answers && typeof row.user_answers === 'object' && !Array.isArray(row.user_answers)
        ? (row.user_answers as Record<string, string[]>)
        : {},
    teacher_feedback: (row.teacher_feedback as string | null) ?? null,
    graded_by: (row.graded_by as string | null) ?? null,
    started_at,
    submitted_at,
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

function toQuizListItem(
  quiz: Quiz,
  myAttemptStatus: string | null = null,
): Quiz {
  return {
    ...quiz,
    question_count: quiz.questions.length,
    questions: [],
    my_attempt_status: myAttemptStatus,
  };
}

async function listMyAttemptStatusesByQuizIds(
  quizIds: string[],
  studentId: string,
): Promise<Map<string, string>> {
  const statusByQuizId = new Map<string, string>();
  if (quizIds.length === 0) return statusByQuizId;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, status, submitted_at')
    .eq('student_id', studentId)
    .in('quiz_id', quizIds)
    .order('submitted_at', { ascending: false });

  throwIfSupabaseError(error, QuizErrorCode.ATTEMPT_FETCH_FAILED);

  for (const row of (data as unknown as {
    quiz_id: string;
    status: string;
  }[]) || []) {
    if (!statusByQuizId.has(row.quiz_id)) {
      statusByQuizId.set(row.quiz_id, row.status);
    }
  }
  return statusByQuizId;
}

export async function listSessionQuizzes(
  sessionId: string,
  opts?: { forStudent?: boolean; studentId?: string; slim?: boolean },
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

  const slim = opts?.slim !== false;
  if (!slim) {
    return opts?.forStudent ? quizzes.map(stripQuizAnswers) : quizzes;
  }

  if (opts?.forStudent && opts.studentId) {
    const statusByQuizId = await listMyAttemptStatusesByQuizIds(
      quizzes.map((quiz) => quiz.id),
      opts.studentId,
    );
    return quizzes.map((quiz) =>
      toQuizListItem(quiz, statusByQuizId.get(quiz.id) ?? null),
    );
  }

  return quizzes.map((quiz) => toQuizListItem(quiz));
}

export async function getQuizById(quizId: string): Promise<Quiz> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .maybeSingle();
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
      has_essay: quizHasEssayQuestions(input.questions),
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
  if (input.questions !== undefined) {
    patch.questions = input.questions;
    patch.has_essay = quizHasEssayQuestions(input.questions);
  }

  let query = supabase
    .from('quizzes')
    .update(patch as never)
    .eq('id', quizId)
    .eq('session_id', sessionId);
  if (input.expected_updated_at) {
    query = query.eq('updated_at', input.expected_updated_at);
  }

  const { data, error } = await query.select('*');

  throwIfSupabaseError(error, QuizErrorCode.UPDATE_FAILED);
  if (!data || data.length === 0) {
    if (input.expected_updated_at) {
      fail(QuizErrorCode.CONFLICT, HttpStatusCode.CONFLICT);
    }
    fail(QuizErrorCode.NOT_FOUND, HttpStatusCode.NOT_FOUND);
  }
  const quiz = mapQuiz(data[0] as unknown as Record<string, unknown>);
  if (!quiz.is_published) {
    await deleteQuizNotificationsSafe(quizId);
  }
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
  await deleteQuizNotificationsSafe(quizId);
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

export async function gradeQuizAttemptEssay(
  attemptId: string,
  quizId: string,
  graderId: string,
  feedback: string,
): Promise<QuizAttempt> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quiz_attempts')
    .update({
      teacher_feedback: feedback,
      graded_by: graderId,
    } as never)
    .eq('id', attemptId)
    .eq('quiz_id', quizId)
    .eq('status', QuizAttemptStatus.COMPLETED)
    .select('*')
    .single();

  throwIfSupabaseError(error, QuizErrorCode.GRADE_FAILED);
  if (!data) fail(QuizErrorCode.ATTEMPT_NOT_FOUND, HttpStatusCode.NOT_FOUND);
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
  const attempts = ((data as unknown as Record<string, unknown>[]) || [])
    .map(mapAttempt)
    .filter((item) => item.status === QuizAttemptStatus.COMPLETED);
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

export async function startQuizAttempt(
  quizId: string,
  studentId: string,
  knownQuiz?: Quiz,
  knownAttempt?: QuizAttempt | null,
): Promise<QuizAttempt> {
  const [quiz, existing] = await Promise.all([
    knownQuiz ? Promise.resolve(knownQuiz) : getQuizById(quizId),
    knownAttempt !== undefined
      ? Promise.resolve(knownAttempt)
      : getMyQuizAttempt(quizId, studentId),
  ]);
  if (!quiz.is_published) {
    fail(QuizErrorCode.NOT_PUBLISHED, HttpStatusCode.FORBIDDEN);
  }

  if (existing?.status === QuizAttemptStatus.COMPLETED) {
    fail(QuizErrorCode.ALREADY_SUBMITTED, HttpStatusCode.CONFLICT);
  }
  if (existing?.status === QuizAttemptStatus.IN_PROGRESS) {
    return existing;
  }

  const startedAt = new Date().toISOString();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      student_id: studentId,
      score: 0,
      total_questions: 0,
      correct_answers: 0,
      is_passed: false,
      status: QuizAttemptStatus.IN_PROGRESS,
      user_answers: {},
      submitted_at: startedAt,
    } as never)
    .select('*')
    .single();

  throwIfSupabaseError(error, QuizErrorCode.ATTEMPT_FAILED);
  if (!data) fail(QuizErrorCode.ATTEMPT_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
  return mapAttempt(data as unknown as Record<string, unknown>);
}

export async function saveQuizAttemptDraft(
  quizId: string,
  studentId: string,
  answers: Record<string, string[]>,
  knownAttempt?: QuizAttempt | null,
): Promise<QuizAttempt> {
  const existing =
    knownAttempt !== undefined
      ? knownAttempt
      : await getMyQuizAttempt(quizId, studentId);
  if (!existing || existing.status !== QuizAttemptStatus.IN_PROGRESS) {
    fail(QuizErrorCode.ATTEMPT_NOT_STARTED, HttpStatusCode.CONFLICT);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('quiz_attempts')
    .update({ user_answers: answers } as never)
    .eq('id', existing.id)
    .eq('status', QuizAttemptStatus.IN_PROGRESS)
    .select('*')
    .single();

  throwIfSupabaseError(error, QuizErrorCode.ATTEMPT_FAILED);
  if (!data) fail(QuizErrorCode.ATTEMPT_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
  return mapAttempt(data as unknown as Record<string, unknown>);
}

export async function submitQuizAttempt(
  quizId: string,
  studentId: string,
  answers: Record<string, string[]>,
  knownQuiz?: Quiz,
  knownAttempt?: QuizAttempt | null,
): Promise<QuizAttempt> {
  const [quiz, existing] = await Promise.all([
    knownQuiz ? Promise.resolve(knownQuiz) : getQuizById(quizId),
    knownAttempt !== undefined
      ? Promise.resolve(knownAttempt)
      : getMyQuizAttempt(quizId, studentId),
  ]);
  if (!quiz.is_published) {
    fail(QuizErrorCode.NOT_PUBLISHED, HttpStatusCode.FORBIDDEN);
  }

  if (existing?.status === QuizAttemptStatus.COMPLETED) {
    fail(QuizErrorCode.ALREADY_SUBMITTED, HttpStatusCode.CONFLICT);
  }
  if (!existing || existing.status !== QuizAttemptStatus.IN_PROGRESS) {
    fail(
      QuizErrorCode.ATTEMPT_NOT_STARTED,
      HttpStatusCode.CONFLICT,
      QuizUiMessage.START_FAILED,
    );
  }
  if (quiz.duration_minutes > 0 && !existing.started_at) {
    fail(
      QuizErrorCode.ATTEMPT_NOT_STARTED,
      HttpStatusCode.CONFLICT,
      QuizUiMessage.START_FAILED,
    );
  }
  // Timed quizzes: client auto-submits at 0. Still accept late finalize so
  // network delay / background-tab throttle cannot leave IN_PROGRESS forever.
  // Extra time is bounded by requiring start first (one attempt).

  const { correct, total, score } = gradeQuizAnswers(quiz.questions, answers);
  const is_passed = total > 0 && score >= quiz.passing_score;
  const submittedAt = new Date().toISOString();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('quiz_attempts')
    .update({
      score,
      total_questions: total,
      correct_answers: correct,
      is_passed,
      status: QuizAttemptStatus.COMPLETED,
      user_answers: answers,
      submitted_at: submittedAt,
    } as never)
    .eq('id', existing.id)
    .eq('status', QuizAttemptStatus.IN_PROGRESS)
    .select('*')
    .single();

  throwIfSupabaseError(error, QuizErrorCode.ATTEMPT_FAILED);
  if (!data) fail(QuizErrorCode.ATTEMPT_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
  return mapAttempt({
    ...(data as unknown as Record<string, unknown>),
    started_at: existing.started_at,
  });
}
