import { Space, Typography, theme } from 'antd';
import { FormOutlined, ReadOutlined } from '@ant-design/icons';
import { UserNotificationType } from '@/constants/enums';
import type { UserNotification } from '@/lib/types/user-notification';
import { formatViDateTime } from '@/lib/utils/format-vi-datetime';

const { Text } = Typography;

type Props = {
  item: UserNotification;
  onHover: (item: UserNotification) => void;
  onOpen: (item: UserNotification) => void;
};

export function NotificationListItem({ item, onHover, onOpen }: Props) {
  const { token } = theme.useToken();

  return (
    <button
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
      onMouseEnter={() => onHover(item)}
      onClick={() => onOpen(item)}
    >
      <span aria-hidden="true" style={{ paddingTop: 2 }}>
        {item.type === UserNotificationType.QUIZ_PUBLISHED ? <FormOutlined /> : <ReadOutlined />}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block' }}>
          <Text strong={!item.read_at} style={{ fontSize: 13 }}>
            {item.title}
          </Text>
        </span>
        <Space orientation="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {item.body}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {formatViDateTime(item.created_at)}
          </Text>
        </Space>
      </span>
    </button>
  );
}
