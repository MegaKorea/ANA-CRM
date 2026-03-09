'use client';

import { useState } from 'react';
import { Button, Card, Col, Row, Typography, Space, Spin, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, BookOutlined } from '@ant-design/icons';
import { useCourses, useDeleteCourse } from '@/lib/hooks/use-courses';
import { CreateCourseModal } from './components/CreateCourseModal';
import { UpdateCourseModal } from './components/UpdateCourseModal';
import type { Course } from '@/lib/services/course.service';

const { Title, Text } = Typography;

export default function CoursePage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const { data: courses, isLoading } = useCourses();
    const { mutate: deleteCourse } = useDeleteCourse();

    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);

    const handleOpenUpdateModal = (course: Course) => {
        setSelectedCourse(course);
        setIsUpdateModalOpen(true);
    };

    const handleCloseUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setSelectedCourse(null);
    };

    const handleDelete = (id: string) => {
        deleteCourse(id, {
            onSuccess: () => {
                message.success('Xóa khóa học thành công');
            },
            onError: (error: any) => {
                message.error('Xóa khóa học thất bại: ' + error.message);
            }
        });
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center h-full items-center"><Spin size="large" /></div>;
    }

    return (
        <div className="p-6 h-full overflow-y-auto">
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>Danh sách Khóa học</Title>
                </Col>
                <Col>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal} size="large">
                        Tạo mới Khóa học
                    </Button>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                {courses?.length === 0 && (
                    <Col span={24}>
                        <div className="text-center py-10">
                            <Text type="secondary">Chưa có khóa học nào. Hãy tạo mới một khóa học.</Text>
                        </div>
                    </Col>
                )}
                {courses?.map((course) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                        <Card
                            hoverable
                            title={
                                <Space>
                                    <BookOutlined />
                                    {course.code || 'Chưa định danh'}
                                </Space>
                            }
                            extra={
                                <Tag color={course.status === 'active' ? 'green' : 'red'}>
                                    {course.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
                                </Tag>
                            }
                            actions={[
                                <Button key="edit" type="link" onClick={() => handleOpenUpdateModal(course)}>Chỉnh sửa</Button>,
                                <Popconfirm
                                    key="delete"
                                    title="Xóa khóa học"
                                    description="Bạn có chắc chắn muốn xóa khóa học này không?"
                                    onConfirm={() => handleDelete(course.id)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                >
                                    <Button type="link" danger>Xóa</Button>
                                </Popconfirm>
                            ]}
                            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                            bodyStyle={{ flex: 1 }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <Text strong style={{ fontSize: '16px' }}>{course.name}</Text>
                                {course.description && (
                                    <Text type="secondary" ellipsis={{ tooltip: course.description }}>
                                        {course.description}
                                    </Text>
                                )}
                                <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                                    <Text strong>Học phí: {course.fee?.toLocaleString()} đ</Text>
                                </div>
                                {course.expected_duration && (
                                    <div>
                                        <Text type="secondary">Thời gian: {course.expected_duration}</Text>
                                    </div>
                                )}
                                {course.level && (
                                    <div>
                                        <Text type="secondary">Cấp độ: {course.level}</Text>
                                    </div>
                                )}
                                {course.expected_students && (
                                    <div>
                                        <Text type="secondary">Sĩ số: {course.expected_students}</Text>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <CreateCourseModal open={isCreateModalOpen} onClose={handleCloseCreateModal} />
            <UpdateCourseModal open={isUpdateModalOpen} onClose={handleCloseUpdateModal} courseData={selectedCourse} />
        </div>
    );
}
