'use client';

import { Button, Modal, Space, Typography } from 'antd';
import { QuizUiMessage } from '@/constants/enums';
import type { Quiz } from '@/lib/types/quiz';
import { isQuizAttemptCompleted, isQuizAttemptInProgress } from '@/lib/types/quiz';
import { useMyQuizAttempt } from '@/lib/hooks/use-quizzes';

type Props = {
  sessionId: string;
  quiz: Quiz | null;
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
  onConfirm: (quiz: Quiz) => void;
};

export function QuizPreviewModal({
  sessionId,
  quiz,
  open,
  isMobile,
  onClose,
  onConfirm,
}: Props) {
  const quizId = quiz?.id ?? null;
  const { data: attempt, isLoading } = useMyQuizAttempt(
    open ? sessionId : null,
    open ? quizId : null,
  );
  const completed = isQuizAttemptCompleted(attempt);
  const inProgress = isQuizAttemptInProgress(attempt);

  const confirmLabel = completed
    ? QuizUiMessage.VIEW_RESULT
    : inProgress
      ? QuizUiMessage.CONTINUE_QUIZ
      : QuizUiMessage.START_QUIZ;

  return (
    <Modal
      title={quiz?.title ?? 'Bài tập'}
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>{QuizUiMessage.CLOSE}</Button>
          <Button
            type="primary"
            loading={isLoading}
            disabled={!quiz}
            onClick={() => {
              if (!quiz) return;
              onConfirm(quiz);
            }}
          >
            {confirmLabel}
          </Button>
        </Space>
      }
      width={isMobile ? '95vw' : 480}
      destroyOnHidden
    >
      {quiz ? (
        <Space direction="vertical" size="small">
          <Typography.Text>
            {quiz.questions.length} câu
            {quiz.duration_minutes > 0 ? ` · ${quiz.duration_minutes} phút` : ''}
            {quiz.passing_score > 0 ? ` · Đạt ${quiz.passing_score}%` : ''}
          </Typography.Text>
          {completed && attempt ? (
            <Typography.Text type="secondary">
              {QuizUiMessage.PREVIEW_SUBMITTED_PREFIX} · {attempt.score}%
              {attempt.is_passed ? ' · Đạt' : ' · Chưa đạt'}
            </Typography.Text>
          ) : inProgress ? (
            <Typography.Text type="secondary">{QuizUiMessage.PREVIEW_IN_PROGRESS}</Typography.Text>
          ) : (
            <Typography.Text type="secondary">{QuizUiMessage.PREVIEW_READY}</Typography.Text>
          )}
        </Space>
      ) : null}
    </Modal>
  );
}
