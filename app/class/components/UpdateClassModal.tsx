import { Col, Form, Input, InputNumber, message, Modal, Row, Select } from 'antd';
import { useUpdateClass } from '@/lib/hooks/use-classes';
import { useCourses } from '@/lib/hooks/use-courses';
import type { Class } from '@/lib/services/class.service';
import type { UpdateClassInput } from '@/lib/validators/class.validator';
import { useEffect } from 'react';
import { CLASS_STATUS_OPTIONS } from '@/lib/constants/classStatus';

interface UpdateClassModalProps {
    open: boolean;
    onClose: () => void;
    classData: Class | null;
}

export function UpdateClassModal({ open, onClose, classData }: UpdateClassModalProps) {
    const [form] = Form.useForm<UpdateClassInput>();
    const updateClassMutation = useUpdateClass();
    const { data: courses, isLoading: isCoursesLoading } = useCourses();

    useEffect(() => {
        if (open && classData) {
            form.setFieldsValue({
                code: classData.code,
                name: classData.name,
                course_id: classData.course_id,
                capacity: classData.capacity,
                status: classData.status as any,
            });
        }
    }, [open, classData, form]);

    const handleClose = () => {
        onClose();
        form.resetFields();
    };

    const handleUpdate = async (values: UpdateClassInput) => {
        if (!classData) return;

        updateClassMutation.mutate({ id: classData.id, data: values }, {
            onSuccess: () => {
                message.success('Cập nhật lớp học thành công!');
                handleClose();
            },
            onError: (error: any) => {
                message.error('Lỗi khi cập nhật lớp học: ' + error.message);
            }
        });
    };

    return (
        <Modal
            centered
            title="Sửa Lớp học"
            open={open}
            onCancel={handleClose}
            onOk={() => form.submit()}
            confirmLoading={updateClassMutation.isPending}
            width={800}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleUpdate}>
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
                                optionFilterProp="label"
                                options={(courses ?? []).map((course) => ({
                                    value: course.id,
                                    label: `${course.name}${course.code ? ` (${course.code})` : ''}`,
                                }))}
                            />
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
                            <Select placeholder="Chọn trạng thái" options={CLASS_STATUS_OPTIONS} />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}
