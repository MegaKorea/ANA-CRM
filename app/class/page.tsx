'use client';

import { useCallback, useMemo, useState, type HTMLAttributes } from 'react';
import {
  App,
  Button,
  Col,
  Input,
  Row,
  Select,
  Spin,
  Table,
  Typography,
  Empty,
  Pagination,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useClasses, useDeleteClass } from '@/lib/hooks/use-classes';
import { useCourses } from '@/lib/hooks/use-courses';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import { CLASS_STATUS_OPTIONS } from '@/lib/constants/classStatus';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import dynamic from 'next/dynamic';
import {
  ClassCapacityTag,
  ClassRowActions,
  ClassStatusTag,
} from './components/ClassListCells';
import { ClassListCard } from './components/ClassListCard';
import {
  formatCourseOptionLabel,
  getClassDeleteActionState,
  toClassListRowModel,
  type ClassListRowModel,
} from './components/class-list.utils';
import styles from './page.module.scss';

const { Title, Text } = Typography;

const CreateClassModal = dynamic(
  () => import('./components/CreateClassModal').then((m) => m.CreateClassModal),
  { ssr: false },
);

export default function ClassPage() {
  const { message } = App.useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [courseFilter, setCourseFilter] = useState<string | undefined>(undefined);
  const [mobilePage, setMobilePage] = useState(1);
  const isMobile = useIsMobile();

  const router = useRouter();

  const { hasPermission: canManageClasses } = useAuthPermission(['ADMIN', 'AO', 'TEA']);

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
        onError: (error: unknown) => {
          message.error(getErrorMessage(error, 'Xóa lớp học thất bại'));
        },
      });
    },
    [deleteClassMutation, message],
  );

  const handleView = useCallback(
    (id: string) => {
      router.push(`/class/${id}`);
    },
    [router],
  );

  const debouncedNameFilter = useDebouncedValue(nameFilter, 200);

  const listRows = useMemo(() => {
    if (!classes) return [];
    const term = debouncedNameFilter.trim().toLowerCase();
    return classes
      .filter((cls) => {
        const matchName = term
          ? cls.name.toLowerCase().includes(term) ||
            (cls.code && cls.code.toLowerCase().includes(term))
          : true;
        const matchStatus = statusFilter ? cls.status === statusFilter : true;
        const matchCourse = courseFilter ? cls.course_id === courseFilter : true;
        return matchName && matchStatus && matchCourse;
      })
      .map(toClassListRowModel);
  }, [classes, courseFilter, debouncedNameFilter, statusFilter]);

  const emptyText =
    classes?.length === 0
      ? 'Chưa có lớp học nào. Hãy tạo mới một lớp học.'
      : 'Không tìm thấy lớp học nào phù hợp với bộ lọc.';
  const mobilePageSize = 20;
  const safeMobilePage = Math.min(
    mobilePage,
    Math.max(1, Math.ceil(listRows.length / mobilePageSize)),
  );
  const mobileRows = listRows.slice(
    (safeMobilePage - 1) * mobilePageSize,
    safeMobilePage * mobilePageSize,
  );

  const courseOptions = useMemo(
    () =>
      (courses ?? []).map((course) => ({
        value: course.id,
        label: formatCourseOptionLabel(course.name, course.code),
      })),
    [courses],
  );

  const columns = useMemo<ColumnsType<ClassListRowModel>>(
    () =>
      (
        [
          {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_: unknown, __: ClassListRowModel, index: number) => index + 1,
          },
          {
            title: 'Mã lớp',
            dataIndex: 'code',
            key: 'code',
            width: 130,
            render: (code: string) =>
              code === '—' ? <Text type="secondary">—</Text> : code,
          },
          {
            title: 'Tên lớp học',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <Text strong>{name}</Text>,
          },
          {
            title: 'Khóa học',
            dataIndex: 'courseLabel',
            key: 'course',
            render: (courseLabel: string) =>
              courseLabel === '—' ? <Text type="secondary">—</Text> : courseLabel,
          },
          {
            title: 'Sĩ số',
            key: 'capacity',
            width: 110,
            align: 'center',
            render: (_: unknown, row: ClassListRowModel) => (
              <ClassCapacityTag capacity={row.capacity} />
            ),
          },
          {
            title: 'Lịch mở lớp',
            dataIndex: 'scheduleLabel',
            key: 'schedule',
            width: 130,
            align: 'center',
            render: (scheduleLabel: string) =>
              scheduleLabel === '—' ? <Text type="secondary">—</Text> : scheduleLabel,
          },
          {
            title: 'Trạng thái',
            key: 'status',
            width: 150,
            align: 'center',
            render: (_: unknown, row: ClassListRowModel) => (
              <ClassStatusTag label={row.status.label} color={row.status.color} />
            ),
          },
          {
            title: 'Thao tác',
            key: 'actions',
            width: 100,
            align: 'center',
            render: (_: unknown, row: ClassListRowModel) => {
              const deleteState = getClassDeleteActionState(
                canManageClasses,
                row.capacity.enrolled,
              );
              return (
                <ClassRowActions
                  classId={row.id}
                  canDelete={deleteState.canDelete}
                  deleteBlockedReason={deleteState.deleteBlockedReason}
                  onView={handleView}
                  onDelete={handleDelete}
                />
              );
            },
          },
        ] as ColumnsType<ClassListRowModel>
      ).map((col) => ({
        ...col,
        onCell: () =>
          ({
            'data-label': typeof col.title === 'string' ? col.title : '',
          }) as HTMLAttributes<HTMLElement>,
      })),
    [handleDelete, handleView, canManageClasses],
  );

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
          <Title level={2} className={`text-h2 ${styles.pageTitle}`}>
            Danh sách Lớp học
          </Title>
        </Col>
        {canManageClasses ? (
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
        ) : null}
      </Row>

      <Row gutter={[16, 12]} align="middle" className={styles.filterRow}>
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
            className={styles.filterSelect}
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            options={CLASS_STATUS_OPTIONS}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Lọc theo khóa học"
            className={styles.filterSelect}
            value={courseFilter}
            onChange={setCourseFilter}
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            loading={isCoursesLoading}
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
          dataSource={listRows}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} lớp học`,
          }}
          locale={{ emptyText }}
        />
      ) : listRows.length === 0 ? (
        <Empty description={emptyText} />
      ) : (
        <>
          <div role="list" style={{ display: 'grid', gap: 16 }}>
            {mobileRows.map((row) => {
              const deleteState = getClassDeleteActionState(
                canManageClasses,
                row.capacity.enrolled,
              );
              return (
                <div role="listitem" key={row.id}>
                  <ClassListCard
                    row={row}
                    canDelete={deleteState.canDelete}
                    deleteBlockedReason={deleteState.deleteBlockedReason}
                    onView={handleView}
                    onDelete={handleDelete}
                  />
                </div>
              );
            })}
          </div>
          <Pagination
            current={safeMobilePage}
            pageSize={mobilePageSize}
            total={listRows.length}
            size="small"
            align="center"
            showSizeChanger={false}
            onChange={setMobilePage}
            style={{ marginTop: 16 }}
          />
        </>
      )}

      <CreateClassModal open={isCreateModalOpen} onClose={handleCloseCreateModal} />
    </div>
  );
}
