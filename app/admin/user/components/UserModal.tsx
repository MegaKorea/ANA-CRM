'use client';

import { Modal, Form, Input, Select, DatePicker, InputNumber, Button, Row, Col, message } from 'antd';
import type { User } from '@/lib/services/user.service';
import type { Role } from '@/lib/services/role.service';
import { generateStrongPassword } from '@/lib/utils/password';
import { Sex, SexLabel, UserPageText } from '@/app/admin/user/constants';
import type { Dayjs } from 'dayjs';

export interface UserFormValues {
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  role_id: number;
  sex?: string;
  age?: number;
  address?: string;
  birth_day?: Dayjs;
}

interface UserModalProps {
  open: boolean;
  editingUser: User | null;
  form: ReturnType<typeof Form.useForm<UserFormValues>>[0];
  isSubmitting: boolean;
  roles: Role[] | undefined;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
}

export function UserModal({
  open,
  editingUser,
  form,
  isSubmitting,
  roles,
  onClose,
  onSubmit,
}: UserModalProps) {

  
  const handleGeneratePassword = () => {
    const password = generateStrongPassword();
    form.setFieldsValue({ password });
    message.success('Đã sinh mật khẩu mạnh');
  };

  return (
    <Modal
      open={open}
      title={editingUser ? UserPageText.MODAL_EDIT_TITLE : UserPageText.MODAL_CREATE_TITLE}
      onCancel={onClose}
      width={1000}
      onOk={() => {
        form.submit();
      }}
      okButtonProps={{
        loading: isSubmitting,
      }}
      destroyOnHidden
      centered
    >
      <Form<UserFormValues> form={form} layout="vertical" onFinish={onSubmit}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item<UserFormValues>
              name="full_name"
              label={UserPageText.FIELD_FULL_NAME_LABEL}
              rules={[
                {
                  required: true,
                  message: UserPageText.FIELD_FULL_NAME_PLACEHOLDER,
                },
              ]}
            >
              <Input placeholder={UserPageText.FIELD_FULL_NAME_PLACEHOLDER} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item<UserFormValues>
              name="email"
              label={UserPageText.FIELD_EMAIL_LABEL}
              rules={[
                {
                  required: true,
                  message: UserPageText.FIELD_EMAIL_PLACEHOLDER,
                },
                {
                  type: 'email',
                  message: 'Email không hợp lệ',
                },
              ]}
            >
              <Input placeholder={UserPageText.FIELD_EMAIL_PLACEHOLDER} type="email" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item<UserFormValues> name="phone" label={UserPageText.FIELD_PHONE_LABEL}>
              <Input placeholder={UserPageText.FIELD_PHONE_PLACEHOLDER} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item<UserFormValues> name="sex" label={UserPageText.FIELD_SEX_LABEL}>
              <Select
                placeholder={UserPageText.FIELD_SEX_PLACEHOLDER}
                options={
                  Object.values(Sex).map((sex) => ({
                    label: SexLabel[sex],
                    value: sex,
                  }))
                }
              />
            </Form.Item>
          </Col>

          {!editingUser && (
            <Col xs={24} md={12}>
              <Form.Item<UserFormValues> name="password" label={UserPageText.FIELD_PASSWORD_LABEL} required>
                <Input.Password
                  placeholder={UserPageText.FIELD_PASSWORD_PLACEHOLDER}
                  addonAfter={
                    <Button type="link" onClick={handleGeneratePassword}>
                      {UserPageText.BUTTON_GENERATE_PASSWORD}
                    </Button>
                  }
                />
              </Form.Item>
            </Col>
          )}

          <Col xs={24} md={24}>
            <Form.Item<UserFormValues> name="address" label={UserPageText.FIELD_ADDRESS_LABEL}>
              <Input.TextArea
                rows={3}
                placeholder={UserPageText.FIELD_ADDRESS_PLACEHOLDER}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item<UserFormValues>
              name="role_id"
              label={UserPageText.FIELD_ROLE_LABEL}
              rules={[
                {
                  required: true,
                  message: UserPageText.FIELD_ROLE_PLACEHOLDER,
                },
              ]}
            >
              <Select
                placeholder={UserPageText.FIELD_ROLE_PLACEHOLDER}
                options={
                  roles?.map((role) => ({
                    label: role.name,
                    value: role.id,
                  })) || []
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item<UserFormValues> name="age" label={UserPageText.FIELD_AGE_LABEL}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder={UserPageText.FIELD_AGE_PLACEHOLDER}
                min={0}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item<UserFormValues> name="birth_day" label={UserPageText.FIELD_BIRTH_DAY_LABEL}>
              <DatePicker
                style={{ width: '100%' }}
                placeholder={UserPageText.FIELD_BIRTH_DAY_PLACEHOLDER}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

