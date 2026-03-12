'use client';

import { useCallback, useMemo, useState } from 'react';
import { Button, Card, Col, Row, Typography, Space, Spin, Tag, Popconfirm, message } from 'antd';
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
    [deleteCourse],
  );

  const courseCards = useMemo(() => courses ?? [], [courses]);

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

      <Row gutter={[16, 16]}>
        {courseCards.length === 0 && (
          <Col span={24}>
            <div className={styles.emptyState}>
              <Text type="secondary">Chưa có khóa học nào. Hãy tạo mới một khóa học.</Text>
            </div>
          </Col>
        )}
        {courseCards.map((course) => (
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
                <Button key="edit" type="link" onClick={() => handleOpenUpdateModal(course)}>
                  Chỉnh sửa
                </Button>,
                <Popconfirm
                  key="delete"
                  title="Xóa khóa học"
                  description="Bạn có chắc chắn muốn xóa khóa học này không?"
                  onConfirm={() => handleDelete(course.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button type="link" danger>
                    Xóa
                  </Button>
                </Popconfirm>,
              ]}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ flex: 1 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text strong style={{ fontSize: '16px' }}>
                  {course.name}
                </Text>
                {course.description && (
                  <Text type="secondary" ellipsis={{ tooltip: course.description }}>
                    {course.description}
                  </Text>
                )}
                <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                  <Text strong>Học phí: {formatNumberVi(course.fee)} đ</Text>
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
      <UpdateCourseModal
        open={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        courseData={selectedCourse}
      />
    </div>
  );
}
