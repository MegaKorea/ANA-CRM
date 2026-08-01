import type { FormInstance } from 'antd';
import { QuizLimit, QuizQuestionType } from '@/constants/enums';
import type { Quiz, QuizCreateInput } from '@/lib/types/quiz';
import { getQuestionImageUrls } from '@/lib/types/quiz';

export type QuizOptionForm = { id: string; text: string };

export type QuizQuestionForm = {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  image_urls: string[];
  options: QuizOptionForm[];
  correct_option_ids: string[];
};

export type QuizFormValues = {
  title: string;
  duration_minutes?: number;
  passing_score?: number;
  is_published?: boolean;
  questions: QuizQuestionForm[];
};

export function newQuizEntityId(): string {
  return crypto.randomUUID();
}

function createDefaultOptions(): QuizOptionForm[] {
  return [
    { id: newQuizEntityId(), text: '' },
    { id: newQuizEntityId(), text: '' },
  ];
}

export function createEmptyQuizQuestion(): QuizQuestionForm {
  const options = createDefaultOptions();
  return {
    id: newQuizEntityId(),
    type: QuizQuestionType.SINGLE,
    prompt: '',
    image_urls: [],
    options,
    correct_option_ids: [options[0].id],
  };
}

function normalizeQuestionType(type: QuizQuestionType | string): QuizQuestionType {
  if (type === QuizQuestionType.MULTIPLE) return QuizQuestionType.MULTIPLE;
  if (type === QuizQuestionType.ESSAY) return QuizQuestionType.ESSAY;
  return QuizQuestionType.SINGLE;
}

export function toQuizPayload(values: QuizFormValues): QuizCreateInput {
  return {
    title: values.title.trim(),
    duration_minutes: values.duration_minutes ?? QuizLimit.DURATION_MIN,
    passing_score: values.passing_score ?? QuizLimit.PASSING_SCORE_DEFAULT,
    is_published: Boolean(values.is_published),
    questions: values.questions.map((question) => {
      const image_urls = (question.image_urls ?? []).filter((url) => !!url.trim());
      const type = normalizeQuestionType(question.type);
      if (type === QuizQuestionType.ESSAY) {
        return {
          id: question.id || newQuizEntityId(),
          type,
          prompt: question.prompt.trim(),
          image_url: image_urls[0] ?? null,
          image_urls,
          options: [],
          correct_option_ids: [],
        };
      }
      return {
        id: question.id || newQuizEntityId(),
        type,
        prompt: question.prompt.trim(),
        image_url: image_urls[0] ?? null,
        image_urls,
        options: question.options.map((option) => ({
          id: option.id || newQuizEntityId(),
          text: option.text.trim(),
        })),
        correct_option_ids: question.correct_option_ids ?? [],
      };
    }),
  };
}

export function fillQuizForm(form: FormInstance<QuizFormValues>, quiz: Quiz | null): void {
  if (!quiz) {
    form.setFieldsValue({
      title: '',
      duration_minutes: QuizLimit.DURATION_MIN,
      passing_score: QuizLimit.PASSING_SCORE_DEFAULT,
      is_published: false,
      questions: [createEmptyQuizQuestion()],
    });
    return;
  }
  form.setFieldsValue({
    title: quiz.title,
    duration_minutes: quiz.duration_minutes,
    passing_score: quiz.passing_score,
    is_published: quiz.is_published,
    questions: quiz.questions.map((question) => {
      const type = normalizeQuestionType(question.type);
      if (type === QuizQuestionType.ESSAY) {
        return {
          id: question.id,
          type,
          prompt: question.prompt,
          image_urls: getQuestionImageUrls(question),
          options: [],
          correct_option_ids: [],
        };
      }
      return {
        id: question.id,
        type,
        prompt: question.prompt,
        image_urls: getQuestionImageUrls(question),
        options: question.options.map((option) => ({ id: option.id, text: option.text })),
        correct_option_ids: question.correct_option_ids ?? [],
      };
    }),
  });
}

export function applyQuizQuestionTypeChange(
  form: FormInstance<QuizFormValues>,
  questionIndex: number,
  type: QuizQuestionType,
): void {
  const questions = form.getFieldValue('questions') as QuizQuestionForm[];
  const current = questions[questionIndex];
  if (!current) return;

  if (type === QuizQuestionType.ESSAY) {
    const next = [...questions];
    next[questionIndex] = {
      ...current,
      type,
      options: [],
      correct_option_ids: [],
    };
    form.setFieldsValue({ questions: next });
    return;
  }

  const options =
    current.options.length >= QuizLimit.MIN_OPTIONS ? current.options : createDefaultOptions();
  const next = [...questions];
  next[questionIndex] = {
    ...current,
    type,
    options,
    correct_option_ids: current.correct_option_ids.filter((id) =>
      options.some((option) => option.id === id),
    ),
  };
  form.setFieldsValue({ questions: next });
  syncQuizCorrectIds(form, questionIndex, options, type);
}

export function syncQuizCorrectIds(
  form: FormInstance<QuizFormValues>,
  questionIndex: number,
  options: QuizOptionForm[],
  type: QuizQuestionType,
): void {
  if (type === QuizQuestionType.ESSAY) {
    form.setFieldValue(['questions', questionIndex, 'correct_option_ids'], []);
    return;
  }
  const optionIds = options.map((option) => option.id);
  const current =
    (form.getFieldValue(['questions', questionIndex, 'correct_option_ids']) as string[]) ?? [];
  let next = current.filter((id) => optionIds.includes(id));
  if (type === QuizQuestionType.SINGLE) {
    next = next.slice(0, 1);
    if (next.length === 0 && optionIds[0]) next = [optionIds[0]];
  }
  form.setFieldValue(['questions', questionIndex, 'correct_option_ids'], next);
}
