'use client';

import { Modal, Select, Typography, Divider, Space, Form } from 'antd';
import { EditOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import type { ClassSession } from '@/lib/services/class_session.service';

dayjs.locale('vi');

const ROOM_OPTIONS = [
  { value: 'PHÒNG A', label: 'PHÒNG A' },
  { value: 'PHÒNG B', label: 'PHÒNG B' },
];

export interface EditSessionValues {
  teacher_id: string | null;
  room: string | null;
}

type Props = {
  open: boolean;
  session: ClassSession | null;
  teacherOptions: { value: string; label: string }[];
  isMobile: boolean;
  loading: boolean;
  onOk: (values: EditSessionValues) => void;
  onCancel: () => void;
};

export function EditSessionModal({
  open,
  session,
  teacherOptions,
  isMobile,
  loading,
  onOk,
  onCancel,
}: Props) {
  const { token } = theme.useToken();
  const [form] = Form.useForm<EditSessionValues>();

  return (
    <Modal
      title={
        <Space>
          <EditOutlined />
          <span>{session ? `Chỉnh sửa Buổi ${session.session_number}` : 'Chỉnh sửa buổi học'}</span>
          {session ? (
            <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
              — {dayjs(session.date).format('dddd, DD/MM/YYYY')}
            </Typography.Text>
          ) : null}
        </Space>
      }
      open={open}
      centered
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Lưu thay đổi"
      cancelText="Huỷ"
      destroyOnHidden
      width={isMobile ? '95vw' : 520}
    >
      {open && session ? (
        <Form
          key={session.id}
          form={form}
          layout="vertical"
          initialValues={{
            teacher_id: session.teacher_id,
            room: session.room || null,
          }}
          onFinish={onOk}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="room"
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <EnvironmentOutlined style={{ color: token.colorPrimary }} />
                Phòng học
              </span>
            }
          >
            <Select
              allowClear
              placeholder="Chọn phòng học..."
              options={ROOM_OPTIONS}
              size="middle"
            />
          </Form.Item>

          <Divider style={{ margin: '2px 0 18px' }} />

          <Form.Item
            name="teacher_id"
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <UserOutlined style={{ color: token.colorPrimary }} />
                Giáo viên phụ trách
              </span>
            }
          >
            <Select
              allowClear
              placeholder="Mặc định: Giáo viên chủ nhiệm"
              options={teacherOptions}
              size="middle"
            />
          </Form.Item>
        </Form>
      ) : null}
    </Modal>
  );
}
