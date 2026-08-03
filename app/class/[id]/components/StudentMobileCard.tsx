import { Avatar, Badge, Button, Card, Popconfirm, Space, Tag, Typography, theme } from 'antd';
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatCurrency, initials, nameToColor, studentStatusMeta } from './student-roster.utils';

const { Text } = Typography;

type Props = {
  record: any;
  isManager: boolean;
  resolveContact: (value: string | null | undefined, record: any, emptyLabel?: string) => string;
  onOpenFinance: (record: any) => void;
  onRemove: (studentId: string) => void;
};

export function StudentMobileCard({ record, isManager, resolveContact, onOpenFinance, onRemove }: Props) {
  const { token } = theme.useToken();
  const name = record.leads?.full_name || 'N/A';
  const phoneRaw = record.leads?.phone_number;
  const emailRaw = record.login_email;
  const phone = resolveContact(phoneRaw, record) || null;
  const email = emailRaw ? resolveContact(emailRaw, record) : null;
  const date = record.enrollment_date ? dayjs(record.enrollment_date).format('DD/MM/YYYY') : '';
  const status = studentStatusMeta[record.status] ?? {
    label: record.status || '—',
    color: 'default',
  };

  return (
    <div role="listitem" style={{ paddingBottom: 12 }}>
      <Card
        size="small"
        style={{ width: '100%', borderRadius: token.borderRadiusLG }}
        styles={{ body: { padding: '12px 14px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Avatar
            size={40}
            style={{
              background: nameToColor(name),
              flexShrink: 0,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {initials(name)}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ fontSize: 15, display: 'block', lineHeight: '1.3' }}>
              {name}
            </Text>
            <Tag color={status.color} style={{ marginTop: 2 }}>
              {status.label}
            </Tag>
          </div>
          {isManager && (
            <Space size={6}>
              <Badge count={record.images?.length || 0} size="small" offset={[-2, 0]}>
                <Button
                  size="small"
                  icon={<PictureOutlined />}
                  onClick={() => onOpenFinance(record)}
                />
              </Badge>
              <Button
                size="small"
                type="primary"
                ghost
                shape="circle"
                icon={<EditOutlined />}
                onClick={() => onOpenFinance(record)}
              />
              <Popconfirm
                title="Xóa khỏi lớp"
                description="Xóa học viên này khỏi lớp?"
                onConfirm={() => onRemove(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger ghost shape="circle" icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <PhoneOutlined style={{ color: token.colorTextQuaternary, fontSize: 13 }} />
              <Text style={{ fontSize: 13 }}>{phone}</Text>
            </div>
          )}
          {email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <MailOutlined style={{ color: token.colorTextQuaternary, fontSize: 13 }} />
              <Text style={{ fontSize: 13 }} ellipsis>
                {email}
              </Text>
            </div>
          )}
          {date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <CalendarOutlined style={{ color: token.colorTextQuaternary, fontSize: 13 }} />
              <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
                Tham gia: {date}
              </Text>
            </div>
          )}
        </div>

        {isManager && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 10,
              padding: '8px 10px',
              borderRadius: token.borderRadius,
              background: token.colorFillAlter,
            }}
          >
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 2 }}>
                Đã nộp
              </div>
              <Text type="success" style={{ fontSize: 13, fontWeight: 600 }}>
                {formatCurrency(record.paid_amount || 0)}
              </Text>
            </div>
            <div style={{ width: 1, background: token.colorBorderSecondary }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 2 }}>
                Công nợ
              </div>
              <Text type="danger" style={{ fontSize: 13, fontWeight: 600 }}>
                {formatCurrency(record.debt_amount || 0)}
              </Text>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
