import { Button, Col, DatePicker, Form, Input, InputNumber, message, Row, Select, Space } from 'antd';
import { useUpdateClass } from '@/lib/hooks/use-classes';
import { useCourses } from '@/lib/hooks/use-courses';
import type { Class } from '@/lib/services/class.service';
import type { UpdateClassInput } from '@/lib/validators/class.validator';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { CLASS_STATUS_OPTIONS } from '@/lib/constants/classStatus';

type ClassBasicInfoFormValues = Omit<UpdateClassInput, 'start_date' | 'end_date' | 'schedule'> & {
    start_date?: Dayjs | null;
    end_date?: Dayjs | null;
    schedule?: Dayjs | null;
    timetable?: 'Sáng' | 'Chiều' | 'Tối' | null;
};

export function TabBasicInfo({ classData }: { classData: Class }) {
    const [form] = Form.useForm<ClassBasicInfoFormValues>();
    const updateClassMutation = useUpdateClass();
    const { data: courses, isLoading: isCoursesLoading } = useCourses();
    const [isEditing, setIsEditing] = useState(false);

    const initialFormValues = useMemo<ClassBasicInfoFormValues>(
        () => ({
            code: classData.code,
            name: classData.name,
            course_id: classData.course_id,
            capacity: classData.capacity,
            status: classData.status as any,
            start_date: classData.start_date ? dayjs(classData.start_date) : null,
            end_date: classData.end_date ? dayjs(classData.end_date) : null,
            schedule: classData.schedule ? dayjs(classData.schedule) : null,
            timetable: classData.timetable,
        }),
        [
            classData.capacity,
            classData.code,
            classData.course_id,
            classData.end_date,
            classData.name,
            classData.schedule,
            classData.start_date,
            classData.status,
            classData.timetable,
        ]
    );

    useEffect(() => {
        form.setFieldsValue(initialFormValues);
    }, [form, initialFormValues]);

    const handleUpdate = async (values: ClassBasicInfoFormValues) => {
        const normalizedValues: UpdateClassInput = {
            ...values,
            start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
            end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
            schedule: values.schedule ? values.schedule.format('YYYY-MM-DD') : null,
            timetable: values.timetable,
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
                            <Select placeholder="Chọn trạng thái" options={CLASS_STATUS_OPTIONS} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="schedule" label="Lịch mở lớp">
                            <DatePicker style={{ width: '100%' }} placeholder="Chọn ngày mở lớp" format="DD/MM/YYYY" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="timetable" label="Thời khóa biểu">
                            <Select placeholder="Chọn buổi học" allowClear options={[
                                { label: 'Sáng', value: 'Sáng' },
                                { label: 'Chiều', value: 'Chiều' },
                                { label: 'Tối', value: 'Tối' },
                            ]} />
                        </Form.Item>
                    </Col>
                </Row>

            </Form>

            <Row justify="end" style={{ marginTop: 24, paddingBottom: 24 }}>
                {isEditing ? (
                    <Space>
                        <Button
                            htmlType="button"
                            onClick={() => {
                                setIsEditing(false);
                                form.setFieldsValue(initialFormValues);
                            }}
                        >
                            Hủy bỏ
                        </Button>
                        <Button type="primary" onClick={() => form.submit()} loading={updateClassMutation.isPending}>
                            Lưu thay đổi
                        </Button>
                    </Space>
                ) : (
                    <Button type="primary" onClick={() => setIsEditing(true)}>
                        Sửa thông tin
                    </Button>
                )}
            </Row>
        </div>
    );
}
