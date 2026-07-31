import { NotificationPayloadKind, UserNotificationType } from '@/constants/enums';
import type { SessionLectureAttachment, SessionLectureLink } from '@/lib/types/session-lecture';

export type LectureNotificationPayload = {
  kind: NotificationPayloadKind.LECTURE;
  class_id: string;
  session_id: string;
  session_date: string;
  session_number: number;
  lecture_id: string;
  lecture_title: string;
  html: string;
  links: SessionLectureLink[];
  attachments: SessionLectureAttachment[];
};

export type QuizNotificationPayload = {
  kind: NotificationPayloadKind.QUIZ;
  class_id: string;
  session_id: string;
  session_date: string;
  session_number: number;
  quiz_id: string;
  quiz_title: string;
  question_count: number;
  duration_minutes: number;
  passing_score: number;
};

export type UserNotificationPayload = LectureNotificationPayload | QuizNotificationPayload;

export type UserNotification = {
  id: string;
  user_id: string;
  type: UserNotificationType | string;
  title: string;
  body: string;
  payload: UserNotificationPayload | Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

export function isLectureNotificationPayload(
  payload: unknown,
): payload is LectureNotificationPayload {
  return (
    !!payload &&
    typeof payload === 'object' &&
    (payload as { kind?: string }).kind === NotificationPayloadKind.LECTURE
  );
}

export function isQuizNotificationPayload(payload: unknown): payload is QuizNotificationPayload {
  return (
    !!payload &&
    typeof payload === 'object' &&
    (payload as { kind?: string }).kind === NotificationPayloadKind.QUIZ
  );
}
