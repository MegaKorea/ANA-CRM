'use client';

import {
  App,
  Button,
  Checkbox,
  Empty,
  Image,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import type { Quiz, QuizAttempt, QuizQuestion } from '@/lib/types/quiz';
import {
  getQuestionImageUrls,
  getQuizAttemptRemainingSeconds,
  isQuestionAnswered,
  isQuizAttemptCompleted,
  isQuizAttemptInProgress,
  buildQuizResultSummary,
} from '@/lib/types/quiz';
import { QuizLimit, QuizQuestionType, QuizUiMessage } from '@/constants/enums';
import {
  useMyQuizAttempt,
  useSaveQuizAttemptDraft,
  useSessionQuizDetail,
  useStartQuizAttempt,
  useSubmitQuizAttempt,
} from '@/lib/hooks/use-quizzes';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import { ScheduleLoading } from './ScheduleLoading';
import styles from './tab-schedule.module.scss';

const DRAFT_SAVE_MS = 800;
const TIMEOUT_SUBMIT_RETRY_MS = 5000;
const TIMEOUT_SUBMIT_MAX_RETRIES = 6;

type Props = {
  sessionId: string;
  quiz: Quiz | null;
  open: boolean;
  isMobile: boolean;
  readOnly?: boolean;

  layout?: 'modal' | 'page';
  onClose: () => void;
};

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / QuizLimit.SECONDS_PER_MINUTE);
  const seconds = safe % QuizLimit.SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function selectedOptionVerdict(
  done: boolean,
  optionId: string,
  question: QuizQuestion,
  given: string[],
): 'correct' | 'wrong' | null {
  if (!done || !given.includes(optionId)) return null;
  const correctIds = question.correct_option_ids ?? [];
  if (correctIds.length === 0) return null;
  return correctIds.includes(optionId) ? 'correct' : 'wrong';
}

function OptionLabel({
  text,
  verdict,
  showAnswerKey,
}: {
  text: string;
  verdict: 'correct' | 'wrong' | null;
  showAnswerKey?: boolean;
}) {
  return (
    <span className={styles.quizOptionLabel}>
      {text}
      {verdict === 'correct' ? (
        <Tag color="success" className={styles.quizOptionVerdict}>
          Đúng
        </Tag>
      ) : null}
      {verdict === 'wrong' ? (
        <Tag color="error" className={styles.quizOptionVerdict}>
          Sai
        </Tag>
      ) : null}
      {showAnswerKey ? (
        <Tag color="success" className={styles.quizOptionVerdict}>
          Đáp án
        </Tag>
      ) : null}
    </span>
  );
}

