import { Form, Input, InputNumber, Select, Modal, Row, Col, message } from 'antd';
import { useCreateClass } from '@/lib/hooks/use-classes';
import { useCourses } from '@/lib/hooks/use-courses';
import type { CreateClassInput } from '@/lib/validators/class.validator';

const { Option } = Select;

interface CreateClassModalProps {
    open: boolean;
    onClose: () => void;
}

export function CreateClassModal({ open, onClose }: CreateClassModalProps) {
    const [form] = Form.useForm<CreateClassInput>();
    const createClassMutation = useCreateClass();
    const { data: courses, isLoading: isCoursesLoading } = useCourses();

    const handleClose = () => {
        onClose();
        form.resetFields();
    };

    const handleCreate = async (values: CreateClassInput) => {
        createClassMutation.mutate(values, {
            onSuccess: () => {
                message.success('Tạo lớp học thành công!');
                handleClose();
            },
            onError: (error: any) => {
                message.error('Lỗi khi tạo lớp học: ' + error.message);
            }
        });
    };

    return (
        <Modal
            centered
            title="Tạo mới Lớp học"
            open={open}
            onCancel={handleClose}
            onOk={() => form.submit()}
            confirmLoading={createClassMutation.isPending}
            width={800}
        >
            <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ status: 'planned' }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="code" label="Mã lớp học">
                            <Input placeholder="VD: IELTS-01-A" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="name" label="Tên lớp học" rules={[{ required: true, message: 'Vui lòng nhập tên lớp học' }]}>
                            <Input placeholder="VD: Lớp luyện IELTS K01" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="course_id" label="Khóa học" rules={[{ required: true, message: 'Vui lòng chọn khóa học' }]}>
                            <Select
                                placeholder="Chọn khóa học"
                                loading={isCoursesLoading}
                                allowClear
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {courses?.map((course) => (
                                    <Option key={course.id} value={course.id}>
                                        {course.name} {course.code ? `(${course.code})` : ''}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="capacity" label="Sĩ số (sức chứa)">
                            <InputNumber style={{ width: '100%' }} min={1} placeholder="VD: 20" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
                            <Select placeholder="Chọn trạng thái">
                                <Option value="planned">Sắp mở</Option>
                                <Option value="enrolling">Đang tuyển sinh</Option>
                                <Option value="in_progress">Đang học</Option>
                                <Option value="completed">Đã kết thúc</Option>
                                <Option value="cancelled">Đã hủy</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}
