'use client';

import { useMemo } from 'react';
import { Form, Select, DatePicker, InputNumber, Input, Row, Col, type FormInstance } from 'antd';
import { PaymentType } from '@/constants/enums';
import { useCourses } from '@/lib/hooks/use-courses';
import { useClasses } from '@/lib/hooks/use-classes';
import { useUsers } from '@/lib/hooks/use-users';
import { formatIntegerInput, parseIntegerInput } from '@/lib/utils/numberFormat';
import { PaymentTypeLabel } from './columns';
import type { EnrollmentFormValues } from './enrollment-form-types';

const ENROLLMENT_SOURCE_OPTIONS = ['Hotline', 'Facebook', 'Zalo', 'Khác'].map((value) => ({
  label: value,
  value,
}));

interface EnrollmentFormFieldsProps {
  form: FormInstance<EnrollmentFormValues>;
  columns?: 2 | 3;
  showDepositPaymentMethod?: boolean;
}

export function EnrollmentFormFields({
  form,
  columns = 2,
  showDepositPaymentMethod = false,
}: EnrollmentFormFieldsProps) {
  const { data: courses } = useCourses();
  const { data: classes } = useClasses();
  const { data: users } = useUsers();

  const courseOptions = useMemo(
    () => (courses ?? []).map((course) => ({ label: course.name, value: course.id })),
    [courses],
  );
  const userOptions = useMemo(
    () => (users ?? []).map((u) => ({ label: u.full_name || u.email, value: u.id })),
    [users],
  );

  const selectedCourseId = Form.useWatch('course_id', form);
  const classOptions = useMemo(
    () =>
      (classes ?? [])
        .filter((cls) => !selectedCourseId || cls.course_id === selectedCourseId)
        .map((cls) => ({ label: cls.name, value: cls.id })),
    [classes, selectedCourseId],
  );

  const depositAmount = Form.useWatch('deposit_amount', form);
  const depositPaymentType = Form.useWatch('deposit_payment_type', form);
  const showDepositMethodFields = showDepositPaymentMethod && !!depositAmount;

  const fieldSpan = columns === 3 ? 8 : 12;

  return (
    <Row gutter={[16, 0]}>
      <Col xs={24} sm={fieldSpan}>
        <Form.Item
          name="course_id"
          label="Khóa học"
          rules={[{ required: true, message: 'Vui lòng chọn khóa học' }]}
        >
          <Select
            showSearch
            placeholder="Chọn khóa học"
            options={courseOptions}
            filterOption={(input, option) =>
              (option?.label as string).toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Col>

      <Col xs={24} sm={fieldSpan}>
        <Form.Item name="class_id" label="Lớp (nếu đã xếp lớp)">
          <Select allowClear placeholder="Chưa xếp lớp" options={classOptions} />
        </Form.Item>
      </Col>

      <Col xs={24} sm={fieldSpan}>
        <Form.Item
          name="enrollment_date"
          label="Ngày đăng ký"
          rules={[{ required: true, message: 'Vui lòng chọn ngày đăng ký' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={fieldSpan}>
        <Form.Item name="tuition_fee" label="Học phí (VND)">
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            formatter={formatIntegerInput}
            parser={parseIntegerInput as never}
          />
        </Form.Item>
      </Col>

      <Col xs={24} sm={fieldSpan}>
        <Form.Item name="deposit_amount" label="Tiền cọc (VND)">
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            formatter={formatIntegerInput}
            parser={parseIntegerInput as never}
          />
        </Form.Item>
      </Col>

      {showDepositMethodFields && (
        <Col xs={24} sm={fieldSpan}>
          <Form.Item
            name="deposit_payment_type"
            label="Hình thức nhận cọc"
            rules={[{ required: true, message: 'Vui lòng chọn hình thức' }]}
          >
            <Select
              options={Object.values(PaymentType).map((type) => ({
                label: PaymentTypeLabel[type],
                value: type,
              }))}
            />
          </Form.Item>
        </Col>
      )}

      {showDepositMethodFields && depositPaymentType === PaymentType.BANK_TRANSFER && (
        <Col xs={24} sm={fieldSpan}>
          <Form.Item name="deposit_recipient_account" label="Tài khoản nhận cọc">
            <Input placeholder="Ví dụ: Lê Thị Toàn, hoặc tài khoản CTY" />
          </Form.Item>
        </Col>
      )}

      <Col xs={24} sm={fieldSpan}>
        <Form.Item name="source" label="Nguồn">
          <Select
            allowClear
            showSearch
            placeholder="Chọn nguồn"
            options={ENROLLMENT_SOURCE_OPTIONS}
          />
        </Form.Item>
      </Col>

      <Col xs={24} sm={fieldSpan}>
        <Form.Item name="expected_study_month" label="Thời điểm học dự kiến">
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" allowClear placeholder="Chọn ngày" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={fieldSpan}>
        <Form.Item name="created_by" label="Tư vấn viên">
          <Select
            allowClear
            showSearch
            placeholder="Chọn tư vấn viên"
            options={userOptions}
            filterOption={(input, option) =>
              (option?.label as string).toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Col>

      <Col span={24}>
        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={2} placeholder="Ghi chú (tuỳ chọn)" />
        </Form.Item>
      </Col>
    </Row>
  );
}
