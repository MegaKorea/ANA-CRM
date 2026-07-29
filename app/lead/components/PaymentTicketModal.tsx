'use client';

import { useState } from 'react';
import {
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Input,
  Upload,
  Button,
  message,
  Image,
} from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Lead } from '@/lib/services/lead.service';
import { PaymentType } from '@/constants/enums';
import { useCreatePaymentTicket } from '@/lib/hooks/use-payment-tickets';
import { formatIntegerInput, parseIntegerInput } from '@/lib/utils/numberFormat';

const PaymentTypeLabel: Record<PaymentType, string> = {
  [PaymentType.CASH]: 'Tiền mặt',
  [PaymentType.BANK_TRANSFER]: 'Chuyển khoản',
  [PaymentType.MOMO]: 'Momo',
  [PaymentType.OTHER]: 'Khác',
};

interface PaymentTicketModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

interface TicketFormValues {
  amount: number;
  payment_type: PaymentType;
  payment_date: dayjs.Dayjs;
  note?: string;
}

export function PaymentTicketModal({ open, lead, onClose }: PaymentTicketModalProps) {
  const [form] = Form.useForm<TicketFormValues>();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const createTicket = useCreatePaymentTicket();

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        setImages((prev) => [...prev, json.data.url]);
        message.success('Upload thành công');
      } else {
        message.error('Upload thất bại');
      }
    } catch {
      message.error('Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: TicketFormValues) => {
    if (!lead) return;

    createTicket.mutate(
      {
        lead_id: lead.id,
        amount: values.amount,
        payment_type: values.payment_type,
        payment_date: values.payment_date.toISOString(),
        images,
        note: values.note,
      },
      {
        onSuccess: () => {
          message.success('Tạo phiếu thu thành công');
          form.resetFields();
          setImages([]);
          onClose();
        },
        onError: () => {
          message.error('Tạo phiếu thu thất bại');
        },
      }
    );
  };

  const handleClose = () => {
    form.resetFields();
    setImages([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      centered
      title={`Tạo phiếu thu — ${lead?.full_name || ''}`}
      onCancel={handleClose}
      onOk={() => form.submit()}
      okText="Tạo phiếu thu"
      cancelText="Hủy"
      confirmLoading={createTicket.isPending}
      width={560}
      destroyOnHidden
    >
      <Form<TicketFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          payment_type: PaymentType.CASH,
          payment_date: dayjs(),
        }}
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
          name="payment_type"
          label="Loại hình thanh toán"
          rules={[{ required: true, message: 'Vui lòng chọn loại thanh toán' }]}
        >
          <Select
            options={Object.values(PaymentType).map((type) => ({
              label: PaymentTypeLabel[type],
              value: type,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="payment_date"
          label="Ngày thanh toán"
          rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            format="DD/MM/YYYY HH:mm"
          />
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
                      background: 'rgba(255,255,255,0.9)',
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
