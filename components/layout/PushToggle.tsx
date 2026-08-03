'use client';

import { App, Button, Dropdown, Tooltip, Typography } from 'antd';
import { NotificationOutlined, NotificationFilled } from '@ant-design/icons';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';

const { Text } = Typography;

/**
 * Header control that lets the signed-in user turn OS-level push notifications
 * on/off for the current device, and fire a test notification.
 */
export function PushToggle() {
  const { message } = App.useApp();
  const { supported, permission, subscribed, loading, enable, disable, sendTest } =
    usePushNotifications();

  if (!supported) return null;

  const handleEnable = async () => {
    try {
      // Drive the message off what enable() actually did. Reading
      // Notification.permission instead reported success whenever permission was
      // already granted — even when no subscription was created.
      const result = await enable();
      if (result === 'denied') {
        message.warning('Bạn đã chặn thông báo cho trang này. Hãy bật lại trong cài đặt trình duyệt.');
      } else if (result === 'dismissed') {
        message.info('Bạn chưa cho phép thông báo. Hãy chọn "Cho phép" khi trình duyệt hỏi.');
      } else {
        message.success('Đã bật thông báo trên máy này');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Bật thông báo thất bại');
    }
  };

  const handleDisable = async () => {
    try {
      await disable();
      message.success('Đã tắt thông báo trên máy này');
    } catch {
      message.error('Tắt thông báo thất bại');
    }
  };

  const handleTest = async () => {
    try {
      const delivered = await sendTest();
      if (delivered > 0) {
        message.success(`Đã gửi thông báo thử tới ${delivered} thiết bị`);
      } else {
        message.warning('Chưa có thiết bị nào đăng ký. Hãy bật thông báo trước.');
      }
    } catch {
      message.error('Gửi thử thất bại');
    }
  };

  const menu = (
    <div
      style={{
        width: 260,
        background: 'var(--ant-color-bg-elevated, #fff)',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0,0,0,.12)',
        padding: 12,
      }}
    >
      <Text strong>Thông báo trên máy này</Text>
      <div style={{ marginTop: 4, marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {permission === 'denied'
            ? 'Đang bị chặn — bật lại trong cài đặt trình duyệt.'
            : subscribed
              ? 'Đang bật. Bạn sẽ nhận nhắc lịch hẹn kể cả khi đóng tab.'
              : 'Bật để nhận nhắc lịch hẹn qua thông báo hệ điều hành.'}
        </Text>
      </div>

      {subscribed ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={handleTest} loading={loading}>
            Gửi thử
          </Button>
          <Button size="small" danger onClick={handleDisable} loading={loading}>
            Tắt
          </Button>
        </div>
      ) : (
        <Button
          type="primary"
          size="small"
          block
          onClick={handleEnable}
          loading={loading}
          disabled={permission === 'denied'}
        >
          Bật thông báo
        </Button>
      )}
    </div>
  );

  return (
    <Dropdown popupRender={() => menu} trigger={['click']} placement="bottomRight">
      <Tooltip title={subscribed ? 'Thông báo đang bật' : 'Bật thông báo'}>
        <Button
          type="text"
          icon={
            subscribed ? (
              <NotificationFilled style={{ color: '#52c41a' }} />
            ) : (
              <NotificationOutlined />
            )
          }
        />
      </Tooltip>
    </Dropdown>
  );
}
