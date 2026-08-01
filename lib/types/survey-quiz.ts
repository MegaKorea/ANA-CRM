import type { QuizQuestion } from '@/lib/types/quiz';

export const SURVEYJS_QUIZ_FORMAT = 'surveyjs' as const;

export type SurveyJsQuizEnvelope = {
  format: typeof SURVEYJS_QUIZ_FORMAT;
  survey: Record<string, unknown>;
};

export type QuizFormat = 'legacy' | 'surveyjs';

export function isSurveyJsQuizEnvelope(value: unknown): value is SurveyJsQuizEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    row.format === SURVEYJS_QUIZ_FORMAT &&
    !!row.survey &&
    typeof row.survey === 'object' &&
    !Array.isArray(row.survey)
  );
}

export function toSurveyJsEnvelope(survey: Record<string, unknown>): SurveyJsQuizEnvelope {
  return { format: SURVEYJS_QUIZ_FORMAT, survey };
}

export function countSurveyJsQuestions(survey: Record<string, unknown>): number {
  const pages = Array.isArray(survey.pages) ? survey.pages : [];
  if (pages.length === 0 && Array.isArray(survey.elements)) {
    return survey.elements.length;
  }
  let count = 0;
  for (const page of pages) {
    if (!page || typeof page !== 'object') continue;
    const elements = (page as { elements?: unknown }).elements;
    if (Array.isArray(elements)) count += elements.length;
  }
  return count;
}

function stripCorrectAnswerFromElements(elements: unknown): unknown {
  if (!Array.isArray(elements)) return elements;
  return elements.map((el) => {
    if (!el || typeof el !== 'object') return el;
    const next = { ...(el as Record<string, unknown>) };
    delete next.correctAnswer;
    if (Array.isArray(next.elements)) {
      next.elements = stripCorrectAnswerFromElements(next.elements);
    }
    if (Array.isArray(next.templateElements)) {
      next.templateElements = stripCorrectAnswerFromElements(next.templateElements);
    }
    return next;
  });
}

/** Remove correctAnswer from survey JSON before sending to students. */
export function stripSurveyJsCorrectAnswers(
  survey: Record<string, unknown>,
): Record<string, unknown> {
  const cloned = structuredClone(survey);
  if (Array.isArray(cloned.pages)) {
    cloned.pages = cloned.pages.map((page) => {
      if (!page || typeof page !== 'object') return page;
      const next = { ...(page as Record<string, unknown>) };
      next.elements = stripCorrectAnswerFromElements(next.elements);
      return next;
    });
  }
  if (Array.isArray(cloned.elements)) {
    cloned.elements = stripCorrectAnswerFromElements(cloned.elements);
  }
  return cloned;
}

export function parseStoredQuizQuestions(raw: unknown): {
  format: QuizFormat;
  questions: QuizQuestion[];
  survey: Record<string, unknown> | null;
} {
  if (isSurveyJsQuizEnvelope(raw)) {
    return { format: 'surveyjs', questions: [], survey: raw.survey };
  }
  return {
    format: 'legacy',
    questions: Array.isArray(raw) ? (raw as QuizQuestion[]) : [],
    survey: null,
  };
}
