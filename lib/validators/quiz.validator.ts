import { AppError } from '@/errors';
import {
  HttpStatusCode,
  QuizErrorCode,
  QuizLimit,
  QuizQuestionType,
} from '@/constants/enums';
import type { QuizCreateInput, QuizQuestion, QuizUpdateInput } from '@/lib/types/quiz';

function clampDurationMinutes(value: number): number {
  return Math.min(QuizLimit.DURATION_MAX, Math.max(QuizLimit.DURATION_MIN, value));
}

function clampPassingScore(value: number): number {
  return Math.min(QuizLimit.PASSING_SCORE_MAX, Math.max(QuizLimit.PASSING_SCORE_MIN, value));
}

function parseQuestionType(value: unknown): QuizQuestionType {
  if (value === QuizQuestionType.MULTIPLE) return QuizQuestionType.MULTIPLE;
  if (value === QuizQuestionType.ESSAY) return QuizQuestionType.ESSAY;
  return QuizQuestionType.SINGLE;
}

function parseQuestions(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value) || value.length < QuizLimit.MIN_QUESTIONS) {
    throw new AppError(QuizErrorCode.QUESTIONS_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(QuizErrorCode.INVALID_QUESTION, HttpStatusCode.BAD_REQUEST);
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'string' && row.id.trim() ? row.id.trim() : crypto.randomUUID();
    const type = parseQuestionType(row.type);
    const prompt = typeof row.prompt === 'string' ? row.prompt.trim() : '';
    if (!prompt) {
      throw new AppError(QuizErrorCode.QUESTION_PROMPT_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const imageUrlsRaw = Array.isArray(row.image_urls) ? row.image_urls : [];
    const image_urls = [
      ...new Set(
        [
          ...imageUrlsRaw.filter((url): url is string => typeof url === 'string' && !!url.trim()),
          typeof row.image_url === 'string' && row.image_url.trim() ? row.image_url.trim() : null,
        ].filter((url): url is string => !!url),
      ),
    ].slice(0, QuizLimit.MAX_IMAGES_PER_QUESTION);

    if (type === QuizQuestionType.ESSAY) {
      return {
        id,
        type,
        prompt,
        image_url: image_urls[0] ?? null,
        image_urls,
        options: [],
        correct_option_ids: [],
      };
    }

    if (!Array.isArray(row.options) || row.options.length < QuizLimit.MIN_OPTIONS) {
      throw new AppError(QuizErrorCode.OPTIONS_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    const options = row.options.map((opt) => {
      if (!opt || typeof opt !== 'object') {
        throw new AppError(QuizErrorCode.INVALID_OPTION, HttpStatusCode.BAD_REQUEST);
      }
      const optionRow = opt as Record<string, unknown>;
      const text = typeof optionRow.text === 'string' ? optionRow.text.trim() : '';
      if (!text) {
        throw new AppError(QuizErrorCode.OPTION_TEXT_REQUIRED, HttpStatusCode.BAD_REQUEST);
      }
      return {
        id:
          typeof optionRow.id === 'string' && optionRow.id.trim()
            ? optionRow.id.trim()
            : crypto.randomUUID(),
        text,
      };
    });

    const seenOptionText = new Set<string>();
    for (const option of options) {
      const normalized = option.text.toLowerCase();
      if (seenOptionText.has(normalized)) {
        throw new AppError(QuizErrorCode.DUPLICATE_OPTION_TEXT, HttpStatusCode.BAD_REQUEST);
      }
      seenOptionText.add(normalized);
    }

    const correctRaw = Array.isArray(row.correct_option_ids) ? row.correct_option_ids : [];
    const correct_option_ids = correctRaw
      .filter((x): x is string => typeof x === 'string' && !!x.trim())
      .map((x) => x.trim());
    const optionIds = new Set(options.map((option) => option.id));
    if (correct_option_ids.length === 0 || correct_option_ids.some((id) => !optionIds.has(id))) {
      throw new AppError(QuizErrorCode.CORRECT_ANSWER_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    if (type === QuizQuestionType.SINGLE && correct_option_ids.length !== 1) {
      throw new AppError(QuizErrorCode.SINGLE_ONE_ANSWER, HttpStatusCode.BAD_REQUEST);
    }

    return {
      id,
      type,
      prompt,
      image_url: image_urls[0] ?? null,
      image_urls,
      options,
      correct_option_ids,
    };
  });
}

export function validateCreateQuizInput(input: unknown): QuizCreateInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(QuizErrorCode.INVALID_INPUT, HttpStatusCode.BAD_REQUEST);
  }
  const data = input as Record<string, unknown>;
  if (typeof data.title !== 'string' || !data.title.trim()) {
    throw new AppError(QuizErrorCode.TITLE_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }
  const questions = parseQuestions(data.questions);
  return {
    title: data.title.trim(),
    duration_minutes:
      typeof data.duration_minutes === 'number'
        ? clampDurationMinutes(data.duration_minutes)
        : QuizLimit.DURATION_MIN,
    passing_score:
      typeof data.passing_score === 'number'
        ? clampPassingScore(data.passing_score)
        : QuizLimit.PASSING_SCORE_DEFAULT,
    is_published: Boolean(data.is_published),
    questions,
  };
}

export function validateUpdateQuizInput(input: unknown): QuizUpdateInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(QuizErrorCode.INVALID_INPUT, HttpStatusCode.BAD_REQUEST);
  }
  const data = input as Record<string, unknown>;
  const result: QuizUpdateInput = {};
  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || !data.title.trim()) {
      throw new AppError(QuizErrorCode.TITLE_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    result.title = data.title.trim();
  }
  if (typeof data.duration_minutes === 'number') {
    result.duration_minutes = clampDurationMinutes(data.duration_minutes);
  }
  if (typeof data.passing_score === 'number') {
    result.passing_score = clampPassingScore(data.passing_score);
  }
  if (data.is_published !== undefined) {
    result.is_published = Boolean(data.is_published);
  }
  if (data.questions !== undefined) {
    result.questions = parseQuestions(data.questions);
  }
  if (typeof data.expected_updated_at === 'string' && data.expected_updated_at) {
    result.expected_updated_at = data.expected_updated_at;
  }
  return result;
}

function parseAnswersRecord(answers: unknown): Record<string, string[]> {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new AppError(QuizErrorCode.ANSWERS_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }
  const result: Record<string, string[]> = {};
  for (const [questionId, value] of Object.entries(answers as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      result[questionId] = value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.slice(0, QuizLimit.MAX_ESSAY_LENGTH));
    } else if (typeof value === 'string') {
      result[questionId] = [value.slice(0, QuizLimit.MAX_ESSAY_LENGTH)];
    } else {
      result[questionId] = [];
    }
  }
  return result;
}

export function isStartAttemptRequest(input: unknown): boolean {
  return (
    !!input &&
    typeof input === 'object' &&
    (input as Record<string, unknown>).action === 'start'
  );
}

export function validateSubmitAttemptInput(input: unknown): Record<string, string[]> {
  if (!input || typeof input !== 'object') {
    throw new AppError(QuizErrorCode.INVALID_INPUT, HttpStatusCode.BAD_REQUEST);
  }
  return parseAnswersRecord((input as Record<string, unknown>).answers);
}

export function validateDraftAttemptInput(input: unknown): Record<string, string[]> {
  if (!input || typeof input !== 'object') {
    throw new AppError(QuizErrorCode.INVALID_INPUT, HttpStatusCode.BAD_REQUEST);
  }
  return parseAnswersRecord((input as Record<string, unknown>).answers);
}

export function validateGradeAttemptInput(input: unknown): { feedback: string } {
  if (!input || typeof input !== 'object') {
    throw new AppError(QuizErrorCode.INVALID_INPUT, HttpStatusCode.BAD_REQUEST);
  }
  const data = input as Record<string, unknown>;
  const feedback = typeof data.feedback === 'string' ? data.feedback.trim() : '';
  if (!feedback) {
    throw new AppError(QuizErrorCode.FEEDBACK_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }
  return { feedback: feedback.slice(0, QuizLimit.MAX_ESSAY_LENGTH) };
}
