'use client';

import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { HomeOutlined } from '@ant-design/icons';

export default function NotFoundPage() {
  const router = useRouter();

  const handleGoHome = (): void => {
    router.push('/login');
  };

  return (
    <Result
      status="404"
      title="404"
      subTitle="Trang bạn đang tìm kiếm không tồn tại hoặc bạn chưa đăng nhập."
      extra={
        <Button type="primary" icon={<HomeOutlined />} onClick={handleGoHome}>
          Về trang đăng nhập
        </Button>
      }
    />
  );
}
