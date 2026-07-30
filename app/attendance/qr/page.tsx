'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { App, Button, Card, Result, Spin, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoginOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { useVerifyQrCode } from '@/lib/hooks/use-class-sessions';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { FetchJsonError } from '@/lib/utils/fetchJson';

type VerifyPhase = 'idle' | 'success' | 'error';

const VERIFY_TIMEOUT_MS = 20_000;

function schedulePath(classId: string, sessionDate?: string) {
  const dateQ = sessionDate ? `&date=${encodeURIComponent(sessionDate)}` : '';
  return `/class/${classId}?tab=schedule${dateQ}`;
}

function QrAttendanceContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';

  const { user, isLoading: authLoading } = useCurrentUser();
  const { mutateAsync } = useVerifyQrCode();

  const [phase, setPhase] = useState<VerifyPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [scheduleHref, setScheduleHref] = useState('/class');
  const runIdRef = useRef(0);

  const canVerify = Boolean(token && !authLoading && user);

  useEffect(() => {
    if (!canVerify) return;

    const runId = ++runIdRef.current;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (cancelled || runIdRef.current !== runId) return;
      setErrorMsg('Hết thời gian chờ phản hồi. Kiểm tra mạng (tunnel) hoặc thử lại.');
      setPhase('error');
    }, VERIFY_TIMEOUT_MS);

    void (async () => {
      try {
        const result = await mutateAsync(token);
        if (cancelled || runIdRef.current !== runId) return;
        window.clearTimeout(timeoutId);
        if (result.class_id) {
          setScheduleHref(schedulePath(result.class_id, result.session_date));
        }
        setPhase('success');
      } catch (e: unknown) {
        if (cancelled || runIdRef.current !== runId) return;
        window.clearTimeout(timeoutId);
        const msg =
          e instanceof FetchJsonError || e instanceof Error
            ? e.message
            : 'Không thể điểm danh. Vui lòng thử lại.';
        setErrorMsg(msg);
        setPhase('error');
        message.error(msg);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [canVerify, token, attempt, mutateAsync, message]);

  if (!token) {
    return (
      <Result
        status="warning"
        title="Thiếu mã điểm danh"
        subTitle="Mã QR không hợp lệ. Hãy quét lại mã do giáo viên cung cấp."
        extra={
          <Button type="primary" onClick={() => router.push('/class')}>
            Về danh sách lớp
          </Button>
        }
      />
    );
  }

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
        <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
          Đang kiểm tra đăng nhập...
        </Typography.Paragraph>
      </div>
    );
  }

  if (!user) {
    const next = `/attendance/qr?token=${encodeURIComponent(token)}`;
    return (
      <Result
        icon={<LoginOutlined />}
        title="Cần đăng nhập"
        subTitle="Bạn cần đăng nhập tài khoản học viên để điểm danh bằng QR."
        extra={
          <Button type="primary" href={`/login?next=${encodeURIComponent(next)}`}>
            Đăng nhập
          </Button>
        }
      />
    );
  }

  if (phase === 'success') {
    return (
      <Result
        status="success"
        icon={<CheckCircleOutlined />}
        title="Điểm danh thành công"
        subTitle="Bạn đã được ghi nhận có mặt cho buổi học này."
        extra={
          <Button type="primary" onClick={() => router.push(scheduleHref)}>
            Về lịch học
          </Button>
        }
      />
    );
  }

  if (phase === 'error') {
    return (
      <Result
        status="error"
        icon={<CloseCircleOutlined />}
        title="Điểm danh thất bại"
        subTitle={errorMsg || 'Không thể điểm danh. Vui lòng thử lại.'}
        extra={[
          <Button
            key="retry"
            type="primary"
            onClick={() => {
              setPhase('idle');
              setErrorMsg('');
              setAttempt((n) => n + 1);
            }}
          >
            Thử lại
          </Button>,
          <Button key="classes" onClick={() => router.push('/class')}>
            Về danh sách lớp
          </Button>,
        ]}
      />
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <Spin size="large" />
      <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
        Đang điểm danh...
      </Typography.Paragraph>
    </div>
  );
}

export default function AttendanceQrPage() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{ width: '100%', maxWidth: 480 }}
        title={
          <Typography.Text strong>
            <QrcodeOutlined style={{ marginRight: 8 }} />
            Điểm danh QR
          </Typography.Text>
        }
      >
        <Suspense
          fallback={
            <div style={{ textAlign: 'center', padding: 48 }}>
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
