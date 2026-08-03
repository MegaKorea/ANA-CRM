'use client';

import { useCallback, useMemo } from 'react';
import {
  App,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { BellOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  useAppointmentsByLead,
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointment,
} from '@/lib/hooks/use-appointments';
import { AttendanceStatus, DateLocale } from '@/constants/enums';
import type { LeadAppointment } from '@/lib/services/appointment.service';

const { Text } = Typography;

/** Reminder offsets offered when booking, mirroring REMIND_BEFORE_OPTIONS. */
const REMIND_OPTIONS = [
  { value: 15, label: 'Trước 15 phút' },
  { value: 30, label: 'Trước 30 phút' },
  { value: 60, label: 'Trước 1 giờ' },
  { value: 120, label: 'Trước 2 giờ' },
  { value: 1440, label: 'Trước 1 ngày' },
];

const ATTENDANCE_OPTIONS = [
  { value: AttendanceStatus.NOT_ARRIVED, label: 'Chưa đến' },
  { value: AttendanceStatus.ARRIVED, label: 'Đã đến' },
  { value: AttendanceStatus.NO_SHOW, label: 'Bom' },
];

function attendanceColor(status: AttendanceStatus): string {
  if (status === AttendanceStatus.ARRIVED) return 'success';
  if (status === AttendanceStatus.NO_SHOW) return 'error';
  return 'warning';
}

interface AppointmentFormValues {
  appointment_date: Dayjs;
  remind_before_min: number;
  note?: string;
}

interface AppointmentModalProps {
  open: boolean;
  leadId: number | undefined;
  leadName?: string | null;
  onClose: () => void;
}

/**
 * Manages the full list of appointments for one lead. A lead may hold many
 * appointments; the nearest upcoming one is mirrored back onto the lead row by
 * the server so the lead table and statistics keep working.
 */
export default function AppointmentModal({
  open,
  leadId,
  leadName,
  onClose,
}: AppointmentModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<AppointmentFormValues>();

  const { data: appointments, isLoading } = useAppointmentsByLead(open ? leadId : undefined);
  const { mutate: createAppointment, isPending: isCreating } = useCreateAppointment();
  const { mutate: updateAppointment } = useUpdateAppointment();
  const { mutate: deleteAppointment } = useDeleteAppointment();

  const sorted = useMemo(
    () =>
      [...(appointments ?? [])].sort(
        (a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
      ),
    [appointments]
  );

  const handleAdd = useCallback(
    (values: AppointmentFormValues) => {
      if (!leadId) return;

      createAppointment(
        {
          leadId,
          input: {
            appointment_date: values.appointment_date.toISOString(),
            remind_before_min: values.remind_before_min,
            note: values.note?.trim() || undefined,
          },
        },
        {
          onSuccess: () => {
            message.success('Đã thêm lịch hẹn');
            form.resetFields();
          },
          onError: () => message.error('Thêm lịch hẹn thất bại'),
        }
      );
    },
    [createAppointment, form, leadId, message]
  );

  const handleChangeAttendance = useCallback(
    (appointment: LeadAppointment, status: AttendanceStatus) => {
      updateAppointment(
        { id: appointment.id, leadId: appointment.lead_id, input: { attendance_status: status } },
        {
          onSuccess: () => message.success('Đã cập nhật trạng thái'),
          onError: () => message.error('Cập nhật thất bại'),
        }
      );
    },
    [message, updateAppointment]
  );

  const handleDelete = useCallback(
    (appointment: LeadAppointment) => {
      deleteAppointment(
        { id: appointment.id, leadId: appointment.lead_id },
        {
          onSuccess: () => message.success('Đã xóa lịch hẹn'),
          onError: () => message.error('Xóa thất bại'),
        }
      );
    },
    [deleteAppointment, message]
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnHidden
      title={leadName ? `Lịch hẹn — ${leadName}` : 'Lịch hẹn'}
    >
      <Form<AppointmentFormValues>
        form={form}
        layout="vertical"
        onFinish={handleAdd}
        initialValues={{ remind_before_min: 30 }}
      >
        <Space.Compact style={{ width: '100%', marginBottom: 8 }} block>
          <Form.Item
            name="appointment_date"
            rules={[{ required: true, message: 'Chọn thời gian hẹn' }]}
            style={{ flex: 1, marginBottom: 8 }}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              placeholder="Chọn ngày giờ hẹn"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Form.Item name="remind_before_min" style={{ width: 160, marginBottom: 8 }}>
            <Select options={REMIND_OPTIONS} />
          </Form.Item>
        </Space.Compact>

        <Form.Item name="note" style={{ marginBottom: 8 }}>
          <Input placeholder="Ghi chú (tùy chọn)" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" loading={isCreating} block>
            Thêm lịch hẹn
          </Button>
        </Form.Item>
      </Form>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : sorted.length === 0 ? (
        <Empty description="Chưa có lịch hẹn nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div role="list">
          {sorted.map((item) => (
              <div
                role="listitem"
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBlockEnd: '1px solid var(--ant-color-split, rgba(5, 5, 5, 0.06))',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Space>
                    <Text delete={item.attendance_status === AttendanceStatus.NO_SHOW}>
                      {new Date(item.appointment_date).toLocaleString(DateLocale.VIET_NAM)}
                    </Text>
                    <Tag color={attendanceColor(item.attendance_status)}>
                      {ATTENDANCE_OPTIONS.find((o) => o.value === item.attendance_status)?.label}
                    </Tag>
                  </Space>
                  <Space size="small" wrap style={{ display: 'flex', marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <BellOutlined />{' '}
                      {REMIND_OPTIONS.find((o) => o.value === item.remind_before_min)?.label ??
                        `Trước ${item.remind_before_min} phút`}
                    </Text>
                    {(item.reminder_sent_at || item.pushed_at) && (
                      <Tag color="default" style={{ fontSize: 11 }}>
                        đã nhắc
                      </Tag>
                    )}
                    {item.note && <Text type="secondary">· {item.note}</Text>}
                  </Space>
                </div>
                <Space size="small">
                  <Select
                    size="small"
                    value={item.attendance_status}
                    options={ATTENDANCE_OPTIONS}
                    style={{ width: 110 }}
                    onChange={(value) => handleChangeAttendance(item, value)}
                  />
                  <Popconfirm
                    title="Xóa lịch hẹn này?"
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(item)}
                  >
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
