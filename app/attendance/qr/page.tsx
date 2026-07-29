'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Result, Space, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { useVerifyQrCode } from '@/lib/hooks/use-class-sessions';
import { FetchJsonError } from '@/lib/utils/fetchJson';

dayjs.locale('vi');

const { Text } = Typography;

const ATTENDANCE_STATUS_LABEL: Record<string, string> = {
  present: 'Có mặt',
  absent: 'Vắng',
  late: 'Đi trễ',
  excused: 'Có phép',
  not_arrived: 'Chưa đến',
};

/**
 * Đích đến của mã QR điểm danh mà giáo viên tạo trong tab Lịch học.
 * Mã chứa URL `/attendance/qr?token=...`; học viên quét xong sẽ vào đây, trang
 * tự gửi token lên server để ghi nhận có mặt.
 *
 * Route này KHÔNG nằm trong PUBLIC_ROUTES nên middleware bắt đăng nhập trước —
 * đúng ý đồ, vì server cần biết người quét là ai mới điểm danh được.
 */
function QrAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const verifyQrCode = useVerifyQrCode();
  const { mutate } = verifyQrCode;

  // React 19 StrictMode gọi effect hai lần ở dev; chốt lại để không gửi trùng.
  const submittedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || submittedTokenRef.current === token) {
      return;
    }
    submittedTokenRef.current = token;
    mutate(token);
  }, [token, mutate]);

  if (!token) {
    return (
      <Result
        status="warning"
        title="Thiếu mã điểm danh"
        subTitle="Đường dẫn không chứa mã QR hợp lệ. Vui lòng quét lại mã giáo viên cung cấp."
        extra={
          <Button type="primary" onClick={() => router.push('/class')}>
            Về danh sách lớp
          </Button>
        }
      />
    );
  }

  if (verifyQrCode.isPending) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Đang ghi nhận điểm danh...</Text>
        </div>
      </div>
    );
  }

  if (verifyQrCode.isError) {
    const error = verifyQrCode.error;
    const message =
      error instanceof FetchJsonError
        ? error.message
        : 'Không thể điểm danh. Vui lòng thử lại.';

    return (
      <Result
        status="error"
        title="Điểm danh không thành công"
        subTitle={message}
        extra={
          <Space>
            <Button
              type="primary"
              onClick={() => {
                submittedTokenRef.current = token;
                verifyQrCode.mutate(token);
              }}
            >
              Thử lại
            </Button>
            <Button onClick={() => router.push('/class')}>Về danh sách lớp</Button>
          </Space>
        }
      />
    );
  }

  if (verifyQrCode.isSuccess) {
    const { session, attendance, alreadyCheckedIn } = verifyQrCode.data;
    const className = session.class_name
      ? `${session.class_name}${session.class_code ? ` (${session.class_code})` : ''}`
      : 'lớp học';
    const recordedAt = attendance.checked_in_at ?? attendance.updated_at ?? attendance.created_at;

    return (
      <Result
        status="success"
        // Quét lại lần nữa không phải lỗi — báo cho học viên biết đã có bản ghi
        // rồi và hệ thống không ghi đè trạng thái giáo viên đã đặt.
        title={alreadyCheckedIn ? 'Bạn đã được điểm danh' : 'Điểm danh thành công!'}
        subTitle={
          <Space orientation="vertical" size={4} align="center">
            <Text>
              Buổi {session.session_number} — {dayjs(session.date).format('DD/MM/YYYY')}
            </Text>
            <Text type="secondary">{className}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Trạng thái: {ATTENDANCE_STATUS_LABEL[attendance.status] ?? attendance.status}
              {recordedAt ? ` — ghi nhận lúc ${dayjs(recordedAt).format('HH:mm DD/MM/YYYY')}` : ''}
            </Text>
            {alreadyCheckedIn && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Buổi này đã có kết quả điểm danh nên hệ thống giữ nguyên, không ghi đè.
              </Text>
            )}
          </Space>
        }
        extra={
          <Button type="primary" onClick={() => router.push(`/class/${session.class_id}`)}>
            Xem lớp học
          </Button>
        }
      />
    );
  }

  return null;
}

export default function QrAttendancePage() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 460 }}>
        {/* useSearchParams cần Suspense boundary khi Next prerender trang. */}
        <Suspense
          fallback={
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Spin size="large" />
            </div>
          }
        >
          <QrAttendanceContent />
        </Suspense>
      </Card>
    </div>
  );
}
