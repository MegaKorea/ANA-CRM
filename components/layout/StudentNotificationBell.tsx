'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Dropdown,
  Empty,
  List,
  Space,
  Typography,
  theme,
} from 'antd';
import { BellOutlined, FormOutlined, ReadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { ClassMemberRole, UserNotificationType } from '@/constants/enums';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
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
  const { user } = useCurrentUser();
  const isStudent = (user?.roleCode ?? '').toUpperCase() === ClassMemberRole.STU;
  const isMobile = useIsMobile();
  const { data, isLoading } = useMyNotifications(!!isStudent);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const unreadCount = data?.unreadCount ?? 0;

  const openNotification = useCallback(
    async (item: UserNotification) => {
      setDropdownOpen(false);
      const href = notificationHref(item);
      if (!item.read_at) {
        try {
          await markRead.mutateAsync(item.id);
        } catch {
          // Still navigate even if mark-read fails.
        }
      }
      if (href) {
        router.push(href);
      }
    },
    [markRead, router],
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
        <List
          size="small"
          dataSource={items}
          rowKey={(item) => item.id}
          renderItem={(item) => (
            <List.Item
              style={{
                cursor: 'pointer',
                background: item.read_at ? undefined : token.colorPrimaryBg,
                borderRadius: token.borderRadiusSM,
                padding: '8px 10px',
              }}
              onClick={() => openNotification(item)}
            >
              <List.Item.Meta
                avatar={
                  item.type === UserNotificationType.QUIZ_PUBLISHED ? (
                    <FormOutlined />
                  ) : (
                    <ReadOutlined />
                  )
                }
                title={
                  <Text strong={!item.read_at} style={{ fontSize: 13 }}>
                    {item.title}
                  </Text>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.body}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatViDateTime(item.created_at)}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
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
