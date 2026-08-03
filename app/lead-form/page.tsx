'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Result, Select, Typography } from 'antd';
import { LeadStatus } from '@/constants/enums';
import { LEAD_STATUS_OPTIONS } from '@/app/lead/constants/labels';

const { Title, Paragraph } = Typography;

const YEAR_OPTIONS = Array.from({ length: 100 }, (_, index) => {
  const year = new Date().getFullYear() - index;
  return { value: year.toString(), label: String(year) };
});

const DUPLICATE_CHECK_FIELDS = ['full_name', 'phone_number'];

interface LeadFormValues {
  full_name: string;
  phone_number: string;
  date_of_birth?: string;
  status?: LeadStatus;
  note?: string;
}

interface SmaxCustomer {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  gender?: string;
  gid?: string;
  picture?: string;
  [key: string]: unknown;
}

interface DuplicateLead {
  id: number;
  full_name: string;
  phone_number: string | null;
  status?: LeadStatus | null;
}

const SM_FORM_CUSTOMER = '__SM_FORM_CUSTOMER';

function getIntegrationId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  return params.get('integration_id') ?? undefined;
}

export default function LeadFormPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<LeadFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [wasUpdate, setWasUpdate] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateLead | null>(null);
  const smaxLogRef = useRef<SmaxCustomer | null>(null);

  useEffect(() => {
    function getParentOrigin(): string {
      try {
        if (document.referrer) {
          return new URL(document.referrer).origin;
        }
      } catch {
        // ignore invalid referrer
      }
      return '*';
    }

    function handleMessage(event: MessageEvent) {
      // Only accept embed parent traffic — ignore other frames/extensions.
      if (window.parent !== window && event.source !== window.parent) return;

      const data = event.data;
      if (typeof data !== 'object' || data === null) return;
      if ((data as { name?: string }).name !== SM_FORM_CUSTOMER) return;

      const customer = (data as { data?: { customer?: SmaxCustomer } }).data?.customer;
      if (!customer) return;

      smaxLogRef.current = customer;
      form.setFieldsValue({
        full_name: customer.name || undefined,
        phone_number: customer.phone || undefined,
      });
    }

    window.addEventListener('message', handleMessage, false);

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { name: SM_FORM_CUSTOMER, data: { integration_id: getIntegrationId() } },
        getParentOrigin(),
      );
    }

    return () => window.removeEventListener('message', handleMessage, false);
  }, [form]);

  const submitLead = useCallback(
    async (values: LeadFormValues, leadId?: number) => {
      setSubmitting(true);
      try {
        const response = await fetch('/api/lead-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: values.full_name,
            phone_number: values.phone_number,
            date_of_birth: values.date_of_birth,
            status: values.status,
            note: values.note?.trim() || undefined,
            smax_log: smaxLogRef.current ?? undefined,
            lead_id: leadId,
          }),
        });

        const result = await response.json().catch(() => null);

        if (
          response.status === 409 &&
          result?.code === 'DUPLICATE_LEAD' &&
          result?.existing
        ) {
          const existing = result.existing as DuplicateLead;
          setDuplicate(existing);
          if (existing.status) {
            form.setFieldsValue({ status: existing.status });
          }
          message.warning('Thông tin đã tồn tại trong hệ thống.');
          return;
        }

        if (!response.ok || !result?.success) {
          throw new Error('REQUEST_FAILED');
        }

        setWasUpdate(Boolean(result.updated));
        setSubmitted(true);
        setDuplicate(null);
        form.resetFields();
        smaxLogRef.current = null;
      } catch {
        message.error('Lưu thông tin thất bại. Vui lòng thử lại.');
      } finally {
        setSubmitting(false);
      }
    },
    [form, message]
  );

  const handleSubmit = useCallback(
    (values: LeadFormValues) => {
      if (duplicate) {
        void submitLead(values, duplicate.id);
      } else {
        void submitLead(values);
      }
    },
    [duplicate, submitLead]
  );

  const handleValuesChange = useCallback((changedValues: Partial<LeadFormValues>) => {
    const touchedDuplicateField = Object.keys(changedValues).some((field) =>
      DUPLICATE_CHECK_FIELDS.includes(field)
    );
    if (touchedDuplicateField) {
      setDuplicate((prev) => (prev ? null : prev));
    }
  }, []);

  const handleReset = useCallback(() => {
    setSubmitted(false);
    setDuplicate(null);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: '#f5f5f5',
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }}>
        {submitted ? (
          <Result
            status="success"
            title={wasUpdate ? 'Cập nhật lead thành công!' : 'Tạo lead thành công!'}
            subTitle={
              wasUpdate
                ? 'Thông tin lead đã được cập nhật trong hệ thống.'
                : 'Lead mới đã được thêm vào hệ thống.'
            }
            extra={
              <Button type="primary" onClick={handleReset}>
                Nhập lead khác
              </Button>
            }
          />
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ marginBottom: 8 }}>
                Nhập thông tin Lead
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Nhập họ tên và số điện thoại khách hàng để tạo lead trong hệ thống.
              </Paragraph>
            </div>

            {duplicate && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Thông tin đã tồn tại"
                description={
                  <span>
                    Đã có lead trùng họ tên hoặc số điện thoại:{' '}
                    <b>{duplicate.full_name}</b>
                    {duplicate.phone_number ? ` — ${duplicate.phone_number}` : ''}.
                    <br />
                    Nhấn <b>Cập nhật</b> để cập nhật lead này bằng thông tin vừa nhập,
                    hoặc sửa lại họ tên và số điện thoại để tạo lead mới.
                  </span>
                }
              />
            )}

            <Form<LeadFormValues>
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onValuesChange={handleValuesChange}
              requiredMark={false}
              initialValues={{ status: LeadStatus.NEW }}
            >
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input placeholder="Nhập họ và tên khách hàng" size="large" allowClear />
              </Form.Item>

              <Form.Item
                name="phone_number"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  {
                    pattern: /^(0|\+84)\d{9,10}$/,
                    message: 'Số điện thoại không hợp lệ',
                  },
                ]}
              >
                <Input placeholder="Nhập số điện thoại khách hàng" size="large" allowClear />
              </Form.Item>

              <Form.Item name="date_of_birth" label="Năm sinh">
                <Select
                  placeholder="Chọn năm sinh"
                  size="large"
                  allowClear
                  showSearch={{ optionFilterProp: 'label' }}
                  options={YEAR_OPTIONS}
                />
              </Form.Item>

              <Form.Item name="status" label="Trạng thái">
                <Select size="large" options={LEAD_STATUS_OPTIONS} />
              </Form.Item>

              <Form.Item name="note" label="Ghi chú">
                <Input.TextArea
                  placeholder="Nhập ghi chú về khách hàng (tùy chọn)"
                  rows={3}
                  maxLength={1000}
                  showCount
                  allowClear
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={submitting}
                  danger={Boolean(duplicate)}
                >
                  {duplicate ? 'Cập nhật' : 'Lưu thông tin'}
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
}
