import { Form, Input, InputNumber, Select, Row, Col, Button, message, DatePicker, Space } from 'antd';
import { useUpdateClass } from '@/lib/hooks/use-classes';
import { useCourses } from '@/lib/hooks/use-courses';
import type { Class } from '@/lib/services/class.service';
import type { UpdateClassInput } from '@/lib/validators/class.validator';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export function TabBasicInfo({ classData }: { classData: Class }) {
    const [form] = Form.useForm<any>();
    const updateClassMutation = useUpdateClass();
    const { data: courses, isLoading: isCoursesLoading } = useCourses();
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (classData) {
            form.setFieldsValue({
                code: classData.code,
                name: classData.name,
                course_id: classData.course_id,
                capacity: classData.capacity,
                status: classData.status as any,
                start_date: classData.start_date ? dayjs(classData.start_date) : null,
                end_date: classData.end_date ? dayjs(classData.end_date) : null,
                schedule: classData.schedule,
            });
        }
    }, [classData, form]);

    const handleUpdate = async (values: any) => {
        if (!classData) return;
        const normalizedValues: UpdateClassInput = {
            ...values,
            start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
            end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        };
        updateClassMutation.mutate({ id: classData.id, data: normalizedValues }, {
            onSuccess: () => {
                message.success('Cập nhật thông tin cơ bản thành công!');
                setIsEditing(false);
            },
            onError: (error: any) => {
                message.error('Lỗi khi cập nhật lớp học: ' + error.message);
            }
        });
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 20 }}>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdate}
                disabled={!isEditing}
            >
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
                        <Form.Item name="start_date" label="Ngày bắt đầu">
                            <DatePicker style={{ width: '100%' }} placeholder="Chọn ngày bắt đầu" format="DD/MM/YYYY" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="end_date" label="Ngày kết thúc">
                            <DatePicker style={{ width: '100%' }} placeholder="Chọn ngày kết thúc" format="DD/MM/YYYY" />
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
                    <Col span={12}>
                        <Form.Item name="schedule" label="Thời khóa biểu (nháp)">
                            <Input placeholder="VD: 18h - 20h Thứ 3,5,7" />
                        </Form.Item>
                    </Col>
                </Row>

                {isEditing ? (
                    <Row justify="end" style={{ marginTop: 24, paddingBottom: 24 }}>
                        <Space>
                            <Button onClick={() => {
                                setIsEditing(false);
                                form.resetFields();
                            }}>
                                Hủy bỏ
                            </Button>
                            <Button type="primary" htmlType="submit" loading={updateClassMutation.isPending}>
                                Lưu thay đổi
                            </Button>
                        </Space>
                    </Row>
                ) : (
                    <Row justify="end" style={{ marginTop: 24, paddingBottom: 24 }}>
                        <Button type="primary" onClick={(e) => {
                            e.preventDefault();
                            setIsEditing(true);
                        }}>
                            Sửa thông tin
                        </Button>
                    </Row>
                )}
            </Form>
        </div>
    );
}
