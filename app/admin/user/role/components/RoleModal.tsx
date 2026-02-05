'use client';

import { Modal, Form, Input, Button, Space } from 'antd';
import type { Role } from '@/lib/services/role.service';
import { RolePageText } from '../constants';

export interface RoleFormValues {
  name: string;
  code: string;
  description?: string;
}

interface RoleModalProps {
  open: boolean;
  editingRole: Role | null;
  form: ReturnType<typeof Form.useForm<RoleFormValues>>[0];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void>;
}

export function RoleModal({
  open,
  editingRole,
  form,
  isSubmitting,
  onClose,
  onSubmit,
}: RoleModalProps) {
  return (
    <Modal
      open={open}
      title={editingRole ? RolePageText.MODAL_EDIT_TITLE : RolePageText.MODAL_CREATE_TITLE}
      onCancel={onClose}
      width={600}
      onOk={() => {
        form.submit();
      }}
      okButtonProps={{
        loading: isSubmitting,
      }}
      destroyOnHidden
      centered
    >
      <Form<RoleFormValues>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item<RoleFormValues>
          name="name"
          label={RolePageText.FIELD_NAME_LABEL}
          rules={[
            {
              required: true,
              message: RolePageText.FIELD_NAME_PLACEHOLDER,
            },
          ]}
        >
          <Input placeholder={RolePageText.FIELD_NAME_PLACEHOLDER} />
        </Form.Item>

        <Form.Item<RoleFormValues>
          name="code"
          label={RolePageText.FIELD_CODE_LABEL}
          rules={[
            {
              required: true,
              message: RolePageText.FIELD_CODE_PLACEHOLDER,
            },
          ]}
        >
          <Input placeholder={RolePageText.FIELD_CODE_PLACEHOLDER} />
        </Form.Item>

        <Form.Item<RoleFormValues>
          name="description"
          label={RolePageText.FIELD_DESCRIPTION_LABEL}
        >
          <Input.TextArea
            rows={4}
            placeholder={RolePageText.FIELD_DESCRIPTION_PLACEHOLDER}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
