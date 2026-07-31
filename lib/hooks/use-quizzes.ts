import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CLASS_SESSIONS_KEY } from '@/lib/hooks/use-class-sessions';
import { fetchJson } from '@/lib/utils/fetchJson';
import type { Quiz, QuizAttempt, QuizAttemptReview, QuizCreateInput, QuizUpdateInput } from '@/lib/types/quiz';

export const SESSION_QUIZZES_KEY = 'session-quizzes';
export const SESSION_QUIZ_DETAIL_KEY = 'session-quiz-detail';
export const QUIZ_ATTEMPT_KEY = 'quiz-attempt';
export const QUIZ_ATTEMPTS_REVIEW_KEY = 'quiz-attempts-review';

export function useSessionQuizzes(sessionId: string | null) {
  return useQuery({
    queryKey: [SESSION_QUIZZES_KEY, sessionId],
    queryFn: () => fetchJson<Quiz[]>(`/api/classes/sessions/${sessionId}/quizzes`),
    enabled: !!sessionId,
  });
}

export function useSessionQuizDetail(
  sessionId: string | null,
  quizId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [SESSION_QUIZ_DETAIL_KEY, sessionId, quizId],
    queryFn: () =>
      fetchJson<Quiz>(`/api/classes/sessions/${sessionId}/quizzes/${quizId}`),
    enabled: enabled && !!sessionId && !!quizId,
  });
}

export function useCreateSessionQuiz(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: QuizCreateInput }) =>
      fetchJson<Quiz>(`/api/classes/sessions/${sessionId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [SESSION_QUIZZES_KEY, variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
    },
  });
}

export function useUpdateSessionQuiz(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      quizId,
      data,
    }: {
      sessionId: string;
      quizId: string;
      data: QuizUpdateInput;
    }) =>
      fetchJson<Quiz>(`/api/classes/sessions/${sessionId}/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [SESSION_QUIZZES_KEY, variables.sessionId] });
      queryClient.invalidateQueries({
        queryKey: [SESSION_QUIZ_DETAIL_KEY, variables.sessionId, variables.quizId],
      });
      queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
    },
  });
}

export function useDeleteSessionQuiz(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, quizId }: { sessionId: string; quizId: string }) =>
      fetchJson<{ success: boolean }>(`/api/classes/sessions/${sessionId}/quizzes/${quizId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [SESSION_QUIZZES_KEY, variables.sessionId] });
      queryClient.invalidateQueries({
        queryKey: [SESSION_QUIZ_DETAIL_KEY, variables.sessionId, variables.quizId],
      });
      queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
    },
  });
}

export function useMyQuizAttempt(sessionId: string | null, quizId: string | null) {
  return useQuery({
    queryKey: [QUIZ_ATTEMPT_KEY, sessionId, quizId],
    queryFn: () =>
      fetchJson<QuizAttempt | null>(
        `/api/classes/sessions/${sessionId}/quizzes/${quizId}/attempts`,
      ),
    enabled: !!sessionId && !!quizId,
  });
}

export function useTeacherQuizAttempts(
  sessionId: string | null,
  quizId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [QUIZ_ATTEMPTS_REVIEW_KEY, sessionId, quizId],
    queryFn: () =>
      fetchJson<{ items: QuizAttemptReview[] }>(
        `/api/classes/sessions/${sessionId}/quizzes/${quizId}/attempts`,
      ),
    enabled: enabled && !!sessionId && !!quizId,
  });
}

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      quizId,
      answers,
    }: {
      sessionId: string;
      quizId: string;
      answers: Record<string, string[]>;
    }) =>
      fetchJson<QuizAttempt>(`/api/classes/sessions/${sessionId}/quizzes/${quizId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUIZ_ATTEMPT_KEY, variables.sessionId, variables.quizId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUIZ_ATTEMPTS_REVIEW_KEY, variables.sessionId, variables.quizId],
      });
      queryClient.invalidateQueries({
        queryKey: [SESSION_QUIZ_DETAIL_KEY, variables.sessionId, variables.quizId],
      });
      queryClient.invalidateQueries({ queryKey: [SESSION_QUIZZES_KEY, variables.sessionId] });
    },
  });
}
