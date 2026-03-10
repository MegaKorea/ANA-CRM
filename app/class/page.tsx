'use client';

import { useCallback, useMemo, useState } from 'react';
import { Button, Col, Input, message, Popconfirm, Row, Select, Space, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useClasses, useDeleteClass } from '@/lib/hooks/use-classes';
import { useCourses } from '@/lib/hooks/use-courses';
import { useRouter } from 'next/navigation';
import type { Class } from '@/lib/services/class.service';
import type { ColumnsType } from 'antd/es/table';
import { CLASS_STATUS_OPTIONS, getClassStatusMeta } from '@/lib/constants/classStatus';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import dynamic from 'next/dynamic';

const { Title, Text } = Typography;

const CreateClassModal = dynamic(
    () => import('./components/CreateClassModal').then((m) => m.CreateClassModal),
    { ssr: false }
);

export default function ClassPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [courseFilter, setCourseFilter] = useState<string | undefined>(undefined);

    const router = useRouter();

    const { data: classes, isLoading: isClassesLoading, refetch } = useClasses();
    const { data: courses, isLoading: isCoursesLoading } = useCourses();
    const { mutate: deleteClassMutation } = useDeleteClass();

    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);

    const handleDelete = useCallback(
        (id: string) => {
            deleteClassMutation(id, {
                onSuccess: () => {
                    message.success('Xóa lớp học thành công');
                },
                onError: (error: any) => {
                    message.error('Xóa lớp học thất bại: ' + error.message);
                },
            });
        },
        [deleteClassMutation]
    );

    const debouncedNameFilter = useDebouncedValue(nameFilter, 200);

    const filteredClasses = useMemo(() => {
        if (!classes) return [];
        const term = debouncedNameFilter.trim().toLowerCase();
        return classes.filter((cls) => {
            const matchName = term
                ? cls.name.toLowerCase().includes(term) || (cls.code && cls.code.toLowerCase().includes(term))
                : true;
            const matchStatus = statusFilter ? cls.status === statusFilter : true;
            const matchCourse = courseFilter ? cls.course_id === courseFilter : true;
            return matchName && matchStatus && matchCourse;
        });
    }, [classes, courseFilter, debouncedNameFilter, statusFilter]);

    const courseOptions = useMemo(
        () =>
            (courses ?? []).map((course) => ({
                value: course.id,
                label: `${course.name}${course.code ? ` (${course.code})` : ''}`,
            })),
        [courses]
    );

    const columns = useMemo<ColumnsType<Class>>(
        () => [
            {
                title: 'STT',
                key: 'index',
                width: 60,
                align: 'center',
                render: (_: any, __: any, index: number) => index + 1,
            },
            {
                title: 'Mã lớp',
                dataIndex: 'code',
                key: 'code',
                width: 130,
                render: (code: string) => code || <Text type="secondary">—</Text>,
            },
            {
                title: 'Tên lớp học',
                dataIndex: 'name',
                key: 'name',
                render: (name: string) => <Text strong>{name}</Text>,
            },
            {
                title: 'Khóa học',
                key: 'course',
                render: (_: any, record: Class) =>
                    record.courses ? (
                        `${record.courses.name}${record.courses.code ? ` (${record.courses.code})` : ''}`
                    ) : (
                        <Text type="secondary">—</Text>
                    ),
            },
            {
                title: 'Sĩ số',
                key: 'capacity',
                width: 110,
                align: 'center',
                render: (_: any, record: Class) => {
                    const enrolled = record.class_students?.length ?? 0;
                    const capacity = record.capacity;
                    if (!capacity) return <Text type="secondary">—</Text>;
                    const isFull = enrolled >= capacity;
                    return (
                        <Tooltip title={isFull ? 'Đã đầy lớp' : `Còn ${capacity - enrolled} chỗ`}>
                            <Tag color={isFull ? 'red' : enrolled > 0 ? 'orange' : 'default'}>
                                {enrolled}/{capacity}
                            </Tag>
                        </Tooltip>
                    );
                },
            },
            {
                title: 'Lịch mở lớp',
                dataIndex: 'schedule',
                key: 'schedule',
                width: 130,
                align: 'center',
                render: (schedule: string | null) =>
                    schedule ? dayjs(schedule).format('DD/MM/YYYY') : <Text type="secondary">—</Text>,
            },
            {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                width: 150,
                align: 'center',
                render: (status: string | null) => {
                    const meta = getClassStatusMeta(status);
                    return <Tag color={meta.color}>{meta.label}</Tag>;
                },
            },
            {
                title: 'Thao tác',
                key: 'actions',
                width: 100,
                align: 'center',
                render: (_: any, record: Class) => (
                    <Space>
                        <Button
                            type="link"
                            icon={<EyeOutlined />}
                            title="Xem chi tiết"
                            onClick={() => router.push(`/class/${record.id}`)}
                        />
                        <Popconfirm
                            title="Xóa lớp học"
                            description="Bạn có chắc chắn muốn xóa lớp học này không?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                        >
                            <Button type="link" danger icon={<DeleteOutlined />} title="Xóa" />
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [handleDelete, router]
    );

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

            <Row gutter={[16, 12]} align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Text type="secondary"><FilterOutlined /> Bộ lọc:</Text>
                </Col>
                <Col xs={24} sm={12} md={7}>
                    <Input
                        placeholder="Tìm theo tên hoặc mã lớp..."
                        prefix={<SearchOutlined />}
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col xs={24} sm={12} md={5}>
                    <Select
                        placeholder="Lọc theo trạng thái"
                        style={{ width: '100%' }}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        allowClear
                        options={CLASS_STATUS_OPTIONS}
                    />
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Select
                        placeholder="Lọc theo khóa học"
                        style={{ width: '100%' }}
                        value={courseFilter}
                        onChange={setCourseFilter}
                        allowClear
                        showSearch
                        loading={isCoursesLoading}
                        optionFilterProp="label"
                        options={courseOptions}
                    />
                </Col>
                <Col>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetch()}
                        loading={isClassesLoading}
                        title="Làm mới dữ liệu"
                    >
                        Làm mới
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={filteredClasses}
                rowKey="id"
                pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Tổng ${total} lớp học` }}
                locale={{
                    emptyText:
                        classes?.length === 0
                        ? 'Chưa có lớp học nào. Hãy tạo mới một lớp học.'
                        : 'Không tìm thấy lớp học nào phù hợp với bộ lọc.',
                }}
            />

            <CreateClassModal open={isCreateModalOpen} onClose={handleCloseCreateModal} />
        </div>
    );
}
