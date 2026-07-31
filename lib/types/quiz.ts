import { QuizQuestionType } from '@/constants/enums';

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
};

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
  submitted_at: string;
};

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

export type QuizUpdateInput = Partial<QuizCreateInput>;

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

export function stripQuizAnswers(quiz: Quiz): Quiz {
  return {
    ...quiz,
    questions: quiz.questions.map((question) => {
      const image_urls = getQuestionImageUrls(question);
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
  let correct = 0;
  const total = questions.length;
  for (const question of questions) {
    if (isQuizAnswerCorrect(question, userAnswers[question.id] ?? [])) {
      correct += 1;
    }
  }
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, score };
}

export function isQuizAnswerCorrect(question: QuizQuestion, given: string[]): boolean {
  const expected = question.correct_option_ids ?? [];
  if (question.type === QuizQuestionType.MULTIPLE) {
    return isMultipleAnswerPartialCorrect(expected, given);
  }
  return areOptionIdSetsEqual(expected, given);
}
