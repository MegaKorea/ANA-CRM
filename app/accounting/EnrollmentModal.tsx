'use client';

import { useEffect, useMemo } from 'react';
import { App, Modal, Form } from 'antd';
import dayjs from 'dayjs';
import type { Enrollment } from '@/lib/services/enrollment.service';
import type { PaymentMethod } from '@/constants/enums';
import { useUpdateEnrollment } from '@/lib/hooks/use-enrollments';
import {
  useCreatePaymentTicket,
  usePaymentTicketsByLead,
  useUpdatePaymentTicket,
} from '@/lib/hooks/use-payment-tickets';
import { EnrollmentFormFields } from './EnrollmentFormFields';
import type { EnrollmentFormValues } from './enrollment-form-types';

interface EnrollmentModalProps {
  open: boolean;
  leadName?: string | null;
  enrollment: Enrollment | null;
  onClose: () => void;
}

const DEPOSIT_TICKET_NOTE = 'Tiền cọc lúc đăng ký';

export function EnrollmentModal({ open, leadName, enrollment, onClose }: EnrollmentModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<EnrollmentFormValues>();
  const updateEnrollment = useUpdateEnrollment();
  const updatePaymentTicket = useUpdatePaymentTicket();
  const createPaymentTicket = useCreatePaymentTicket();
  const { data: leadTickets } = usePaymentTicketsByLead(enrollment?.lead_id);

  const depositTicket = useMemo(() => {
    if (!enrollment || !leadTickets) return null;
    const linked = leadTickets.filter((t) => t.enrollment_id === enrollment.id);
    if (linked.length === 0) return null;
    return (
      linked.find((t) => t.note === DEPOSIT_TICKET_NOTE) ??
      linked.reduce((earliest, t) =>
        (t.created_at ?? '') < (earliest.created_at ?? '') ? t : earliest
      )
    );
  }, [enrollment, leadTickets]);

  useEffect(() => {
    if (!open || !enrollment) return;

    form.setFieldsValue({
      category: enrollment.category as EnrollmentFormValues['category'],
      course_id: enrollment.course_id ?? undefined,
      class_id: enrollment.class_id ?? undefined,
      item_name: enrollment.item_name ?? undefined,
      enrollment_date: dayjs(enrollment.enrollment_date),
      source: enrollment.source ?? undefined,
      expected_study_month: enrollment.expected_study_month ? dayjs(enrollment.expected_study_month) : undefined,
      tuition_fee: enrollment.tuition_fee,
      deposit_amount: depositTicket?.amount ?? enrollment.deposit_amount,
      deposit_payment_method: depositTicket?.payment_method as PaymentMethod | undefined,
      deposit_recipient_account: depositTicket?.recipient_account ?? undefined,
      note: enrollment.note ?? undefined,
      debt_note: enrollment.debt_note ?? undefined,
      created_by: enrollment.created_by ?? undefined,
    });
  }, [open, enrollment, depositTicket, form]);

  const handleSubmit = async (values: EnrollmentFormValues) => {
    if (!enrollment) return;

    const isCourseCategory = values.category === 'khóa học';

    try {
      await updateEnrollment.mutateAsync({
        id: enrollment.id,
        input: {
          category: values.category,
          course_id: isCourseCategory ? values.course_id : null,
          class_id: isCourseCategory ? (values.class_id ?? null) : null,
          item_name: isCourseCategory ? null : (values.item_name ?? null),
          enrollment_date: values.enrollment_date.toISOString(),
          source: values.source ?? null,
          expected_study_month: values.expected_study_month ? values.expected_study_month.toISOString() : null,
          tuition_fee: values.tuition_fee,
          deposit_amount: values.deposit_amount,
          note: values.note ?? null,
          debt_note: values.debt_note ?? null,
          created_by: values.created_by ?? null,
        },
      });
    } catch {
      message.error('Cập nhật đăng ký thất bại');
      return;
    }

    if (values.deposit_amount && values.deposit_amount > 0) {
      if (depositTicket) {
        try {
          await updatePaymentTicket.mutateAsync({
            id: depositTicket.id,
            input: {
              amount: values.deposit_amount,
              payment_method: values.deposit_payment_method,
              recipient_account: values.deposit_recipient_account ?? null,
            },
          });
        } catch {
          message.warning('Đã cập nhật đăng ký nhưng cập nhật phiếu thu tiền cọc thất bại');
          onClose();
          return;
        }
      } else if (values.deposit_payment_method) {
        try {
          await createPaymentTicket.mutateAsync({
            lead_id: enrollment.lead_id,
            enrollment_id: enrollment.id,
            course_id: isCourseCategory ? values.course_id : undefined,
            amount: values.deposit_amount,
            payment_method: values.deposit_payment_method,
            recipient_account: values.deposit_recipient_account,
            payment_date: values.enrollment_date.toISOString(),
            note: 'Bổ sung phiếu thu cho dữ liệu cũ',
            created_by: values.created_by,
            status: 'approved',
          });
        } catch {
          message.warning('Đã cập nhật đăng ký nhưng tạo phiếu thu thất bại');
          onClose();
          return;
        }
      }
    }

    message.success('Cập nhật đăng ký thành công');
    onClose();
  };

  return (
    <Modal
      open={open}
      centered
      title={`Sửa đăng ký — ${leadName || ''}`}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={updateEnrollment.isPending || updatePaymentTicket.isPending || createPaymentTicket.isPending}
      width={560}
      destroyOnHidden
    >
      <Form<EnrollmentFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
        <EnrollmentFormFields form={form} showDepositPaymentMethod />
      </Form>
    </Modal>
  );
}
