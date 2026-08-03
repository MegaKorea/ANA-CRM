'use client';

import { useMemo, useState } from 'react';
import { Button, Empty, Modal, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Quiz, QuizAttemptReview, QuizQuestion } from '@/lib/types/quiz';
import { isQuizAnswerCorrect } from '@/lib/types/quiz';
import { useTeacherQuizAttempts } from '@/lib/hooks/use-quizzes';
import { formatViDateTime } from '@/lib/utils/format-vi-datetime';
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
  const quizId = quiz?.id ?? null;
  const { data, isLoading } = useTeacherQuizAttempts(sessionId, quizId, open && !!quizId);
  const [selected, setSelected] = useState<QuizAttemptReview | null>(null);

  const items = data?.items ?? [];

  const closeList = () => {
    setSelected(null);
    onClose();
  };

  const columns: ColumnsType<QuizAttemptReview> = useMemo(
    () => [
      {
        title: 'Học viên',
        dataIndex: 'student_name',
        key: 'student_name',
        render: (name: string, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{name}</Typography.Text>
            {row.student_email ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {row.student_email}
              </Typography.Text>
            ) : null}
          </Space>
        ),
      },
      {
        title: 'Điểm',
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
        width: 100,
        render: (_, row) =>
          row.is_passed ? <Tag color="green">Đạt</Tag> : <Tag color="red">Chưa đạt</Tag>,
      },
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
          <Button type="link" size="small" onClick={() => setSelected(row)}>
            Chi tiết
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <Modal
        title={quiz ? `Bài làm · ${quiz.title}` : 'Bài làm'}
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
        {isLoading ? (
          <Typography.Text type="secondary">Đang tải bài làm…</Typography.Text>
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
        open={!!selected && !!quiz}
        onCancel={() => setSelected(null)}
        footer={
          <Button type="primary" onClick={() => setSelected(null)}>
            Đóng
          </Button>
        }
        width={isMobile ? '95vw' : 720}
        destroyOnHidden
      >
        {selected && quiz ? (
          <div className={styles.quizTakeBody}>
            <div className={styles.quizResultBanner}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {selected.is_passed ? 'Đạt' : 'Chưa đạt'} · {selected.score}%
              </Typography.Title>
              <Typography.Text type="secondary">
                Đúng {selected.correct_answers}/{selected.total_questions}
                {selected.submitted_at
                  ? ` · Nộp ${formatViDateTime(selected.submitted_at)}`
                  : null}
              </Typography.Text>
            </div>

            <ol className={styles.quizQuestionList}>
              {quiz.questions.map((question, index) => {
                const given = selected.user_answers[question.id] ?? [];
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
          </div>
        ) : null}
      </Modal>
    </>
  );
}
