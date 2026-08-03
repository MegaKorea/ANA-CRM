'use client';

import { App, Badge, Button, Popconfirm, Space, Tag, Typography } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FormOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuizAttemptStatus, QuizUiMessage } from '@/constants/enums';
import type { Quiz } from '@/lib/types/quiz';
import { getQuizQuestionCount } from '@/lib/types/quiz';
import { useDeleteSessionQuiz, useSessionQuizzes } from '@/lib/hooks/use-quizzes';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import { QuizAttemptsReviewModal } from './QuizAttemptsReviewModal';
import { ScheduleLoading } from './ScheduleLoading';
import styles from './tab-schedule.module.scss';

type Props = {
  classId: string;
  sessionId: string | null;
  canEdit: boolean;
  canTake: boolean;
  isMobile: boolean;
  isNew?: boolean;
};

function studentAttemptHint(status: string | null | undefined): string {
  if (status === QuizAttemptStatus.COMPLETED) return QuizUiMessage.VIEW_HINT;
  if (status === QuizAttemptStatus.IN_PROGRESS) return QuizUiMessage.CONTINUE_HINT;
  return QuizUiMessage.TAKE_HINT;
}

export function SessionQuizzesPanel({
  classId,
  sessionId,
  canEdit,
  canTake,
  isMobile,
  isNew = false,
}: Props) {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get('date');
  const { data: quizzes = [], isLoading } = useSessionQuizzes(sessionId);
  const deleteQuiz = useDeleteSessionQuiz(classId);

  const [reviewingQuiz, setReviewingQuiz] = useState<Quiz | null>(null);

  const scheduleQuery = dateQuery ? `?date=${encodeURIComponent(dateQuery)}` : '';

  const openCreate = useCallback(() => {
    if (!sessionId) return;
    router.push(`/class/${classId}/sessions/${sessionId}/quizzes/new${scheduleQuery}`);
  }, [router, classId, sessionId, scheduleQuery]);

  const openEdit = useCallback(
    (quiz: Quiz) => {
      if (!sessionId) return;
      router.push(
        `/class/${classId}/sessions/${sessionId}/quizzes/${quiz.id}/edit${scheduleQuery}`,
      );
    },
    [router, classId, sessionId, scheduleQuery],
  );

  const openQuiz = useCallback(
    (quiz: Quiz) => {
      if (!sessionId) return;
      if (canEdit && !canTake) {
        openEdit(quiz);
        return;
      }
      router.push(
        `/class/${classId}/sessions/${sessionId}/quizzes/${quiz.id}${scheduleQuery}`,
      );
    },
    [router, classId, sessionId, scheduleQuery, canEdit, canTake, openEdit],
  );

  const handleDelete = useCallback(
    async (quizId: string) => {
      if (!sessionId) return;
      try {
        await deleteQuiz.mutateAsync({ sessionId, quizId });
        message.success(QuizUiMessage.DELETED);
      } catch (error: unknown) {
        message.error(getErrorMessage(error, QuizUiMessage.DELETE_FAILED));
      }
    },
    [sessionId, deleteQuiz, message],
  );

  if (!sessionId) return null;

  return (
    <section className={styles.lecturesPanel}>
      <div className={styles.lecturesHead}>
        <div className={styles.lecturesTitle}>
          <FormOutlined />
          <Typography.Text strong>Bài tập</Typography.Text>
          {quizzes.length > 0 ? (
            <Typography.Text type="secondary">({quizzes.length})</Typography.Text>
          ) : null}
          {isNew ? <Badge count="Mới" color="var(--accent-600, #1677ff)" /> : null}
        </div>
        {canEdit ? (
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <ScheduleLoading tip="Đang tải bài tập…" />
      ) : quizzes.length === 0 ? (
        <Typography.Text type="secondary" className={styles.panelEmptyHint}>
          {canEdit ? 'Chưa có bài tập — nhấn Thêm để tạo' : 'Chưa có bài tập'}
        </Typography.Text>
      ) : (
        <ul className={styles.lecturesList}>
          {quizzes.map((quiz) => (
            <li key={quiz.id} className={styles.lectureItem}>
              <button
                type="button"
                className={styles.lectureItemMain}
                onClick={() => openQuiz(quiz)}
              >
                <p className={styles.lectureItemTitle}>{quiz.title}</p>
                <p className={styles.lectureItemPreview}>
                  {getQuizQuestionCount(quiz)} câu
                  {quiz.duration_minutes > 0 ? ` · ${quiz.duration_minutes} phút` : ''}
                  {quiz.passing_score > 0 ? ` · Đạt ${quiz.passing_score}%` : ''}
                </p>
                <div className={styles.quizStatusRow}>
                  {quiz.is_published ? <Tag color="green">Đã mở</Tag> : <Tag>Nháp</Tag>}
                  {canTake ? (
                    <Typography.Text type="secondary" className={styles.lectureLinkHint}>
                      {studentAttemptHint(quiz.my_attempt_status)}
                    </Typography.Text>
                  ) : !canEdit ? (
                    <Typography.Text type="secondary" className={styles.lectureLinkHint}>
                      {QuizUiMessage.VIEW_HINT}
                    </Typography.Text>
                  ) : null}
                </div>
              </button>
              {canEdit ? (
                <Space size={4} className={styles.lectureItemActions}>
                  <Button
                    type="text"
                    size="small"
                    title="Xem bài làm"
                    icon={<TeamOutlined />}
                    onClick={() => setReviewingQuiz(quiz)}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(quiz)}
                  />
                  <Popconfirm
                    title="Xóa bài tập này?"
                    okText="Xóa"
                    cancelText="Huỷ"
                    onConfirm={() => handleDelete(quiz.id)}
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <QuizAttemptsReviewModal
          sessionId={sessionId}
          quiz={reviewingQuiz}
          open={reviewingQuiz !== null}
          isMobile={isMobile}
          onClose={() => setReviewingQuiz(null)}
        />
      ) : null}
    </section>
  );
}
