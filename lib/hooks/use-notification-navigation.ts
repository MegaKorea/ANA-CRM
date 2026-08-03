import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { prefetchSessionQuizDetail } from '@/lib/hooks/use-quizzes';
import { useMarkNotificationRead } from '@/lib/hooks/use-user-notifications';
import type { UserNotification } from '@/lib/types/user-notification';
import { isLectureNotificationPayload, isQuizNotificationPayload } from '@/lib/types/user-notification';
import { SESSION_LECTURES_KEY } from '@/lib/hooks/use-class-sessions';
import { fetchJson } from '@/lib/utils/fetchJson';
import type { SessionLecture } from '@/lib/types/session-lecture';

export function notificationHref(item: UserNotification): string | null {
  const payload = item.payload;
  if (isLectureNotificationPayload(payload)) {
    const date = payload.session_date
      ? `?date=${encodeURIComponent(payload.session_date)}`
      : '';
    return `/class/${payload.class_id}/sessions/${payload.session_id}/lectures/${payload.lecture_id}${date}`;
  }
  if (isQuizNotificationPayload(payload)) {
    const date = payload.session_date
      ? `?date=${encodeURIComponent(payload.session_date)}`
      : '';
    return `/class/${payload.class_id}/sessions/${payload.session_id}/quizzes/${payload.quiz_id}${date}`;
  }
  return null;
}

/**
 * Navigation/prefetch behavior for the notification bell: warm the target
 * quiz/lecture query on hover, then navigate + mark read on click.
 */
export function useNotificationNavigation() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationRead();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const prefetchNotificationTarget = useCallback(
    (item: UserNotification) => {
      const payload = item.payload;
      if (isQuizNotificationPayload(payload)) {
        void prefetchSessionQuizDetail(queryClient, payload.session_id, payload.quiz_id);
        return;
      }
      if (isLectureNotificationPayload(payload)) {
        void queryClient.prefetchQuery({
          queryKey: [SESSION_LECTURES_KEY, payload.session_id],
          queryFn: () =>
            fetchJson<SessionLecture[]>(`/api/classes/sessions/${payload.session_id}/lectures`),
          staleTime: 30_000,
        });
      }
    },
    [queryClient],
  );

  const openNotification = useCallback(
    (item: UserNotification) => {
      setDropdownOpen(false);
      const href = notificationHref(item);
      prefetchNotificationTarget(item);
      if (href) {
        router.prefetch(href);
        router.push(href);
      }
      if (!item.read_at) {
        void markRead.mutateAsync(item.id).catch(() => {});
      }
    },
    [markRead, prefetchNotificationTarget, router],
  );

  return { dropdownOpen, setDropdownOpen, openNotification, prefetchNotificationTarget };
}
