import { QuizAttemptStatus, QuizLimit, QuizQuestionType, QuizUiMessage } from '@/constants/enums';

export type QuizOption = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  image_url?: string | null;
  image_urls?: string[];
  options: QuizOption[];
  correct_option_ids?: string[];
};

export type Quiz = {
  id: string;
  class_id: string;
  session_id: string | null;
  title: string;
  duration_minutes: number;
  passing_score: number;
  is_published: boolean;
  has_essay: boolean;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
  question_count?: number;
  my_attempt_status?: string | null;
};

export function getQuizQuestionCount(quiz: Pick<Quiz, 'questions' | 'question_count'>): number {
  if (typeof quiz.question_count === 'number') return quiz.question_count;
  return quiz.questions.length;
}

export type QuizAttempt = {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  is_passed: boolean;
  status: string;
  user_answers: Record<string, string[]>;
  teacher_feedback: string | null;
  graded_by: string | null;
  /** When the student started the attempt (timer clock). */
  started_at: string | null;
  /** Set when status is COMPLETED; null while in progress. */
  submitted_at: string | null;
};

export function isQuizAttemptCompleted(attempt: QuizAttempt | null | undefined): boolean {
  return !!attempt && attempt.status === QuizAttemptStatus.COMPLETED;
}

export function isQuizAttemptInProgress(attempt: QuizAttempt | null | undefined): boolean {
  return !!attempt && attempt.status === QuizAttemptStatus.IN_PROGRESS;
}

export function getQuizAttemptRemainingSeconds(
  startedAt: string | null | undefined,
  durationMinutes: number,
  nowMs: number = Date.now(),
): number | null {
  if (durationMinutes <= 0 || !startedAt) return null;
  const endsAt =
    new Date(startedAt).getTime() + durationMinutes * QuizLimit.SECONDS_PER_MINUTE * 1000;
  return Math.max(0, Math.floor((endsAt - nowMs) / 1000));
}

export type QuizAttemptReview = QuizAttempt & {
  student_name: string;
  student_email: string | null;
};

export type QuizCreateInput = {
  title: string;
  duration_minutes?: number;
  passing_score?: number;
  is_published?: boolean;
  questions: QuizQuestion[];
};

export type QuizUpdateInput = Partial<QuizCreateInput> & {
  expected_updated_at?: string;
};

export function getQuestionImageUrls(question: QuizQuestion): string[] {
  if (Array.isArray(question.image_urls) && question.image_urls.length > 0) {
    return question.image_urls.filter((url) => typeof url === 'string' && !!url.trim());
  }
  if (typeof question.image_url === 'string' && question.image_url.trim()) {
    return [question.image_url.trim()];
  }
  return [];
}

export function areOptionIdSetsEqual(expected: string[], given: string[]): boolean {
  const sortedExpected = [...expected].sort();
  const sortedGiven = [...given].sort();
  return (
    sortedExpected.length > 0 &&
    sortedExpected.length === sortedGiven.length &&
    sortedExpected.every((id, index) => id === sortedGiven[index])
  );
}

export function isMultipleAnswerPartialCorrect(expected: string[], given: string[]): boolean {
  if (expected.length === 0 || given.length === 0) return false;
  const correctSet = new Set(expected);
  return given.every((id) => correctSet.has(id));
}

export function isAutoGradableQuestion(question: Pick<QuizQuestion, 'type'>): boolean {
  return question.type !== QuizQuestionType.ESSAY;
}

export function quizHasEssayQuestions(questions: Pick<QuizQuestion, 'type'>[]): boolean {
  return questions.some((question) => question.type === QuizQuestionType.ESSAY);
}

export function isQuestionAnswered(
  question: Pick<QuizQuestion, 'id' | 'type'>,
  answers: Record<string, string[]>,
): boolean {
  const given = answers[question.id] ?? [];
  if (question.type === QuizQuestionType.ESSAY) {
    return !!given[0]?.trim();
  }
  return given.length > 0;
}

export function stripQuizAnswers(quiz: Quiz): Quiz {
  return {
    ...quiz,
    questions: quiz.questions.map((question) => {
      const image_urls = getQuestionImageUrls(question);
      if (question.type === QuizQuestionType.ESSAY) {
        return {
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          image_url: image_urls[0] ?? null,
          image_urls,
          options: [],
        };
      }
      return {
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        image_url: image_urls[0] ?? null,
        image_urls,
        options: question.options,
      };
    }),
  };
}

export function gradeQuizAnswers(
  questions: QuizQuestion[],
  userAnswers: Record<string, string[]>,
): { correct: number; total: number; score: number } {
  const autoQuestions = questions.filter(isAutoGradableQuestion);
  let correct = 0;
  const total = autoQuestions.length;
  for (const question of autoQuestions) {
    if (isQuizAnswerCorrect(question, userAnswers[question.id] ?? [])) {
      correct += 1;
    }
  }
  
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, score };
}

export function countQuizQuestionKinds(questions: Pick<QuizQuestion, 'type'>[]): {
  auto: number;
  essay: number;
} {
  let auto = 0;
  let essay = 0;
  for (const question of questions) {
    if (isAutoGradableQuestion(question)) auto += 1;
    else essay += 1;
  }
  return { auto, essay };
}

export type QuizResultSummary = {
  title: string;
  detail: string;
};

export function buildQuizResultSummary(input: {
  questions: Pick<QuizQuestion, 'type'>[];
  score: number;
  correct: number;
  total: number;
  isPassed: boolean;
  passingScore: number;
}): QuizResultSummary {
  const { auto, essay } = countQuizQuestionKinds(input.questions);
  const passing =
    input.passingScore > 0 ? `Điểm đạt: ${input.passingScore}%` : null;

  if (auto === 0 && essay > 0) {
    return {
      title: QuizUiMessage.ESSAY_SUBMITTED_TITLE,
      detail:
        essay === 1
          ? `1 câu tự luận — ${QuizUiMessage.ESSAY_AWAITING_REVIEW}`
          : `${essay} câu tự luận — ${QuizUiMessage.ESSAY_AWAITING_REVIEW}`,
    };
  }

  const passLabel = input.isPassed
    ? QuizUiMessage.RESULT_PASSED
    : QuizUiMessage.RESULT_FAILED;

  if (essay === 0) {
    return {
      title: `${passLabel} · ${input.score}%`,
      detail: [`Đúng ${input.correct}/${input.total} câu`, passing]
        .filter(Boolean)
        .join(' · '),
    };
  }

  const essayDetail =
    essay === 1
      ? `1 câu tự luận ${QuizUiMessage.ESSAY_AWAITING_REVIEW}`
      : `${essay} câu tự luận ${QuizUiMessage.ESSAY_AWAITING_REVIEW}`;

  return {
    title: `${passLabel} · ${input.score}% ${QuizUiMessage.RESULT_MCQ_SCORE_SUFFIX}`,
    detail: [
      `Đúng ${input.correct}/${input.total} câu trắc nghiệm`,
      passing,
      essayDetail,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

export function isQuizAnswerCorrect(question: QuizQuestion, given: string[]): boolean {
  if (question.type === QuizQuestionType.ESSAY) return false;
  const expected = question.correct_option_ids ?? [];
  if (question.type === QuizQuestionType.MULTIPLE) {
    return isMultipleAnswerPartialCorrect(expected, given);
  }
  return areOptionIdSetsEqual(expected, given);
}
