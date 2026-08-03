'use client';

import {
  Badge,
  Button,
  Dropdown,
  Empty,
  Typography,
  theme,
} from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { ClassMemberRole } from '@/constants/enums';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { useMarkAllNotificationsRead, useMyNotifications } from '@/lib/hooks/use-user-notifications';
import { useNotificationNavigation } from '@/lib/hooks/use-notification-navigation';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { NotificationListItem } from './NotificationListItem';

const { Text } = Typography;

export function StudentNotificationBell() {
  const { token } = theme.useToken();
  const { user } = useCurrentUser();
  const isStudent = (user?.roleCode ?? '').toUpperCase() === ClassMemberRole.STU;
  const isMobile = useIsMobile();
  const { data, isLoading } = useMyNotifications(!!isStudent);
  const markAllRead = useMarkAllNotificationsRead();
  const { dropdownOpen, setDropdownOpen, openNotification, prefetchNotificationTarget } =
    useNotificationNavigation();

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

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
            <NotificationListItem
              key={item.id}
              item={item}
              onHover={prefetchNotificationTarget}
              onOpen={openNotification}
            />
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
