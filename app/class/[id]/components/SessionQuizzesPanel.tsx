'use client';

import { Button, Empty, Popconfirm, Space, Tag, Typography, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FormOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useCallback, useState } from 'react';
import { QuizUiMessage } from '@/constants/enums';
import type { Quiz } from '@/lib/types/quiz';
import { isQuizAttemptCompleted, isQuizAttemptInProgress } from '@/lib/types/quiz';
import {
  useDeleteSessionQuiz,
  useMyQuizAttempt,
  useSessionQuizzes,
} from '@/lib/hooks/use-quizzes';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import { QuizTakeModal } from './QuizTakeModal';
import { QuizAttemptsReviewModal } from './QuizAttemptsReviewModal';
import { QuizEditorModal } from './QuizEditorModal';
import { QuizPreviewModal } from './QuizPreviewModal';
import styles from './tab-schedule.module.scss';

type Props = {
  classId: string;
  sessionId: string | null;
  canEdit: boolean;
  canTake: boolean;
  isMobile: boolean;
};

function StudentQuizActionHint({
  sessionId,
  quizId,
}: {
  sessionId: string;
  quizId: string;
}) {
  const { data: attempt } = useMyQuizAttempt(sessionId, quizId);
  let hint = QuizUiMessage.TAKE_HINT;
  if (isQuizAttemptCompleted(attempt)) hint = QuizUiMessage.VIEW_HINT;
  else if (isQuizAttemptInProgress(attempt)) hint = QuizUiMessage.CONTINUE_HINT;
  return (
    <Typography.Text type="secondary" className={styles.lectureLinkHint}>
      {hint}
    </Typography.Text>
  );
}

export function SessionQuizzesPanel({ classId, sessionId, canEdit, canTake, isMobile }: Props) {
  const { data: quizzes = [], isLoading } = useSessionQuizzes(sessionId);
  const deleteQuiz = useDeleteSessionQuiz(classId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null);
  const [viewingQuiz, setViewingQuiz] = useState<Quiz | null>(null);
  const [reviewingQuiz, setReviewingQuiz] = useState<Quiz | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setEditorOpen(true);
  }, []);

  const openEdit = useCallback((quiz: Quiz) => {
    setEditing(quiz);
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditing(null);
  }, []);

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
    [sessionId, deleteQuiz],
  );

  const openQuiz = useCallback(
    (quiz: Quiz) => {
      if (canTake) {
        setPreviewQuiz(quiz);
        return;
      }
      if (canEdit) {
        openEdit(quiz);
        return;
      }
      setViewingQuiz(quiz);
    },
    [canTake, canEdit, openEdit],
  );

  const confirmPreview = useCallback((quiz: Quiz) => {
    setPreviewQuiz(null);
    setTakingQuiz(quiz);
  }, []);

  if (!sessionId) return null;

  return (
    <section className={styles.lecturesPanel}>
      <div className={styles.lecturesHead}>
        <div className={styles.lecturesTitle}>
          <FormOutlined />
          <span>Bài tập</span>
          {quizzes.length > 0 ? (
            <Typography.Text type="secondary">({quizzes.length})</Typography.Text>
          ) : null}
        </div>
        {canEdit ? (
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <Typography.Text type="secondary">Đang tải bài tập…</Typography.Text>
      ) : quizzes.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={canEdit ? 'Chưa có bài tập — nhấn Thêm để tạo' : 'Chưa có bài tập'}
        />
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
                  {quiz.questions.length} câu
                  {quiz.duration_minutes > 0 ? ` · ${quiz.duration_minutes} phút` : ''}
                  {quiz.passing_score > 0 ? ` · Đạt ${quiz.passing_score}%` : ''}
                </p>
                <div className={styles.quizStatusRow}>
                  {quiz.is_published ? <Tag color="green">Đã mở</Tag> : <Tag>Nháp</Tag>}
                  {canTake ? (
                    <StudentQuizActionHint sessionId={sessionId} quizId={quiz.id} />
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

      {canTake ? (
        <>
          <QuizPreviewModal
            sessionId={sessionId}
            quiz={previewQuiz}
            open={previewQuiz !== null}
            isMobile={isMobile}
            onClose={() => setPreviewQuiz(null)}
            onConfirm={confirmPreview}
          />
          <QuizTakeModal
            sessionId={sessionId}
            quiz={takingQuiz}
            open={takingQuiz !== null}
            isMobile={isMobile}
            onClose={() => setTakingQuiz(null)}
          />
        </>
      ) : null}

      {!canTake && !canEdit ? (
        <QuizTakeModal
          sessionId={sessionId}
          quiz={viewingQuiz}
          open={viewingQuiz !== null}
          isMobile={isMobile}
          readOnly
          onClose={() => setViewingQuiz(null)}
        />
      ) : null}

      {canEdit ? (
        <>
          <QuizEditorModal
            classId={classId}
            sessionId={sessionId}
            open={editorOpen}
            editing={editing}
            isMobile={isMobile}
            onClose={closeEditor}
          />
          <QuizAttemptsReviewModal
            sessionId={sessionId}
            quiz={reviewingQuiz}
            open={reviewingQuiz !== null}
            isMobile={isMobile}
            onClose={() => setReviewingQuiz(null)}
          />
        </>
      ) : null}
    </section>
  );
}
