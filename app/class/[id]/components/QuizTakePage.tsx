'use client';

import { useMemo, useState } from 'react';
import { Breadcrumb, Button, Result, Space, Spin, Typography } from 'antd';
import { EditOutlined, HomeOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { ClassMemberRole, QuizUiMessage } from '@/constants/enums';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { useUserRoleCode } from '@/lib/hooks/use-current-user';
import { useClass } from '@/lib/hooks/use-classes';
import { useClassSessions } from '@/lib/hooks/use-class-sessions';
import { useMyQuizAttempt, useSessionQuizDetail } from '@/lib/hooks/use-quizzes';
import {
  countQuizQuestionKinds,
  isQuizAttemptCompleted,
  isQuizAttemptInProgress,
} from '@/lib/types/quiz';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { QuizTakeModal } from './QuizTakeModal';
import pageStyles from './lecture-editor.module.scss';
import styles from './tab-schedule.module.scss';

dayjs.locale('vi');

type Props = {
  classId: string;
  sessionId: string;
  quizId: string;
};

export function QuizTakePage({ classId, sessionId, quizId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get('date');
  const isMobile = useIsMobile();
  const { hasPermission: canTake } = useAuthPermission([ClassMemberRole.STU]);
  const { hasPermission: canEdit } = useAuthPermission([ClassMemberRole.TEA]);
  const roleCode = useUserRoleCode();
  const homeHref = roleCode?.trim().toUpperCase() === 'STU' ? '/course' : '/';

  const { data: classData } = useClass(classId);
  const { data: sessions = [] } = useClassSessions(classId);
  const {
    data: quiz,
    isLoading: quizLoading,
    isError: quizMissing,
  } = useSessionQuizDetail(sessionId, quizId, true);

  const session = sessions.find((item) => item.id === sessionId) ?? null;

  const scheduleParams = new URLSearchParams();
  scheduleParams.set('tab', 'schedule');
  if (dateQuery) scheduleParams.set('date', dateQuery);
  else if (session?.date) scheduleParams.set('date', session.date);
  const scheduleHref = `/class/${classId}?${scheduleParams.toString()}`;
  const scheduleQuery = dateQuery ? `?date=${encodeURIComponent(dateQuery)}` : '';
  const editHref = `/class/${classId}/sessions/${sessionId}/quizzes/${quizId}/edit${scheduleQuery}`;

  const goBack = () => {
    router.push(scheduleHref);
  };

  const readOnly = !canTake;
  const [entered, setEntered] = useState(!canTake);

  // Keep attempt query warm so entering the take UI does not wait on another GET.
  const { data: attempt, isLoading: attemptLoading } = useMyQuizAttempt(
    canTake ? sessionId : null,
    canTake ? quizId : null,
  );
  const completed = isQuizAttemptCompleted(attempt);
  const inProgress = isQuizAttemptInProgress(attempt);
  const questionKinds = countQuizQuestionKinds(quiz?.questions ?? []);
  const essayOnly = questionKinds.auto === 0 && questionKinds.essay > 0;
  const confirmLabel = completed
    ? QuizUiMessage.VIEW_RESULT
    : inProgress
      ? QuizUiMessage.CONTINUE_QUIZ
      : QuizUiMessage.START_QUIZ;

  // Don't block the take page on class/sessions — those only fill labels.
  const loading = quizLoading;

  const sessionLabel = useMemo(
    () =>
      session
        ? `Buổi ${session.session_number} · ${dayjs(session.date).format('dd, DD/MM/YYYY')}`
        : sessionId,
    [session, sessionId],
  );

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.loadingWrap}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (quizMissing || !quiz) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.errorWrap}>
          <Result
            status="404"
            title="Không tìm thấy bài tập"
            extra={
              <Button type="primary" onClick={goBack}>
                Về lịch học
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <div className={styles.quizPageCenteredWide}>
        <Breadcrumb
          className={pageStyles.breadcrumb}
          items={[
            { href: homeHref, title: <HomeOutlined /> },
            { href: `/class/${classId}`, title: classData?.name || 'Lớp học' },
            { href: scheduleHref, title: 'Lịch học' },
            { title: quiz.title || 'Bài tập' },
          ]}
        />

        <div className={pageStyles.headerRow}>
          <Typography.Title level={3} className={pageStyles.pageTitle}>
            {quiz.title || 'Bài tập'}
          </Typography.Title>
          {canEdit ? (
            <Button icon={<EditOutlined />} onClick={() => router.push(editHref)}>
              Sửa
            </Button>
          ) : null}
        </div>

        {!entered ? (
          <div className={pageStyles.layout}>
            <div className={pageStyles.mainColumn}>
              <div className={pageStyles.panel}>
                <div className={pageStyles.panelBody}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Typography.Text type="secondary">{sessionLabel}</Typography.Text>
                    <Typography.Text>
                      {quiz.questions.length} câu
                      {questionKinds.essay > 0 ? ` · ${questionKinds.essay} tự luận` : ''}
                      {quiz.duration_minutes > 0 ? ` · ${quiz.duration_minutes} phút` : ''}
                      {questionKinds.auto > 0 && quiz.passing_score > 0
                        ? ` · Điểm đạt ${quiz.passing_score}%`
                        : ''}
                    </Typography.Text>
                    {completed && attempt ? (
                      <Typography.Text type="secondary">
                        {essayOnly
                          ? QuizUiMessage.PREVIEW_ESSAY_SUBMITTED
                          : `${QuizUiMessage.PREVIEW_SUBMITTED_PREFIX} · ${attempt.score}%${
                              attempt.is_passed
                                ? ` · ${QuizUiMessage.RESULT_PASSED}`
                                : ` · ${QuizUiMessage.RESULT_FAILED}`
                            }${
                              questionKinds.essay > 0
                                ? ` · ${questionKinds.essay} câu tự luận ${QuizUiMessage.ESSAY_AWAITING_REVIEW}`
                                : ''
                            }`}
                      </Typography.Text>
                    ) : inProgress ? (
                      <Typography.Text type="secondary">
                        {quiz.duration_minutes > 0
                          ? QuizUiMessage.PREVIEW_IN_PROGRESS
                          : QuizUiMessage.PREVIEW_IN_PROGRESS_NO_TIMER}
                      </Typography.Text>
                    ) : (
                      <Typography.Text type="secondary">
                        {quiz.duration_minutes > 0
                          ? QuizUiMessage.PREVIEW_READY_WITH_TIMER.replace(
                              '{minutes}',
                              String(quiz.duration_minutes),
                            )
                          : QuizUiMessage.PREVIEW_READY}
                      </Typography.Text>
                    )}
                    <Space wrap>
                      <Button onClick={goBack}>{QuizUiMessage.CLOSE}</Button>
                      <Button
                        type="primary"
                        loading={attemptLoading}
                        onClick={() => setEntered(true)}
                      >
                        {confirmLabel}
                      </Button>
                    </Space>
                  </Space>
                </div>
              </div>
            </div>

            <aside className={pageStyles.sidebar}>
              <div className={pageStyles.panel}>
                <p className={pageStyles.sidebarBoxTitle}>Bài tập</p>
                <div className={pageStyles.sidebarBoxBody}>
                  <div className={pageStyles.metaLine}>
                    <span className={pageStyles.metaLabel}>Lớp</span>
                    <span className={pageStyles.metaValue}>{classData?.name || '—'}</span>
                  </div>
                  <div className={pageStyles.metaLine}>
                    <span className={pageStyles.metaLabel}>Buổi</span>
                    <span className={pageStyles.metaValue}>{sessionLabel}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className={`${pageStyles.panel} ${styles.quizTakePageShell}`}>
            <div className={pageStyles.panelBody}>
              <QuizTakeModal
                sessionId={sessionId}
                quiz={quiz}
                open
                isMobile={isMobile}
                readOnly={readOnly}
                layout="page"
                onClose={goBack}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
