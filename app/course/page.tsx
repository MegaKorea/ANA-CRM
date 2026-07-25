'use client';

import { useCallback, useMemo, useState } from 'react';
import { App, Button, Card, Col, Row, Typography, Space, Spin, Tag, Popconfirm, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, BookOutlined } from '@ant-design/icons';
import { useCourses, useDeleteCourse } from '@/lib/hooks/use-courses';
import type { Course } from '@/lib/services/course.service';
import dynamic from 'next/dynamic';
import { formatNumberVi } from '@/lib/utils/numberFormat';
import styles from './page.module.scss';

const { Title, Text } = Typography;

const CreateCourseModal = dynamic(
  () => import('./components/CreateCourseModal').then((m) => m.CreateCourseModal),
  { ssr: false },
);
const UpdateCourseModal = dynamic(
  () => import('./components/UpdateCourseModal').then((m) => m.UpdateCourseModal),
  { ssr: false },
);

export default function CoursePage() {
  const { message } = App.useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { data: courses, isLoading } = useCourses();
  const { mutate: deleteCourse } = useDeleteCourse();

  const handleOpenCreateModal = useCallback(() => setIsCreateModalOpen(true), []);
  const handleCloseCreateModal = useCallback(() => setIsCreateModalOpen(false), []);

  const handleOpenUpdateModal = useCallback((course: Course) => {
    setSelectedCourse(course);
    setIsUpdateModalOpen(true);
  }, []);

  const handleCloseUpdateModal = useCallback(() => {
    setIsUpdateModalOpen(false);
    setSelectedCourse(null);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteCourse(id, {
        onSuccess: () => {
          message.success('Xóa khóa học thành công');
        },
        onError: (error: any) => {
          message.error('Xóa khóa học thất bại: ' + error.message);
        },
      });
    },
    [deleteCourse, message],
  );

  const courseCards = useMemo(() => courses ?? [], [courses]);

  const columns: ColumnsType<Course> = useMemo(
    () => [
      {
        title: 'Mã',
        dataIndex: 'code',
        key: 'code',
        render: (text) => (
          <Space>
            <BookOutlined />
            {text || 'Chưa định danh'}
          </Space>
        ),
      },
      {
        title: 'Tên khóa học',
        dataIndex: 'name',
        key: 'name',
        render: (text) => <Text strong>{text}</Text>,
      },
      {
        title: 'Mô tả',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
      },
      {
        title: 'Học phí',
        dataIndex: 'fee',
        key: 'fee',
        render: (fee) => <Text strong>{formatNumberVi(fee)} đ</Text>,
      },
      {
        title: 'Thời gian',
        dataIndex: 'expected_duration',
        key: 'expected_duration',
      },
      {
        title: 'Cấp độ',
        dataIndex: 'level',
        key: 'level',
      },
      {
        title: 'Sĩ số',
        dataIndex: 'expected_students',
        key: 'expected_students',
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (status) => (
          <Tag color={status === 'active' ? 'green' : 'red'}>
            {status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
          </Tag>
        ),
      },
      {
        title: 'Hành động',
        key: 'action',
        fixed: 'right',
        render: (_, record) => (
          <Space size="middle">
            <Button type="link" onClick={() => handleOpenUpdateModal(record)} style={{ padding: 0 }}>
              Chỉnh sửa
            </Button>
            <Popconfirm
              title="Xóa khóa học"
              description="Bạn có chắc chắn muốn xóa khóa học này không?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button type="link" danger style={{ padding: 0 }}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleDelete, handleOpenUpdateModal],
  );

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Danh sách Khóa học
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
            size="large"
          >
            Tạo mới Khóa học
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={courseCards}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} khóa học`,
        }}
        scroll={{ x: 'max-content' }}
      />

      <CreateCourseModal open={isCreateModalOpen} onClose={handleCloseCreateModal} />
      <UpdateCourseModal
        open={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        courseData={selectedCourse}
      />
    </div>
  );
}
