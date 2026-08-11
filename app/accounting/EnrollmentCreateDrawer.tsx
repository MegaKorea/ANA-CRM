'use client';

import { useState } from 'react';
import { App, Button, Drawer, Divider, Form, Space, Tag, Typography } from 'antd';
import { UserOutlined, PhoneOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Lead } from '@/lib/services/lead.service';
import { LeadStatusLabel } from '@/app/lead/constants';
import { PaymentMethod } from '@/constants/enums';
import { useCreateEnrollment } from '@/lib/hooks/use-enrollments';
import { useCreatePaymentTicket } from '@/lib/hooks/use-payment-tickets';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { getLatestNoteContent } from '@/lib/utils/notes';
import { LeadPicker } from './LeadPicker';
import { EnrollmentFormFields } from './EnrollmentFormFields';
import type { EnrollmentFormValues } from './enrollment-form-types';

interface EnrollmentCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  preselectLead?: Lead | null;
}

export function EnrollmentCreateDrawer({ open, onClose, preselectLead }: EnrollmentCreateDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<EnrollmentFormValues>();
  const [lead, setLead] = useState<Lead | null>(null);
  const createEnrollment = useCreateEnrollment();
  const createPaymentTicket = useCreatePaymentTicket();
  const { user } = useCurrentUser();

  const handleSelectLead = (nextLead: Lead) => {
    setLead(nextLead);
    form.resetFields();

    form.setFieldsValue({
      enrollment_date: nextLead.appointment_date ? dayjs(nextLead.appointment_date) : dayjs(),
      deposit_payment_method: PaymentMethod.CASH,
      category: 'khóa học',
      course_id: nextLead.course_ids?.[0] ?? undefined,
      tuition_fee: nextLead.tuition_fee ?? undefined,
      note: getLatestNoteContent(nextLead.note),
    });
  };

  const handleAfterOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (preselectLead) handleSelectLead(preselectLead);
      return;
    }
    setLead(null);
    form.resetFields();
  };

  const handleSubmit = async (values: EnrollmentFormValues) => {
    if (!lead) {
      message.warning('Vui lòng chọn học viên');
      return;
    }

    const isCourseCategory = values.category === 'khóa học';

    let enrollment;
    try {
      enrollment = await createEnrollment.mutateAsync({
        lead_id: lead.id,
        category: values.category,
        course_id: isCourseCategory ? values.course_id : undefined,
        class_id: isCourseCategory ? values.class_id : undefined,
        item_name: isCourseCategory ? undefined : values.item_name,
        enrollment_date: values.enrollment_date.toISOString(),
        sales_month: values.enrollment_date.format('YYYY-MM'),
        source: values.source,
        expected_study_month: values.expected_study_month ? values.expected_study_month.toISOString() : undefined,
        tuition_fee: values.tuition_fee,
        deposit_amount: values.deposit_amount,
        note: values.note,
        debt_note: values.debt_note,
        created_by: values.created_by || user?.id,
      });
    } catch {
      message.error('Tạo đăng ký thất bại');
      return;
    }

    if (values.deposit_amount && values.deposit_amount > 0) {
      try {
        await createPaymentTicket.mutateAsync({
          lead_id: lead.id,
          enrollment_id: enrollment.id,
          course_id: isCourseCategory ? values.course_id : undefined,
          amount: values.deposit_amount,
          payment_method: values.deposit_payment_method || PaymentMethod.CASH,
          recipient_account: values.deposit_recipient_account,
          payment_date: values.enrollment_date.toISOString(),
          note: 'Tiền cọc lúc đăng ký',
          created_by: values.created_by || user?.id,
          status: 'approved',
        });
      } catch {
        message.warning(
          'Tạo đăng ký thành công nhưng ghi nhận tiền cọc thất bại — vào tab Phiếu thu để thêm thủ công',
        );
        onClose();
        return;
      }
    }

    message.success('Tạo đăng ký thành công');
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      afterOpenChange={handleAfterOpenChange}
      title="Thêm đăng ký"
      size={640}
      destroyOnHidden
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={createEnrollment.isPending} onClick={() => form.submit()}>
            Tạo đăng ký
          </Button>
        </Space>
      }
    >
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        HỌC VIÊN
      </Typography.Text>

      {lead ? (
        <Space align="center" size={12} wrap>
          <Space size={6}>
            <UserOutlined style={{ color: '#1890ff' }} />
            <Typography.Text strong style={{ fontSize: 16 }}>
              {lead.full_name}
            </Typography.Text>
          </Space>
          {lead.phone_number && (
            <Space size={6}>
              <PhoneOutlined style={{ color: '#52c41a' }} />
              <Typography.Text type="secondary">{lead.phone_number}</Typography.Text>
            </Space>
          )}
          {lead.appointment_date && (
            <Space size={6}>
              <CalendarOutlined style={{ color: '#faad14' }} />
              <Typography.Text type="secondary">
                {dayjs(lead.appointment_date).format('DD/MM/YYYY')}
              </Typography.Text>
            </Space>
          )}
          <Tag color="geekblue">{LeadStatusLabel[lead.status]}</Tag>
          <Button size="small" onClick={() => setLead(null)}>
            Đổi học viên
          </Button>
        </Space>
      ) : (
        <LeadPicker onSelect={handleSelectLead} style={{ width: '100%' }} />
      )}

      <Divider />

      <Form<EnrollmentFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          enrollment_date: dayjs(),
          deposit_payment_method: PaymentMethod.CASH,
          category: 'khóa học',
        }}
      >
        <EnrollmentFormFields form={form} columns={2} showDepositPaymentMethod />
      </Form>
    </Drawer>
  );
}
