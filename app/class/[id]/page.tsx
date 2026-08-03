'use client';

import styles from './page.module.scss';
import { Tabs, Spin, Typography, Card, Breadcrumb, Tag, Result, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useClass } from '@/lib/hooks/use-classes';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { useUserRoleCode } from '@/lib/hooks/use-current-user';

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

  const roleCode = useUserRoleCode();
  const isStudent = roleCode?.trim().toUpperCase() === 'STU';
  const homeHref = isStudent ? '/course' : '/';
  const defaultTab = isStudent ? 'schedule' : 'basic_info';
  const tabParam = searchParams.get('tab') || defaultTab;
  const activeTab = CLASS_TABS.has(tabParam) ? tabParam : defaultTab;

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
      <Breadcrumb
        className={styles.breadcrumb}
        items={[
          {
            href: homeHref,
            title: <HomeOutlined />,
          },
          {
            href: isStudent ? '/course' : '/class',
            title: (
              <>
                <span className={styles.breadcrumbTextDesktop}>
                  {isStudent ? 'Khóa học' : 'Danh sách lớp học'}
                </span>
                <span className={styles.breadcrumbTextMobile}>
                  {isStudent ? 'Khóa học' : 'Lớp học'}
                </span>
              </>
            ),
          },
          {
            title: (
              <span
                className={styles.breadcrumbClassName}
                title={`${classData.name}${classData.code ? ` (${classData.code})` : ''}`}
              >
                {classData.name}
                {classData.code ? (
                  <span className={styles.breadcrumbClassCode}> ({classData.code})</span>
                ) : null}
              </span>
            ),
          },
        ]}
      />

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
          destroyOnHidden
          items={[
            {
              label: 'Thông tin cơ bản',
              key: 'basic_info',
              children: activeTab === 'basic_info' ? <TabBasicInfo classData={classData} /> : null,
            },
            {
              label: 'Giáo viên',
              key: 'teachers',
              children: activeTab === 'teachers' ? <TabTeachers classData={classData} /> : null,
            },
            {
              label: 'Học viên',
              key: 'students',
              children: activeTab === 'students' ? <TabStudents classData={classData} /> : null,
            },
            {
              label: 'Lịch học',
              key: 'schedule',
              children: activeTab === 'schedule' ? <TabSchedule classData={classData} /> : null,
            },
          ]}
        />
      </Card>
    </div>
  );
}
