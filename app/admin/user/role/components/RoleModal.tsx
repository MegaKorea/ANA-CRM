'use client';

import { Modal, Form, Input, Button, Space } from 'antd';
import type { Role } from '@/lib/services/role.service';

interface RoleFormValues {
  name: string;
  code: string;
  description?: string;
}

interface RoleModalProps {
  open: boolean;
  editingRole: Role | null;
  form: ReturnType<typeof Form.useForm<RoleFormValues>>[0];
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void>;
}

export function RoleModal({
  open,
  editingRole,
  form,
  isLoading,
  onClose,
  onSubmit,
}: RoleModalProps) {
  return (
    <Modal
      title={editingRole ? 'Sửa vai trò' : 'Thêm vai trò'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          label="Tên vai trò"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
        >
          <Input placeholder="Nhập tên vai trò" />
        </Form.Item>

        <Form.Item
          label="Mã vai trò"
          name="code"
          rules={[{ required: true, message: 'Vui lòng nhập mã vai trò' }]}
        >
          <Input placeholder="Nhập mã vai trò" />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
        >
          <Input.TextArea
            rows={4}
            placeholder="Nhập mô tả (tùy chọn)"
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {editingRole ? 'Cập nhật' : 'Tạo mới'}
            </Button>
            <Button onClick={onClose}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
