'use client';

import { useState, useMemo } from 'react';
import { Button, Card, Col, Row, Typography, Space, Spin, Tag, Popconfirm, message, Input, Select, Divider } from 'antd';
import { PlusOutlined, TeamOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useClasses, useDeleteClass } from '@/lib/hooks/use-classes';
import { useCourses } from '@/lib/hooks/use-courses';
import { useRouter } from 'next/navigation';
import { CreateClassModal } from './components/CreateClassModal';
import { UpdateClassModal } from './components/UpdateClassModal';
import type { Class } from '@/lib/services/class.service';

const { Title, Text } = Typography;
const { Option } = Select;

const statusColorMap: Record<string, string> = {
    planned: 'blue',
    enrolling: 'orange',
    in_progress: 'green',
    completed: 'purple',
    cancelled: 'red',
};

const statusTextMap: Record<string, string> = {
    planned: 'Sắp mở',
    enrolling: 'Đang tuyển sinh',
    in_progress: 'Đang học',
    completed: 'Đã kết thúc',
    cancelled: 'Đã hủy',
};

export default function ClassPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [courseFilter, setCourseFilter] = useState<string | null>(null);

    const router = useRouter();

    const { data: classes, isLoading: isClassesLoading } = useClasses();
    const { data: courses, isLoading: isCoursesLoading } = useCourses();
    const { mutate: deleteClassMutation } = useDeleteClass();

    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);

    const handleOpenUpdateModal = (classData: Class) => {
        setSelectedClass(classData);
        setIsUpdateModalOpen(true);
    };

    const handleCloseUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setSelectedClass(null);
    };

    const handleDelete = (id: string) => {
        deleteClassMutation(id, {
            onSuccess: () => {
                message.success('Xóa lớp học thành công');
            },
            onError: (error: any) => {
                message.error('Xóa lớp học thất bại: ' + error.message);
            }
        });
    };

    const filteredClasses = useMemo(() => {
        if (!classes) return [];
        return classes.filter((cls) => {
            const matchName = nameFilter ? (cls.name.toLowerCase().includes(nameFilter.toLowerCase()) || (cls.code && cls.code.toLowerCase().includes(nameFilter.toLowerCase()))) : true;
            const matchStatus = statusFilter ? cls.status === statusFilter : true;
            const matchCourse = courseFilter ? cls.course_id === courseFilter : true;
            return matchName && matchStatus && matchCourse;
        });
    }, [classes, nameFilter, statusFilter, courseFilter]);

    if (isClassesLoading) {
        return <div className="p-8 flex justify-center h-full items-center"><Spin size="large" /></div>;
    }

    return (
        <div className="p-6 h-full overflow-y-auto">
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>Danh sách Lớp học</Title>
                </Col>
                <Col>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal} size="large">
                        Tạo mới Lớp học
                    </Button>
                </Col>
            </Row>

            <Card style={{ marginBottom: 24 }} bodyStyle={{ padding: '16px 24px' }}>
                <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                    <Text strong><FilterOutlined /> Bộ lọc</Text>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Input
                                placeholder="Tìm theo tên hoặc mã lớp..."
                                prefix={<SearchOutlined />}
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Select
                                placeholder="Lọc theo trạng thái"
                                style={{ width: '100%' }}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                allowClear
                            >
                                <Option value="planned">Sắp mở</Option>
                                <Option value="enrolling">Đang tuyển sinh</Option>
                                <Option value="in_progress">Đang học</Option>
                                <Option value="completed">Đã kết thúc</Option>
                                <Option value="cancelled">Đã hủy</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Select
                                placeholder="Lọc theo khóa học"
                                style={{ width: '100%' }}
                                value={courseFilter}
                                onChange={setCourseFilter}
                                allowClear
                                showSearch
                                loading={isCoursesLoading}
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
                        </Col>
                    </Row>
                </Space>
            </Card>

            <Row gutter={[16, 16]}>
                {filteredClasses.length === 0 && (
                    <Col span={24}>
                        <div className="text-center py-10">
                            <Text type="secondary">
                                {classes?.length === 0
                                    ? 'Chưa có lớp học nào. Hãy tạo mới một lớp học.'
                                    : 'Không tìm thấy lớp học nào phù hợp với bộ lọc.'}
                            </Text>
                        </div>
                    </Col>
                )}
                {filteredClasses.map((cls) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={cls.id}>
                        <Card
                            hoverable
                            onClick={() => router.push(`/class/${cls.id}`)}
                            title={
                                <Space>
                                    <TeamOutlined />
                                    {cls.code || 'Chưa định danh'}
                                </Space>
                            }
                            extra={
                                <Tag color={statusColorMap[cls.status || 'planned']}>
                                    {statusTextMap[cls.status || 'planned']}
                                </Tag>
                            }
                            actions={[
                                <Button key="edit" type="link" onClick={(e) => { e.stopPropagation(); handleOpenUpdateModal(cls); }} icon={<EditOutlined />}>Sửa</Button>,
                                <Popconfirm
                                    key="delete"
                                    title="Xóa lớp học"
                                    description="Bạn có chắc chắn muốn xóa lớp học này không?"
                                    onConfirm={(e) => { e?.stopPropagation(); handleDelete(cls.id); }}
                                    onCancel={(e) => { e?.stopPropagation(); }}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                >
                                    <Button type="link" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()}>Xóa</Button>
                                </Popconfirm>
                            ]}
                            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                            bodyStyle={{ flex: 1 }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <Text strong style={{ fontSize: '16px' }}>{cls.name}</Text>

                                {cls.courses && (
                                    <div style={{ marginTop: '8px' }}>
                                        <Text type="secondary">Khóa học: </Text>
                                        <Text>{cls.courses.name} {cls.courses.code ? `(${cls.courses.code})` : ''}</Text>
                                    </div>
                                )}

                                <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                                    <Text type="secondary">Sĩ số: {cls.capacity || 'Chưa thiết lập'}</Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <CreateClassModal open={isCreateModalOpen} onClose={handleCloseCreateModal} />
            <UpdateClassModal open={isUpdateModalOpen} onClose={handleCloseUpdateModal} classData={selectedClass} />
        </div>
    );
}

