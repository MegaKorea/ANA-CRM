'use client';

import { useMemo, useState } from 'react';
import { App, Button, Empty, Input, Modal, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { QuizUiMessage } from '@/constants/enums';
import type { Quiz, QuizAttemptReview, QuizQuestion } from '@/lib/types/quiz';
import {
  buildQuizResultSummary,
  isAutoGradableQuestion,
  isQuizAnswerCorrect,
  countQuizQuestionKinds,
} from '@/lib/types/quiz';
import {
  useTeacherQuizAttempts,
  useSessionQuizDetail,
  useGradeQuizAttempt,
} from '@/lib/hooks/use-quizzes';
import { formatViDateTime } from '@/lib/utils/format-vi-datetime';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import { ScheduleLoading } from './ScheduleLoading';
import styles from './tab-schedule.module.scss';

type Props = {
  sessionId: string;
  quiz: Quiz | null;
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
};

function optionLabels(question: QuizQuestion, optionIds: string[]): string {
  const byId = new Map(question.options.map((option) => [option.id, option.text]));
  const labels = optionIds.map((id) => byId.get(id) || id);
  return labels.length > 0 ? labels.join(', ') : '—';
}

export function QuizAttemptsReviewModal({ sessionId, quiz, open, isMobile, onClose }: Props) {
  const { message } = App.useApp();
  const quizId = quiz?.id ?? null;
  const needsDetail = open && !!quizId && (quiz?.questions.length ?? 0) === 0;
  const { data: quizDetail, isLoading: detailLoading } = useSessionQuizDetail(
    sessionId,
    quizId,
    needsDetail,
  );
  const resolvedQuiz = quizDetail ?? quiz;
  const { data, isLoading } = useTeacherQuizAttempts(sessionId, quizId, open && !!quizId);
  const [selected, setSelected] = useState<QuizAttemptReview | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const gradeAttempt = useGradeQuizAttempt();

  const items = data?.items ?? [];
  const questionKinds = resolvedQuiz
    ? countQuizQuestionKinds(resolvedQuiz.questions)
    : { auto: 0, essay: 0 };
  const essayOnly = questionKinds.auto === 0 && questionKinds.essay > 0;
  const loading = isLoading || (needsDetail && detailLoading);

  const closeList = () => {
    setSelected(null);
    onClose();
  };

  const openDetail = (row: QuizAttemptReview) => {
    setSelected(row);
    setFeedbackDraft(row.teacher_feedback ?? '');
  };

  const handleSaveFeedback = async () => {
    if (!selected || !quizId) return;
    const feedback = feedbackDraft.trim();
    if (!feedback) {
      message.warning(QuizUiMessage.FEEDBACK_REQUIRED);
      return;
    }
    try {
      const updated = await gradeAttempt.mutateAsync({
        sessionId,
        quizId,
        attemptId: selected.id,
        feedback,
      });
      setSelected({
        ...selected,
        teacher_feedback: updated.teacher_feedback,
        graded_by: updated.graded_by,
      });
      message.success(QuizUiMessage.FEEDBACK_SAVED);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, QuizUiMessage.FEEDBACK_SAVE_FAILED));
    }
  };

  const columns: ColumnsType<QuizAttemptReview> = useMemo(() => {
    const base: ColumnsType<QuizAttemptReview> = [
      {
        title: 'Học viên',
        dataIndex: 'student_name',
        key: 'student_name',
        render: (name: string, row) => (
          <Space orientation="vertical" size={0}>
            <Typography.Text strong>{name}</Typography.Text>
            {row.student_email ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {row.student_email}
              </Typography.Text>
            ) : null}
          </Space>
        ),
      },
    ];

    if (essayOnly) {
      base.push({
        title: 'Trạng thái',
        key: 'status',
        width: 160,
        render: (_, row) =>
          row.graded_by ? (
            <Tag color="green">{QuizUiMessage.GRADED_TAG}</Tag>
          ) : (
            <Tag color="blue">{QuizUiMessage.ESSAY_SUBMITTED_TITLE}</Tag>
          ),
      });
    } else {
      base.push(
        {
          title: questionKinds.essay > 0 ? 'Điểm TN' : 'Điểm',
          key: 'score',
          width: 100,
          render: (_, row) => `${row.score}%`,
        },
        {
          title: 'Đúng',
          key: 'correct',
          width: 90,
          render: (_, row) => `${row.correct_answers}/${row.total_questions}`,
        },
        {
          title: 'Kết quả',
          key: 'passed',
          width: 110,
          render: (_, row) =>
            row.is_passed ? (
              <Tag color="green">{QuizUiMessage.RESULT_PASSED}</Tag>
            ) : (
              <Tag color="red">{QuizUiMessage.RESULT_FAILED}</Tag>
            ),
        },
      );
      if (questionKinds.essay > 0) {
        base.push({
          title: 'Tự luận',
          key: 'essay',
          width: 120,
          render: (_, row) =>
            row.graded_by ? (
              <Tag color="green">{QuizUiMessage.GRADED_TAG}</Tag>
            ) : (
              <Tag>{QuizUiMessage.ESSAY_AWAITING_REVIEW}</Tag>
            ),
        });
      }
    }

    base.push(
      {
        title: 'Nộp lúc',
        dataIndex: 'submitted_at',
        key: 'submitted_at',
        width: 160,
        render: (value: string | null) => (value ? formatViDateTime(value) : '—'),
      },
      {
        title: '',
        key: 'actions',
        width: 90,
        render: (_, row) => (
          <Button type="link" size="small" onClick={() => openDetail(row)}>
            Chi tiết
          </Button>
        ),
      },
    );

    return base;
  }, [essayOnly, questionKinds.essay]);

  return (
    <>
      <Modal
        title={resolvedQuiz ? `Bài làm · ${resolvedQuiz.title}` : 'Bài làm'}
        open={open}
        onCancel={closeList}
        footer={
          <Button type="primary" onClick={closeList}>
            Đóng
          </Button>
        }
        width={isMobile ? '95vw' : 860}
        destroyOnHidden
      >
        {loading ? (
          <ScheduleLoading tip="Đang tải bài làm…" />
        ) : items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có học viên nộp bài"
          />
        ) : (
          <Table
            size="small"
            rowKey="id"
            columns={columns}
            dataSource={items}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            scroll={{ x: isMobile ? 640 : undefined }}
          />
        )}
      </Modal>

      <Modal
        title={selected ? `Chi tiết · ${selected.student_name}` : 'Chi tiết bài làm'}
        open={!!selected && !!resolvedQuiz}
        onCancel={() => setSelected(null)}
        footer={
          <Button type="primary" onClick={() => setSelected(null)}>
            Đóng
          </Button>
        }
        width={isMobile ? '95vw' : 720}
        destroyOnHidden
      >
        {selected && resolvedQuiz ? (
          <div className={styles.quizTakeBody}>
            <div className={styles.quizResultBanner}>
              {(() => {
                const summary = buildQuizResultSummary({
                  questions: resolvedQuiz.questions,
                  score: selected.score,
                  correct: selected.correct_answers,
                  total: selected.total_questions,
                  isPassed: selected.is_passed,
                  passingScore: resolvedQuiz.passing_score,
                });
                return (
                  <>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      {summary.title}
                    </Typography.Title>
                    <Typography.Text type="secondary">
                      {summary.detail}
                      {selected.submitted_at
                        ? ` · Nộp ${formatViDateTime(selected.submitted_at)}`
                        : null}
                    </Typography.Text>
                  </>
                );
              })()}
            </div>

            <ol className={styles.quizQuestionList}>
              {resolvedQuiz.questions.map((question, index) => {
                const given = selected.user_answers[question.id] ?? [];
                if (!isAutoGradableQuestion(question)) {
                  return (
                    <li key={question.id} className={styles.quizQuestionItem}>
                      <p className={styles.quizQuestionPrompt}>
                        <span className={styles.quizQuestionIndex}>{index + 1}.</span>{' '}
                        {question.prompt} <Tag>{QuizUiMessage.ESSAY_TAG}</Tag>
                      </p>
                      <Typography.Paragraph className={styles.quizEssayAnswer}>
                        {(given[0] ?? '').trim() || QuizUiMessage.ESSAY_EMPTY}
                      </Typography.Paragraph>
                    </li>
                  );
                }

                const correct = isQuizAnswerCorrect(question, given);
                return (
                  <li key={question.id} className={styles.quizQuestionItem}>
                    <p className={styles.quizQuestionPrompt}>
                      <span className={styles.quizQuestionIndex}>{index + 1}.</span>{' '}
                      {question.prompt}{' '}
                      <Tag color={correct ? 'green' : 'red'}>{correct ? 'Đúng' : 'Sai'}</Tag>
                    </p>
                    <Typography.Text type="secondary">
                      HV chọn: {optionLabels(question, given)}
                    </Typography.Text>
                    <br />
                    <Typography.Text type="secondary">
                      Đáp án đúng: {optionLabels(question, question.correct_option_ids ?? [])}
                    </Typography.Text>
                  </li>
                );
              })}
            </ol>

            {questionKinds.essay > 0 ? (
              <div className={styles.quizFeedbackBlock}>
                <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Typography.Text strong>{QuizUiMessage.FEEDBACK_LABEL}</Typography.Text>
                  {selected.graded_by ? (
                    <Tag color="green">{QuizUiMessage.GRADED_TAG}</Tag>
                  ) : (
                    <Tag>{QuizUiMessage.NOT_GRADED_TAG}</Tag>
                  )}
                </Space>
                <Input.TextArea
                  value={feedbackDraft}
                  onChange={(e) => setFeedbackDraft(e.target.value)}
                  placeholder={QuizUiMessage.FEEDBACK_PLACEHOLDER}
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  maxLength={5000}
                  disabled={gradeAttempt.isPending}
                />
                <Button
                  type="primary"
                  onClick={() => void handleSaveFeedback()}
                  loading={gradeAttempt.isPending}
                  style={{ marginTop: 8 }}
                >
                  {QuizUiMessage.SAVE_FEEDBACK}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
