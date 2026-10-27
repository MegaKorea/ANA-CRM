'use client';

import { useEffect, useRef, useState } from 'react';
import { App, Modal, Form, InputNumber, Select, DatePicker, Input, Upload, Button, Image } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Enrollment } from '@/lib/services/enrollment.service';
import { PaymentMethod } from '@/constants/enums';
import { useCreatePaymentTicket } from '@/lib/hooks/use-payment-tickets';
import { formatIntegerInput, parseIntegerInput } from '@/lib/utils/numberFormat';

const PaymentMethodLabel: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Tiền mặt',
  [PaymentMethod.BANK_PERSONAL]: 'Chuyển khoản - TK cá nhân',
  [PaymentMethod.BANK_COMPANY]: 'Chuyển khoản - TK công ty',
};

interface EnrollmentPaymentModalProps {
  open: boolean;
  enrollment: Enrollment | null;
  onClose: () => void;
}

interface PaymentFormValues {
  amount: number;
  payment_method: PaymentMethod;
  recipient_account?: string;
  payment_date: dayjs.Dayjs;
  note?: string;
}

export function EnrollmentPaymentModal({ open, enrollment, onClose }: EnrollmentPaymentModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PaymentFormValues>();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const createTicket = useCreatePaymentTicket();
  const isMountedRef = useRef(true);
  const paymentMethod = Form.useWatch('payment_method', form);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setImages([]);
  }, [open, form]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (!isMountedRef.current) return;
      if (json.success && json.data?.url) {
        setImages((prev) => [...prev, json.data.url]);
        message.success('Upload thành công');
      } else {
        message.error('Upload thất bại');
      }
    } catch {
      if (isMountedRef.current) message.error('Upload thất bại');
    } finally {
      if (isMountedRef.current) setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (values: PaymentFormValues) => {
    if (!enrollment) return;

    createTicket.mutate(
      {
        lead_id: enrollment.lead_id,
        enrollment_id: enrollment.id,
        course_id: enrollment.course_id ?? undefined,
        amount: values.amount,
        payment_method: values.payment_method,
        recipient_account: values.recipient_account,
        payment_date: values.payment_date.toISOString(),
        images,
        note: values.note,
        status: 'approved',
      },
      {
        onSuccess: () => {
          message.success('Đã ghi nhận thu tiền');
          onClose();
        },
        onError: () => message.error('Tạo phiếu thu thất bại'),
      },
    );
  };

  return (
    <Modal
      open={open}
      centered
      title={`Thu tiền — ${enrollment?.lead_full_name || ''}`}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Tạo phiếu thu"
      cancelText="Hủy"
      confirmLoading={createTicket.isPending}
      width={520}
      destroyOnHidden
    >
      <Form<PaymentFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ payment_method: PaymentMethod.CASH, payment_date: dayjs() }}
      >
        <Form.Item
          name="amount"
          label="Số tiền (VND)"
          rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            placeholder="Nhập số tiền"
            formatter={formatIntegerInput}
            parser={parseIntegerInput as never}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="payment_method"
          label="Hình thức thanh toán"
          rules={[{ required: true, message: 'Vui lòng chọn hình thức' }]}
        >
          <Select
            options={Object.values(PaymentMethod).map((method) => ({
              label: PaymentMethodLabel[method],
              value: method,
            }))}
          />
        </Form.Item>

        {paymentMethod && paymentMethod !== PaymentMethod.CASH && (
          <Form.Item name="recipient_account" label="Tài khoản nhận tiền">
            <Input placeholder="Ví dụ: Lê Thị Toàn, hoặc tài khoản CTY" />
          </Form.Item>
        )}

        <Form.Item
          name="payment_date"
          label="Ngày thanh toán"
          rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
        </Form.Item>

        <Form.Item label="Ảnh chứng từ">
          <Upload
            beforeUpload={(file) => {
              handleUpload(file);
              return false;
            }}
            showUploadList={false}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              Chọn ảnh
            </Button>
          </Upload>
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <Image
                    src={url}
                    width={80}
                    height={80}
                    alt={`Chứng từ ${i + 1}`}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: 'var(--bg-surface)',
                      borderRadius: '50%',
                      padding: 2,
                      width: 22,
                      height: 22,
                      minWidth: 22,
                    }}
                    onClick={() => handleRemoveImage(i)}
                  />
                </div>
              ))}
            </div>
          )}
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={2} placeholder="Ghi chú (tuỳ chọn)" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
