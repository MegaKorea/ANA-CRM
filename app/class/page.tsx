'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Col,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  List,
  Card,
  Flex,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useClasses, useDeleteClass } from '@/lib/hooks/use-classes';
import { useCourses } from '@/lib/hooks/use-courses';
import { useRouter } from 'next/navigation';
import type { Class } from '@/lib/services/class.service';
import type { ColumnsType } from 'antd/es/table';
import { CLASS_STATUS_OPTIONS, getClassStatusMeta } from '@/lib/constants/classStatus';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import dynamic from 'next/dynamic';
import styles from './page.module.scss';

const { Title, Text } = Typography;

const CreateClassModal = dynamic(
  () => import('./components/CreateClassModal').then((m) => m.CreateClassModal),
  { ssr: false },
);

export default function ClassPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [courseFilter, setCourseFilter] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();

  const router = useRouter();

  const { hasPermission: notStudent } = useAuthPermission(['ADMIN', 'AO', 'TEA']);

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
    [deleteClassMutation],
  );

  const debouncedNameFilter = useDebouncedValue(nameFilter, 200);

  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    const term = debouncedNameFilter.trim().toLowerCase();
    return classes.filter((cls) => {
      const matchName = term
        ? cls.name.toLowerCase().includes(term) ||
        (cls.code && cls.code.toLowerCase().includes(term))
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
    [courses],
  );

  const columns = useMemo(
    () =>
      [
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
              {notStudent && (
                <Popconfirm
                  title="Xóa lớp học"
                  description="Bạn có chắc chắn muốn xóa lớp học này không?"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button type="link" danger icon={<DeleteOutlined />} title="Xóa" />
                </Popconfirm>
              )}
            </Space>
          ),
        },
      ].map((col) => ({
        ...col,
        onCell: () =>
          ({
            'data-label': typeof col.title === 'string' ? col.title : '',
          }) as any,
      })),
    [handleDelete, router],
  ) as ColumnsType<Class>;

  if (isClassesLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={`p-page ${styles.pageContainer}`}>
      <Row justify="space-between" align="middle" className="mb-section">
        <Col>
          <Title level={2} className="text-h2" style={{ margin: 0 }}>
            Danh sách Lớp học
          </Title>
        </Col>
        {notStudent && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              size="large"
            >
              Tạo mới Lớp học
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={[16, 12]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Text type="secondary">
            <FilterOutlined /> Bộ lọc:
          </Text>
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

      {!isMobile ? (
        <Table
          columns={columns}
          dataSource={filteredClasses}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} lớp học`,
          }}
          locale={{
            emptyText:
              classes?.length === 0
                ? 'Chưa có lớp học nào. Hãy tạo mới một lớp học.'
                : 'Không tìm thấy lớp học nào phù hợp với bộ lọc.',
          }}
        />
      ) : (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={filteredClasses}
          pagination={{ pageSize: 20, size: 'small', showSizeChanger: false, align: 'center' }}
          locale={{
            emptyText:
              classes?.length === 0
                ? 'Chưa có lớp học nào. Hãy tạo mới một lớp học.'
                : 'Không tìm thấy lớp học nào phù hợp với bộ lọc.',
          }}
          renderItem={(cls) => {
            const enrolled = cls.class_students?.length ?? 0;
            const capacity = cls.capacity;
            const isFull = capacity ? enrolled >= capacity : false;

            return (
              <List.Item>
                <Card
                  size="small"
                  title={
                    <Text
                      strong
                      style={{
                        fontSize: '15px',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        color: '#1677ff',
                      }}
                    >
                      {cls.name}
                    </Text>
                  }
                  extra={
                    cls.status && (
                      <Tag style={{ margin: 0 }} color={getClassStatusMeta(cls.status).color}>
                        {getClassStatusMeta(cls.status).label}
                      </Tag>
                    )
                  }
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                  styles={{ body: { padding: '12px' } }}
                  actions={[
                    <Tooltip key="detail" title="Xem chi tiết">
                      <div
                        onClick={() => router.push(`/class/${cls.id}`)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <EyeOutlined style={{ fontSize: '16px' }} />
                      </div>
                    </Tooltip>,
                    ...(notStudent ? [
                      <Popconfirm
                        key="delete"
                        title="Xóa lớp học"
                        description="Bạn có chắc chắn muốn xóa lớp học này không?"
                        onConfirm={() => handleDelete(cls.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                      >
                        <Tooltip title="Xóa">
                          <div
                            style={{
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              color: '#ff4d4f',
                            }}
                          >
                            <DeleteOutlined style={{ fontSize: '16px' }} />
                          </div>
                        </Tooltip>
                      </Popconfirm>
                    ] : []),
                  ]}
                >
                  <Flex vertical gap="small">
                    <Flex
                      justify="space-between"
                      align="center"
                      style={{
                        fontSize: '14px',
                        borderBottom: '1px solid #f0f0f0',
                        paddingBottom: '8px',
                      }}
                    >
                      <Text type="secondary">Mã lớp</Text>
                      <Text strong>{cls.code || '—'}</Text>
                    </Flex>
                    <Flex
                      justify="space-between"
                      align="center"
                      style={{
                        fontSize: '14px',
                        borderBottom: '1px solid #f0f0f0',
                        paddingBottom: '8px',
                      }}
                    >
                      <Text type="secondary">Khóa học</Text>
                      <Text style={{ textAlign: 'right', marginLeft: '16px' }}>
                        {cls.courses
                          ? `${cls.courses.name}${cls.courses.code ? ` (${cls.courses.code})` : ''}`
                          : '—'}
                      </Text>
                    </Flex>
                    <Flex
                      justify="space-between"
                      align="center"
                      style={{
                        fontSize: '14px',
                        borderBottom: '1px solid #f0f0f0',
                        paddingBottom: '8px',
                      }}
                    >
                      <Text type="secondary">Sĩ số</Text>
                      {capacity ? (
                        <Tag
                          color={isFull ? 'red' : enrolled > 0 ? 'orange' : 'default'}
                          style={{ margin: 0, fontWeight: 500 }}
                        >
                          {enrolled}/{capacity}
                        </Tag>
                      ) : (
                        <Text type="secondary">—</Text>
                      )}
                    </Flex>
                    <Flex justify="space-between" align="center" style={{ fontSize: '14px' }}>
                      <Text type="secondary">Lịch mở lớp</Text>
                      <Text>{cls.schedule ? dayjs(cls.schedule).format('DD/MM/YYYY') : '—'}</Text>
                    </Flex>
                  </Flex>
                </Card>
              </List.Item>
            );
          }}
        />
      )}

      <CreateClassModal open={isCreateModalOpen} onClose={handleCloseCreateModal} />
    </div>
  );
}
