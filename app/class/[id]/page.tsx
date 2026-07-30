'use client';

import styles from './page.module.scss';
import { Tabs, Spin, Typography, Card, Breadcrumb, Tag, Result, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useClass } from '@/lib/hooks/use-classes';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { useUserStore } from '@/lib/stores/user.store';

import { TabBasicInfo } from './components/TabBasicInfo';
import { TabTeachers } from './components/TabTeachers';
import { TabStudents } from './components/TabStudents';
import { TabSchedule } from './components/TabSchedule';
import { getClassStatusMeta } from '@/lib/constants/classStatus';

const { Title, Text } = Typography;

const CLASS_TABS = new Set(['basic_info', 'teachers', 'students', 'schedule']);

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params.id as string;

  const tabParam = searchParams.get('tab') || 'basic_info';
  const activeTab = CLASS_TABS.has(tabParam) ? tabParam : 'basic_info';

  const roleCode = useUserStore((s) => s.user?.roleCode);
  const homeHref = roleCode === 'STU' ? '/course' : '/';

  const { hasPermission, isLoading: isAuthLoading } = useAuthPermission([
    'ADMIN',
    'AO',
    'STU',
    'TEA',
  ]);
  const { data: classData, isLoading: isClassLoading } = useClass(classId);

  const isLoading = isAuthLoading || isClassLoading;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className={styles.errorContainer}>
        <Result
          status="403"
          title="403"
          subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
          extra={
            <Button type="primary" onClick={() => router.push(homeHref)}>
              Trở về trang chủ
            </Button>
          }
        />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className={styles.notFoundContainer}>
        <Text type="secondary">Không tìm thấy thông tin lớp học.</Text>
      </div>
    );
  }

  const statusMeta = getClassStatusMeta(classData.status);

  const onTabChange = (key: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('tab', key);
    router.replace(`/class/${classId}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.pageContainer}>
      <Breadcrumb className={styles.breadcrumb}>
        <Breadcrumb.Item href={homeHref}>
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/class">
          <span className={styles.breadcrumbTextDesktop}>Danh sách lớp học</span>
          <span className={styles.breadcrumbTextMobile}>Lớp học</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span className={styles.breadcrumbClassName}>
            {classData.name} {classData.code ? `(${classData.code})` : ''}
          </span>
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className={styles.headerContainer}>
        <div className={styles.titleRow}>
          <Title level={2} className={styles.pageTitle}>
            {classData.name}
          </Title>
          <div className={styles.tagWrapper}>
            <Tag color={statusMeta.color} className={styles.statusTag}>
              {statusMeta.label}
            </Tag>
          </div>
        </div>
        {classData.courses && (
          <div className={styles.courseInfo}>
            <Text type="secondary" className={styles.courseLabel}>
              Khóa học:{' '}
            </Text>
            <Text strong className={styles.courseName}>
              {classData.courses.name}
            </Text>
          </div>
        )}
      </div>

      <Card
        className={styles.cardContainer}
        styles={{
          body: { padding: '12px 24px' },
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={onTabChange}
          size="small"
          className={styles.tabsContainer}
          items={[
            {
              label: 'Thông tin cơ bản',
              key: 'basic_info',
              children: <TabBasicInfo classData={classData} />,
            },
            {
              label: 'Giáo viên',
              key: 'teachers',
              children: <TabTeachers classData={classData} />,
            },
            {
              label: 'Học viên',
              key: 'students',
              children: <TabStudents classData={classData} />,
            },
            {
              label: 'Lịch học',
              key: 'schedule',
              children: <TabSchedule classData={classData} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
