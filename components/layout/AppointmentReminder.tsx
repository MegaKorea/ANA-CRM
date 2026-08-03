'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { App, Badge, Button, Dropdown, Empty, List, Space, Typography } from 'antd';
import { BellOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { useDueReminders, useMarkRemindersSent } from '@/lib/hooks/use-appointments';
import { ClassMemberRole, DateLocale } from '@/constants/enums';
import type { DueAppointment } from '@/lib/services/appointment.service';

const { Text } = Typography;

function formatWhen(appointment: DueAppointment): string {
  return new Date(appointment.appointment_date).toLocaleString(DateLocale.VIET_NAM);
}

export function AppointmentReminder() {
  const router = useRouter();
  const { notification } = App.useApp();
  const { user } = useCurrentUser();
  const isStudent = user?.roleCode === ClassMemberRole.STU;

  const { data: reminders } = useDueReminders(!!user?.id && !isStudent);
  const { mutate: markSent } = useMarkRemindersSent();

  const poppedRef = useRef<Set<number>>(new Set());

  const items = useMemo(() => reminders ?? [], [reminders]);

  const acknowledge = useCallback(
    (ids: number[]) => {
      if (ids.length > 0) markSent(ids);
    },
    [markSent]
  );

  const openLead = useCallback(
    (appointment: DueAppointment) => {
      acknowledge([appointment.id]);
      notification.destroy(`appointment-${appointment.id}`);
      router.push(`/lead?highlight=${appointment.lead_id}`);
    },
    [acknowledge, notification, router]
  );

  useEffect(() => {
    if (isStudent) return;
    items.forEach((appointment) => {
      if (poppedRef.current.has(appointment.id)) return;
      poppedRef.current.add(appointment.id);

      notification.open({
        key: `appointment-${appointment.id}`,
        message: 'Sắp tới lịch hẹn',
        icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
        description: (
          <Space orientation="vertical" size={2}>
            <Text strong>{appointment.lead_full_name ?? 'Khách hàng'}</Text>
            {appointment.lead_phone_number && <Text>{appointment.lead_phone_number}</Text>}
            <Text type="secondary">Hẹn lúc {formatWhen(appointment)}</Text>
            {appointment.note && <Text type="secondary">{appointment.note}</Text>}
          </Space>
        ),
        duration: 0,
        btn: (
          <Space>
            <Button size="small" onClick={() => {
              acknowledge([appointment.id]);
              notification.destroy(`appointment-${appointment.id}`);
            }}>
              Đã xử lý
            </Button>
            <Button type="primary" size="small" onClick={() => openLead(appointment)}>
              Xem khách
            </Button>
          </Space>
        ),
        onClose: () => acknowledge([appointment.id]),
      });
    });
  }, [acknowledge, isStudent, items, notification, openLead]);

  if (isStudent) return null;
  const dropdownContent = (
    <div
      style={{
        width: 320,
        maxHeight: 360,
        overflowY: 'auto',
        background: 'var(--ant-color-bg-elevated, #fff)',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0,0,0,.12)',
        padding: 8,
      }}
    >
      {items.length === 0 ? (
        <Empty description="Không có lịch hẹn cần nhắc" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          size="small"
          dataSource={items}
          rowKey={(item) => item.id}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => openLead(item)}
              actions={[
                <Button
                  key="ack"
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation();
                    acknowledge([item.id]);
                    notification.destroy(`appointment-${item.id}`);
                  }}
                >
                  Đã xử lý
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={<Text strong>{item.lead_full_name ?? 'Khách hàng'}</Text>}
                description={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatWhen(item)}
                    {item.lead_phone_number ? ` · ${item.lead_phone_number}` : ''}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown popupRender={() => dropdownContent} trigger={['click']} placement="bottomRight">
      <Badge count={items.length} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<BellOutlined />} />
      </Badge>
    </Dropdown>
  );
}
