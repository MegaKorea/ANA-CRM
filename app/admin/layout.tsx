'use client';

import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { Spin, Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import styles from './layout.module.scss';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { hasPermission, isLoading } = useAuthPermission(['ADMIN']);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
        extra={
          <Button type="primary" onClick={() => router.push('/')}>
            Trở về trang chủ
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