export function QuizTakeModal({
  sessionId,
  quiz: quizProp,
  open,
  isMobile,
  readOnly = false,
  layout = 'modal',
  onClose,
}: Props) {
  const { message } = App.useApp();
  const quizId = quizProp?.id ?? null;
  const hasPropQuestions =
    Array.isArray(quizProp?.questions) && quizProp.questions.length > 0;
  const { data: quizDetail } = useSessionQuizDetail(
    sessionId,
    quizId,
    open && !!quizId && !hasPropQuestions,
  );
  const quiz = quizDetail ?? quizProp;
  const quizContentReady = Array.isArray(quiz?.questions) && quiz.questions.length > 0;

  const { data: attempt, isLoading: attemptLoading } = useMyQuizAttempt(
    open && !readOnly ? sessionId : null,
    open && !readOnly ? quizId : null,
  );
  const startAttempt = useStartQuizAttempt();
  const saveDraft = useSaveQuizAttemptDraft();
  const submitAttempt = useSubmitQuizAttempt();
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const attemptResolved =
    readOnly || (!attemptLoading && (isQuizAttemptCompleted(attempt) || isQuizAttemptInProgress(attempt)));

  const answersRef = useRef(answers);
  const submittingRef = useRef(false);
  const startingRef = useRef(false);
  const draftTimerRef = useRef<number | null>(null);
  const draftSaveFailedRef = useRef(false);
  const timeoutRetryCountRef = useRef(0);
  const timeoutFailNotifiedRef = useRef(false);
  const [resetTrackedFor, setResetTrackedFor] = useState({ open, readOnly });
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Timer/flag cleanup on close is a genuine side effect.
  useEffect(() => {
    if (open) return;
    submittingRef.current = false;
    startingRef.current = false;
    draftSaveFailedRef.current = false;
    timeoutRetryCountRef.current = 0;
    timeoutFailNotifiedRef.current = false;
    if (draftTimerRef.current !== null) {
      window.clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
  }, [open]);

  // Resetting local answer/result state when the modal closes (or flips
  // read-only) is a pure reaction to props, not a side effect — adjust it
  // during render so it applies in the same pass instead of an extra one.
  // See https://react.dev/learn/you-might-not-need-an-effect
  if (resetTrackedFor.open !== open || resetTrackedFor.readOnly !== readOnly) {
    setResetTrackedFor({ open, readOnly });
    if (!open || readOnly) {
      setAnswers({});
      setResult(null);
      setRemainingSeconds(null);
      setHydratedKey(null);
    }
  }

  const startAttemptMutate = startAttempt.mutateAsync;
  const onCloseEvent = useEffectEvent(onClose);

  // Hydrating local state from a freshly-loaded attempt is likewise a pure
  // sync from the query result — same reasoning as the reset above. Keyed on
  // attempt id+status so it runs once per attempt, not on every re-render.
  if (open && !readOnly && quizContentReady && !attemptLoading && attempt) {
    const key = `${attempt.id}:${attempt.status}`;
    if (key !== hydratedKey) {
      setHydratedKey(key);
      if (isQuizAttemptCompleted(attempt)) {
        setResult(attempt);
        setAnswers(attempt.user_answers ?? {});
        setRemainingSeconds(null);
      } else if (isQuizAttemptInProgress(attempt)) {
        setAnswers(attempt.user_answers ?? {});
        setResult(null);
        setRemainingSeconds(
          getQuizAttemptRemainingSeconds(attempt.started_at, quiz?.duration_minutes ?? 0),
        );
      }
    }
  }

  useEffect(() => {
    if (!open || readOnly || attemptLoading || !quizId || !sessionId || !quizContentReady) return;
    if (attempt || startingRef.current) return;

    startingRef.current = true;
    void startAttemptMutate({ sessionId, quizId })
      .catch((error: unknown) => {
        message.error(getErrorMessage(error, QuizUiMessage.START_FAILED));
        onCloseEvent();
      })
      .finally(() => {
        startingRef.current = false;
      });
  }, [
    open,
    readOnly,
    attempt,
    attemptLoading,
    quizId,
    sessionId,
    quizContentReady,
    startAttemptMutate,
    message,
  ]);

  const persistDraft = useCallback(
    async (nextAnswers: Record<string, string[]>) => {
      if (readOnly || !quizId || !sessionId || !isQuizAttemptInProgress(attempt)) return;
      try {
        await saveDraft.mutateAsync({ sessionId, quizId, answers: nextAnswers });
        draftSaveFailedRef.current = false;
      } catch {
        if (!draftSaveFailedRef.current) {
          draftSaveFailedRef.current = true;
          message.warning(QuizUiMessage.DRAFT_SAVE_FAILED);
        }
      }
    },
    [attempt, message, quizId, readOnly, saveDraft, sessionId],
  );

  const scheduleDraftSave = useCallback(
    (nextAnswers: Record<string, string[]>) => {
      if (!isQuizAttemptInProgress(attempt)) return;
      if (draftTimerRef.current !== null) {
        window.clearTimeout(draftTimerRef.current);
      }
      draftTimerRef.current = window.setTimeout(() => {
        void persistDraft(nextAnswers);
      }, DRAFT_SAVE_MS);
    },
    [attempt, persistDraft],
  );

  const setSingle = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: [optionId] };
        scheduleDraftSave(next);
        return next;
      });
    },
    [scheduleDraftSave],
  );

  const setMultiple = useCallback(
    (questionId: string, optionIds: string[]) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: optionIds };
        scheduleDraftSave(next);
        return next;
      });
    },
    [scheduleDraftSave],
  );

  const setEssay = useCallback(
    (questionId: string, text: string) => {
      setAnswers((prev) => {
        const next = {
          ...prev,
          [questionId]: [text.slice(0, QuizLimit.MAX_ESSAY_LENGTH)],
        };
        scheduleDraftSave(next);
        return next;
      });
    },
    [scheduleDraftSave],
  );

  const submitAnswers = useCallback(
    async (
      nextAnswers: Record<string, string[]>,
      opts?: { force?: boolean; silent?: boolean },
    ): Promise<boolean> => {
      if (readOnly || !quiz || !sessionId || submittingRef.current) return false;
      if (!opts?.force) {
        const unanswered = quiz.questions.filter((q) => !isQuestionAnswered(q, nextAnswers));
        if (unanswered.length > 0) {
          message.warning(QuizUiMessage.UNANSWERED);
          return false;
        }
      }
      submittingRef.current = true;
      if (draftTimerRef.current !== null) {
        window.clearTimeout(draftTimerRef.current);
        draftTimerRef.current = null;
      }
      try {
        const saved = await submitAttempt.mutateAsync({
          sessionId,
          quizId: quiz.id,
          answers: nextAnswers,
        });
        setResult(saved);
        setRemainingSeconds(null);
        timeoutRetryCountRef.current = 0;
        message.success(opts?.force ? QuizUiMessage.TIMEOUT_SUBMITTED : QuizUiMessage.SUBMITTED);
        return true;
      } catch (error: unknown) {
        submittingRef.current = false;
        if (!opts?.silent) {
          message.error(getErrorMessage(error, QuizUiMessage.SUBMIT_FAILED));
        }
        return false;
      }
    },
    [message, quiz, sessionId, submitAttempt, readOnly],
  );

  const timedOut = remainingSeconds !== null && remainingSeconds <= 0;
  const done = !readOnly && result !== null;
  const viewMode = done || timedOut;
  const startingSession =
    !readOnly && open && quizContentReady && (!attemptResolved || startAttempt.isPending);
  const answersLocked = viewMode || readOnly || startingSession;

  const handleSubmit = useCallback(() => {
    void submitAnswers(answers);
  }, [answers, submitAnswers]);

  const handleClose = useCallback(() => {
    if (!readOnly && !result && !timedOut && isQuizAttemptInProgress(attempt)) {
      if (draftTimerRef.current !== null) {
        window.clearTimeout(draftTimerRef.current);
        draftTimerRef.current = null;
      }
      void persistDraft(answersRef.current);
    }
    onClose();
  }, [attempt, onClose, persistDraft, readOnly, result, timedOut]);

  const onTimerTick = useEffectEvent(async (secondsLeft: number, silent?: boolean) => {
    if (secondsLeft > 0) return;
    if (timeoutRetryCountRef.current >= TIMEOUT_SUBMIT_MAX_RETRIES) {
      if (!timeoutFailNotifiedRef.current) {
        timeoutFailNotifiedRef.current = true;
        message.error(QuizUiMessage.SUBMIT_FAILED);
      }
      return;
    }
    timeoutRetryCountRef.current += 1;
    const ok = await submitAnswers(answersRef.current, { force: true, silent });
    if (ok) {
      timeoutRetryCountRef.current = 0;
      timeoutFailNotifiedRef.current = false;
    }
  });

  const title = quiz?.title ?? 'Bài tập';
  const timerUrgent =
    remainingSeconds !== null && remainingSeconds <= QuizLimit.TIMER_WARN_SECONDS;
  const loadingSession = !readOnly && open && (!quizContentReady || attemptLoading);

  useEffect(() => {     
    if (readOnly || !open || result !== null || remainingSeconds === null || loadingSession) {
      return;
    }
    if (remainingSeconds <= 0) {
      void onTimerTick(0);
      const retryId = window.setInterval(() => {
        void onTimerTick(0, true);
      }, TIMEOUT_SUBMIT_RETRY_MS);
      return () => window.clearInterval(retryId);
    }
    const timerId = window.setTimeout(() => {
      setRemainingSeconds((prev) => (prev === null ? prev : prev - 1));
    }, 1000);
    return () => window.clearTimeout(timerId);
  }, [open, result, remainingSeconds, readOnly, loadingSession]);

  const titleNode = (
    <Space wrap size="middle">
      <span>{title}</span>
      {!readOnly && !viewMode && !loadingSession && remainingSeconds !== null ? (
        <span
          className={timerUrgent ? styles.quizTimerBadgeUrgent : styles.quizTimerBadge}
        >
          Còn {formatCountdown(remainingSeconds)}
        </span>
      ) : null}
    </Space>
  );

  const footerNode =
    readOnly || viewMode ? (
      <Button type="primary" onClick={handleClose} loading={!done && timedOut && submitAttempt.isPending}>
        {layout === 'page' ? 'Quay lại' : 'Đóng'}
      </Button>
    ) : (
      <Space>
        <Button onClick={handleClose}>{layout === 'page' ? 'Quay lại' : 'Đóng'}</Button>
        <Popconfirm
          title="Nộp bài này?"
          description="Sau khi nộp bạn không thể sửa câu trả lời."
          okText="Nộp bài"
          cancelText="Huỷ"
          onConfirm={handleSubmit}
          disabled={submitAttempt.isPending || startingSession}
        >
          <Button
            type="primary"
            loading={submitAttempt.isPending || startingSession}
            disabled={startingSession}
          >
            Nộp bài
          </Button>
        </Popconfirm>
      </Space>
    );

  const bodyNode = !quiz ? (
    <Empty description="Không có bài tập" />
  ) : loadingSession ? (
    <ScheduleLoading tip="Đang tải…" />
  ) : (
    <div className={styles.quizTakeBody}>
      {done ? (
        <div className={styles.quizResultBanner}>
          {(() => {
            const summary = buildQuizResultSummary({
              questions: quiz.questions,
              score: result.score,
              correct: result.correct_answers,
              total: result.total_questions,
              isPassed: result.is_passed,
              passingScore: quiz.passing_score,
            });
            return (
              <>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {summary.title}
                </Typography.Title>
                <Typography.Text type="secondary">{summary.detail}</Typography.Text>
              </>
            );
          })()}
        </div>
      ) : timedOut ? (
        <div className={styles.quizResultBanner}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {QuizUiMessage.TIMEOUT_SUBMITTED}
          </Typography.Title>
          <Typography.Text type="secondary">
            {submitAttempt.isPending
              ? 'Đang lưu kết quả…'
              : 'Bài làm đã khóa vì hết giờ — bạn chỉ có thể xem lại.'}
          </Typography.Text>
        </div>
      ) : (
        <Typography.Text type="secondary" className={styles.quizTakeMeta}>
          {quiz.questions.length} câu
          {quiz.duration_minutes > 0 ? ` · ${quiz.duration_minutes} phút` : null}
          {quiz.passing_score > 0 ? ` · Đạt từ ${quiz.passing_score}%` : null}
          {readOnly ? ' · Chỉ xem' : null}
        </Typography.Text>
      )}

      <ol className={styles.quizQuestionList}>
        {quiz.questions.map((q, index) => {
          const correctIds = q.correct_option_ids ?? [];
          const given = readOnly
            ? correctIds
            : (answers[q.id] ?? []);
          const essayText = readOnly ? '' : (answers[q.id]?.[0] ?? '');
          return (
            <li key={q.id} className={styles.quizQuestionItem}>
              <p className={styles.quizQuestionPrompt}>
                <span className={styles.quizQuestionIndex}>{index + 1}.</span> {q.prompt}{' '}
                {q.type === QuizQuestionType.ESSAY ? (
                  <Tag>{QuizUiMessage.ESSAY_TAG}</Tag>
                ) : null}
              </p>
              {(() => {
                const imageUrls = getQuestionImageUrls(q);
                if (imageUrls.length === 0) return null;
                return (
                  <div className={styles.quizQuestionImage}>
                    <Image.PreviewGroup>
                      <Space wrap>
                        {imageUrls.map((url) => (
                          <Image
                            key={url}
                            src={url}
                            alt=""
                            width={isMobile ? '100%' : 200}
                          />
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  </div>
                );
              })()}
              {q.type === QuizQuestionType.ESSAY ? (
                viewMode || readOnly ? (
                  <Typography.Paragraph className={styles.quizEssayAnswer}>
                    {(answers[q.id]?.[0] ?? '').trim() || QuizUiMessage.ESSAY_EMPTY}
                  </Typography.Paragraph>
                ) : (
                  <Input.TextArea
                    rows={4}
                    maxLength={QuizLimit.MAX_ESSAY_LENGTH}
                    showCount
                    placeholder={QuizUiMessage.ESSAY_PLACEHOLDER}
                    value={essayText}
                    disabled={answersLocked}
                    onChange={(event) => setEssay(q.id, event.target.value)}
                  />
                )
              ) : q.type === QuizQuestionType.MULTIPLE ? (
                <Checkbox.Group
                  disabled={answersLocked}
                  value={given}
                  onChange={(vals) => setMultiple(q.id, vals as string[])}
                  className={styles.quizOptions}
                >
                  <Space orientation="vertical">
                    {q.options.map((opt) => (
                      <Checkbox key={opt.id} value={opt.id}>
                        <OptionLabel
                          text={opt.text}
                          verdict={selectedOptionVerdict(done, opt.id, q, given)}
                          showAnswerKey={readOnly && correctIds.includes(opt.id)}
                        />
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              ) : (
                <Radio.Group
                  disabled={answersLocked}
                  value={given[0]}
                  onChange={(e) => setSingle(q.id, e.target.value)}
                  className={styles.quizOptions}
                >
                  <Space orientation="vertical">
                    {q.options.map((opt) => (
                      <Radio key={opt.id} value={opt.id}>
                        <OptionLabel
                          text={opt.text}
                          verdict={selectedOptionVerdict(done, opt.id, q, given)}
                          showAnswerKey={readOnly && correctIds.includes(opt.id)}
                        />
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );

  if (layout === 'page') {
    if (!open) return null;
    return (
      <div className={styles.quizTakePagePanel}>
        <div className={styles.quizTakePageHead}>{titleNode}</div>
        {bodyNode}
        <div className={styles.quizTakePageFooter}>{footerNode}</div>
      </div>
    );
  }

  return (
    <Modal
      title={titleNode}
      open={open}
      onCancel={handleClose}
      footer={footerNode}
      width={isMobile ? '95vw' : 640}
      destroyOnHidden
    >
      {bodyNode}
    </Modal>
  );
}
