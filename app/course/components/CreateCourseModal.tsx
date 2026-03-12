import { Col, Form, Input, InputNumber, message, Modal, Row, Select } from 'antd';
import { useCreateCourse } from '@/lib/hooks/use-courses';
import type { CreateCourseInput } from '@/lib/validators/course.validator';
import { formatIntegerInput, parseIntegerInput } from '@/lib/utils/numberFormat';

interface CreateCourseModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCourseModal({ open, onClose }: CreateCourseModalProps) {
  const [form] = Form.useForm<CreateCourseInput>();
  const createCourseMutation = useCreateCourse();

  const handleClose = () => {
    onClose();
    form.resetFields();
  };

  const handleCreate = async (values: CreateCourseInput) => {
    createCourseMutation.mutate(values, {
      onSuccess: () => {
        message.success('Tạo khóa học thành công!');
        handleClose();
      },
      onError: (error) => {
        message.error('Lỗi khi tạo khóa học: ' + error.message);
      },
    });
  };

  return (
    <Modal
      centered
      title="Tạo mới Khóa học"
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      confirmLoading={createCourseMutation.isPending}
      width={800}
    >
      <Form form={form} layout="vertical" onFinish={handleCreate}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="code" label="Mã khóa học">
              <Input placeholder="VD: IELTS-01" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Tên khóa học"
              rules={[{ required: true, message: 'Vui lòng nhập tên khóa học' }]}
            >
              <Input placeholder="VD: Tiếng Anh giao tiếp" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Mô tả chi tiết">
          <Input.TextArea rows={3} placeholder="Mô tả chi tiết mục tiêu, đối tượng khóa học..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fee"
              label="Học phí"
              rules={[{ required: true, message: 'Vui lòng nhập học phí' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={100000}
                placeholder="VD: 5.000.000"
                formatter={formatIntegerInput}
                parser={parseIntegerInput}
                suffix="VNĐ"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="level" label="Cấp độ">
              <Select
                placeholder="Chọn cấp độ"
                allowClear
                options={[
                  { value: 'beginner', label: 'Sơ cấp' },
                  { value: 'intermediate', label: 'Trung cấp' },
                  { value: 'advanced', label: 'Cao cấp' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="expected_students" label="Sĩ số tiêu chuẩn">
              <InputNumber style={{ width: '100%' }} min={1} placeholder="VD: 15" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="expected_duration" label="Thời lượng dự kiến">
              <Input placeholder="VD: 3 tháng, 20 buổi" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
