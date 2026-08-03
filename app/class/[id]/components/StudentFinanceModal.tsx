import { useEffect } from 'react';
import {
  App,
  Modal,
  InputNumber,
  Form,
  Row,
  Col,
} from 'antd';
import { useUpdateClassStudent } from '@/lib/hooks/use-classes';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import styles from './components.module.scss';

interface StudentFinanceModalProps {
  open: boolean;
  student: any | null;
  classId: string;
  courseFee: number;
  onClose: () => void;
}

export function StudentFinanceModal({
  open,
  student,
  classId,
  courseFee,
  onClose,
}: StudentFinanceModalProps) {
  const { message } = App.useApp();
  const updateStudentMutation = useUpdateClassStudent(classId);
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && student) {
      form.setFieldsValue({
        paid_amount: student.paid_amount || 0,
        debt_amount:
          student.debt_amount !== undefined && student.debt_amount !== null
            ? student.debt_amount
            : courseFee - (student.paid_amount || 0),
      });
    }
  }, [open, student, courseFee, form]);

  const handleUpdateFinance = async () => {
    if (!student) return;
    try {
      const values = await form.validateFields();
      updateStudentMutation.mutate(
        {
          studentId: student.id,
          data: {
            paid_amount: values.paid_amount,
            debt_amount: values.debt_amount,
          },
        },
        {
          onSuccess: () => {
            message.success('Cập nhật tài chính thành công!');
            onClose();
          },
          onError: (error: unknown) => {
            message.error(getErrorMessage(error, 'Lỗi cập nhật'));
          },
        },
      );
    } catch (error) {
      console.error('Validation Failed:', error);
    }
  };

  return (
    <Modal
      title="Quản lý Tài chính"
      open={open}
      onCancel={onClose}
      onOk={handleUpdateFinance}
      confirmLoading={updateStudentMutation.isPending}
      okText="Lưu thông tin"
      cancelText="Hủy"
      destroyOnHidden
      centered
      width={700}
    >
      <div style={{ padding: '16px 0' }}>
        <Form layout="vertical" form={form}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Đã nộp (VND)"
                name="paid_amount"
                rules={[{ required: true, message: 'Vui lòng nhập số tiền đã nộp!' }]}
              >
                <InputNumber
                  className={styles.fullWidth}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '') as any}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Công nợ (VND)"
                name="debt_amount"
                rules={[{ required: true, message: 'Vui lòng nhập công nợ!' }]}
              >
                <InputNumber
                  className={styles.fullWidth}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/,/g, '') as any}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  );
}
