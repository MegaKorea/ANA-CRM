'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Dropdown,
  Empty,
  Space,
  Typography,
  theme,
} from 'antd';
import { BellOutlined, FormOutlined, ReadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ClassMemberRole, UserNotificationType } from '@/constants/enums';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { prefetchSessionQuizDetail } from '@/lib/hooks/use-quizzes';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from '@/lib/hooks/use-user-notifications';
import type { UserNotification } from '@/lib/types/user-notification';
import {
  isLectureNotificationPayload,
  isQuizNotificationPayload,
} from '@/lib/types/user-notification';
import { formatViDateTime } from '@/lib/utils/format-vi-datetime';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { SESSION_LECTURES_KEY } from '@/lib/hooks/use-class-sessions';
import { fetchJson } from '@/lib/utils/fetchJson';
import type { SessionLecture } from '@/lib/types/session-lecture';

const { Text } = Typography;

function notificationHref(item: UserNotification): string | null {
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

export function StudentNotificationBell() {
  const { token } = theme.useToken();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const isStudent = (user?.roleCode ?? '').toUpperCase() === ClassMemberRole.STU;
  const isMobile = useIsMobile();
  const { data, isLoading } = useMyNotifications(!!isStudent);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const unreadCount = data?.unreadCount ?? 0;

  const prefetchNotificationTarget = useCallback(
    (item: UserNotification) => {
      const payload = item.payload;
      if (isQuizNotificationPayload(payload)) {
        void prefetchSessionQuizDetail(
          queryClient,
          payload.session_id,
          payload.quiz_id,
        );
        return;
      }
      if (isLectureNotificationPayload(payload)) {
        void queryClient.prefetchQuery({
          queryKey: [SESSION_LECTURES_KEY, payload.session_id],
          queryFn: () =>
            fetchJson<SessionLecture[]>(
              `/api/classes/sessions/${payload.session_id}/lectures`,
            ),
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
        void markRead.mutateAsync(item.id).catch(() => {
        });
      }
    },
    [markRead, prefetchNotificationTarget, router],
  );

  if (!isStudent) return null;

  const dropdownContent = (
    <div
      style={{
        width: isMobile ? 'min(92vw, 340px)' : 340,
        maxHeight: isMobile ? 'min(60vh, 400px)' : 400,
        overflowY: 'auto',
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        padding: 8,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          padding: '0 4px',
        }}
      >
        <Text strong>Thông báo</Text>
        {unreadCount > 0 ? (
          <Button
            type="link"
            size="small"
            loading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Đánh dấu đã đọc
          </Button>
        ) : null}
      </div>
      {isLoading ? (
        <Text type="secondary">Đang tải…</Text>
      ) : items.length === 0 ? (
        <Empty description="Chưa có thông báo" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div role="list">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="listitem"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                width: '100%',
                border: 0,
                cursor: 'pointer',
                background: item.read_at ? undefined : token.colorPrimaryBg,
                borderRadius: token.borderRadiusSM,
                padding: '8px 10px',
                color: 'inherit',
                font: 'inherit',
                textAlign: 'left',
              }}
              onMouseEnter={() => prefetchNotificationTarget(item)}
              onClick={() => openNotification(item)}
            >
              <span aria-hidden="true" style={{ paddingTop: 2 }}>
                {item.type === UserNotificationType.QUIZ_PUBLISHED ? (
                  <FormOutlined />
                ) : (
                  <ReadOutlined />
                )}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block' }}>
                  <Text strong={!item.read_at} style={{ fontSize: 13 }}>
                    {item.title}
                  </Text>
                </span>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.body}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {formatViDateTime(item.created_at)}
                  </Text>
                </Space>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      popupRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      destroyOnHidden
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<BellOutlined />} aria-label="Thông báo học viên" />
      </Badge>
    </Dropdown>
  );
}
