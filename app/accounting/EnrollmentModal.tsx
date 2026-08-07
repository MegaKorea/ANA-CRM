'use client';

import { useEffect } from 'react';
import { App, Modal, Form } from 'antd';
import dayjs from 'dayjs';
import type { Enrollment } from '@/lib/services/enrollment.service';
import { useUpdateEnrollment } from '@/lib/hooks/use-enrollments';
import { EnrollmentFormFields } from './EnrollmentFormFields';
import type { EnrollmentFormValues } from './enrollment-form-types';

interface EnrollmentModalProps {
  open: boolean;
  leadName?: string | null;
  enrollment: Enrollment | null;
  onClose: () => void;
}

export function EnrollmentModal({ open, leadName, enrollment, onClose }: EnrollmentModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<EnrollmentFormValues>();
  const updateEnrollment = useUpdateEnrollment();

  useEffect(() => {
    if (!open || !enrollment) return;

    form.setFieldsValue({
      course_id: enrollment.course_id,
      class_id: enrollment.class_id ?? undefined,
      enrollment_date: dayjs(enrollment.enrollment_date),
      source: enrollment.source ?? undefined,
      expected_study_month: enrollment.expected_study_month ? dayjs(enrollment.expected_study_month) : undefined,
      tuition_fee: enrollment.tuition_fee,
      deposit_amount: enrollment.deposit_amount,
      status: enrollment.status,
      note: enrollment.note ?? undefined,
      debt_note: enrollment.debt_note ?? undefined,
      created_by: enrollment.created_by ?? undefined,
    });
  }, [open, enrollment, form]);

  const handleSubmit = (values: EnrollmentFormValues) => {
    if (!enrollment) return;

    updateEnrollment.mutate(
      {
        id: enrollment.id,
        input: {
          course_id: values.course_id,
          class_id: values.class_id ?? null,
          enrollment_date: values.enrollment_date.toISOString(),
          source: values.source ?? null,
          expected_study_month: values.expected_study_month ? values.expected_study_month.toISOString() : null,
          tuition_fee: values.tuition_fee,
          deposit_amount: values.deposit_amount,
          status: values.status,
          note: values.note ?? null,
          debt_note: values.debt_note ?? null,
          created_by: values.created_by ?? null,
        },
      },
      {
        onSuccess: () => {
          message.success('Cập nhật đăng ký thành công');
          onClose();
        },
        onError: () => message.error('Cập nhật đăng ký thất bại'),
      },
    );
  };

  return (
    <Modal
      open={open}
      centered
      title={`Sửa đăng ký khóa học — ${leadName || ''}`}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={updateEnrollment.isPending}
      width={560}
      destroyOnHidden
    >
      <Form<EnrollmentFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
        <EnrollmentFormFields form={form} />
      </Form>
    </Modal>
  );
}
