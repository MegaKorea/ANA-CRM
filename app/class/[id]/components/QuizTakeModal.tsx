'use client';

import { Button, Checkbox, Empty, Image, Modal, Popconfirm, Radio, Space, Tag, Typography, message } from 'antd';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import type { Quiz, QuizAttempt, QuizQuestion } from '@/lib/types/quiz';
import {
  getQuestionImageUrls,
  getQuizAttemptRemainingSeconds,
  isQuizAttemptCompleted,
  isQuizAttemptInProgress,
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

type Props = {
  sessionId: string;
  quiz: Quiz | null;
  open: boolean;
  isMobile: boolean;
  readOnly?: boolean;
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
  onClose,
}: Props) {
  const quizId = quizProp?.id ?? null;
  const { data: quizDetail } = useSessionQuizDetail(sessionId, quizId, open && !!quizId);
  const quiz = quizDetail ?? quizProp;

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
  const [sessionReady, setSessionReady] = useState(false);

  const answersRef = useRef(answers);
  const submittingRef = useRef(false);
  const startingRef = useRef(false);
  const draftTimerRef = useRef<number | null>(null);
  const hydratedAttemptIdRef = useRef<string | null>(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!open) {
      setAnswers({});
      setResult(null);
      setRemainingSeconds(null);
      setSessionReady(false);
      submittingRef.current = false;
      startingRef.current = false;
      hydratedAttemptIdRef.current = null;
      if (draftTimerRef.current !== null) {
        window.clearTimeout(draftTimerRef.current);
        draftTimerRef.current = null;
      }
      return;
    }
    if (readOnly) {
      setResult(null);
      setAnswers({});
      setRemainingSeconds(null);
      setSessionReady(true);
    }
  }, [open, readOnly]);

  const startAttemptMutate = startAttempt.mutateAsync;
  const onCloseEvent = useEffectEvent(onClose);

  useEffect(() => {
    if (!open || readOnly || attemptLoading || !quizId || !sessionId) return;

    if (isQuizAttemptCompleted(attempt)) {
      setResult(attempt!);
      setAnswers(attempt!.user_answers ?? {});
      setRemainingSeconds(null);
      setSessionReady(true);
      hydratedAttemptIdRef.current = attempt!.id;
      return;
    }

    if (isQuizAttemptInProgress(attempt)) {
      if (hydratedAttemptIdRef.current !== attempt!.id) {
        setAnswers(attempt!.user_answers ?? {});
        hydratedAttemptIdRef.current = attempt!.id;
      }
      setResult(null);
      setRemainingSeconds(
        getQuizAttemptRemainingSeconds(attempt!.started_at, quiz?.duration_minutes ?? 0),
      );
      setSessionReady(true);
      return;
    }

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
    quiz?.duration_minutes,
    startAttemptMutate,
  ]);

  const persistDraft = useCallback(
    async (nextAnswers: Record<string, string[]>) => {
      if (readOnly || !quizId || !sessionId || !isQuizAttemptInProgress(attempt)) return;
      try {
        await saveDraft.mutateAsync({ sessionId, quizId, answers: nextAnswers });
      } catch {
        // Draft save is best-effort; submit still sends latest answers.
      }
    },
    [attempt, quizId, readOnly, saveDraft, sessionId],
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

  const submitAnswers = useCallback(
    async (nextAnswers: Record<string, string[]>, opts?: { force?: boolean }) => {
      if (readOnly || !quiz || !sessionId || submittingRef.current) return;
      if (!opts?.force) {
        const unanswered = quiz.questions.filter((q) => !(nextAnswers[q.id]?.length > 0));
        if (unanswered.length > 0) {
          message.warning(QuizUiMessage.UNANSWERED);
          return;
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
        message.success(opts?.force ? QuizUiMessage.TIMEOUT_SUBMITTED : QuizUiMessage.SUBMITTED);
      } catch (error: unknown) {
        submittingRef.current = false;
        message.error(getErrorMessage(error, QuizUiMessage.SUBMIT_FAILED));
      }
    },
    [quiz, sessionId, submitAttempt, readOnly],
  );

  const handleSubmit = useCallback(() => {
    void submitAnswers(answers);
  }, [answers, submitAnswers]);

  const handleClose = useCallback(() => {
    if (!readOnly && !result && isQuizAttemptInProgress(attempt)) {
      if (draftTimerRef.current !== null) {
        window.clearTimeout(draftTimerRef.current);
        draftTimerRef.current = null;
      }
      void persistDraft(answersRef.current);
    }
    onClose();
  }, [attempt, onClose, persistDraft, readOnly, result]);

  const onTimerTick = useEffectEvent((secondsLeft: number) => {
    if (secondsLeft > 0) return;
    void submitAnswers(answersRef.current, { force: true });
  });

  useEffect(() => {
    if (readOnly || !open || result !== null || remainingSeconds === null) return;
    if (remainingSeconds <= 0) {
      onTimerTick(0);
      return;
    }
    const timerId = window.setTimeout(() => {
      setRemainingSeconds((prev) => (prev === null ? prev : prev - 1));
    }, 1000);
    return () => window.clearTimeout(timerId);
  }, [open, result, remainingSeconds, onTimerTick, readOnly]);

  const done = !readOnly && result !== null;
  const title = quiz?.title ?? 'Bài tập';
  const timerUrgent =
    remainingSeconds !== null && remainingSeconds <= QuizLimit.TIMER_WARN_SECONDS;
  const loadingSession =
    !readOnly && open && (!sessionReady || attemptLoading || startAttempt.isPending);

  return (
    <Modal
      title={
        <Space wrap size="middle">
          <span>{title}</span>
          {!readOnly && !done && remainingSeconds !== null ? (
            <span
              className={
                timerUrgent ? styles.quizTimerBadgeUrgent : styles.quizTimerBadge
              }
            >
              Còn {formatCountdown(remainingSeconds)}
            </span>
          ) : null}
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={
        readOnly || done ? (
          <Button type="primary" onClick={handleClose}>
            Đóng
          </Button>
        ) : (
          <Space>
            <Button onClick={handleClose}>Đóng</Button>
            <Popconfirm
              title="Nộp bài này?"
              description="Sau khi nộp bạn không thể sửa câu trả lời."
              okText="Nộp bài"
              cancelText="Huỷ"
              onConfirm={handleSubmit}
              disabled={submitAttempt.isPending}
            >
              <Button type="primary" loading={submitAttempt.isPending}>
                Nộp bài
              </Button>
            </Popconfirm>
          </Space>
        )
      }
      width={isMobile ? '95vw' : 640}
      destroyOnHidden
    >
      {!quiz ? (
        <Empty description="Không có bài tập" />
      ) : loadingSession ? (
        <ScheduleLoading tip="Đang tải…" />
      ) : (
        <div className={styles.quizTakeBody}>
          {done ? (
            <div className={styles.quizResultBanner}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {result.is_passed ? 'Đạt' : 'Chưa đạt'} · {result.score}%
              </Typography.Title>
              <Typography.Text type="secondary">
                Đúng {result.correct_answers}/{result.total_questions} câu
                {quiz.passing_score > 0 ? ` · Điểm đạt: ${quiz.passing_score}%` : null}
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
              const given = readOnly ? correctIds : (answers[q.id] ?? []);
              return (
                <li key={q.id} className={styles.quizQuestionItem}>
                  <p className={styles.quizQuestionPrompt}>
                    <span className={styles.quizQuestionIndex}>{index + 1}.</span> {q.prompt}
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
                  {q.type === QuizQuestionType.MULTIPLE ? (
                    <Checkbox.Group
                      disabled={done || readOnly}
                      value={given}
                      onChange={(vals) => setMultiple(q.id, vals as string[])}
                      className={styles.quizOptions}
                    >
                      <Space direction="vertical">
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
                      disabled={done || readOnly}
                      value={given[0]}
                      onChange={(e) => setSingle(q.id, e.target.value)}
                      className={styles.quizOptions}
                    >
                      <Space direction="vertical">
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
      )}
    </Modal>
  );
}
