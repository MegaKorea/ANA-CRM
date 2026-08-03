'use client';

import { useCallback, useRef, useState } from 'react';
import { App, Alert, Modal, Typography, Space } from 'antd';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ScanOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Reason the camera cannot be used, or null while it is fine. */
type CameraBlock = 'insecure' | 'denied' | 'missing' | null;

/**
 * getUserMedia only exists in a secure context. Over plain HTTP on a LAN IP the
 * scanner silently renders a black box, so detect it up front and say why.
 */
function detectInsecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  return !window.isSecureContext;
}

const BLOCK_MESSAGE: Record<Exclude<CameraBlock, null>, { title: string; detail: string }> = {
  insecure: {
    title: 'Không mở được camera',
    detail:
      'Trình duyệt chỉ cho phép dùng camera trên kết nối HTTPS. Hãy mở trang bằng địa chỉ HTTPS thay vì IP nội bộ.',
  },
  denied: {
    title: 'Camera đang bị chặn',
    detail:
      'Bạn đã từ chối quyền camera cho trang này. Hãy bật lại trong cài đặt trình duyệt rồi thử lại.',
  },
  missing: {
    title: 'Không tìm thấy camera',
    detail: 'Thiết bị này không có camera khả dụng để quét mã.',
  },
};

/**
 * The live camera half. Kept as its own component mounted only while the modal
 * is open, so closing it resets scan state by unmounting rather than by an
 * effect that writes state on every open.
 */
function ScannerBody({ onClose }: { onClose: () => void }) {
  const { message } = App.useApp();
  const router = useRouter();

  const [block, setBlock] = useState<CameraBlock>(() =>
    detectInsecureContext() ? 'insecure' : null,
  );
  // The scanner keeps firing while a code is in frame; without this guard one
  // scan queues several navigations and several attendance POSTs.
  const handledRef = useRef(false);

  const handleScan = useCallback(
    (raw: string) => {
      if (!raw || handledRef.current) return;

      let target: string;
      try {
        const url = new URL(raw);
        if (!url.pathname.includes('/attendance/qr')) {
          message.error('Mã QR không hợp lệ. Hãy quét mã điểm danh do giáo viên mở.');
          return;
        }
        // Navigate by path only: the QR may encode a different origin than the
        // one this student is signed in on.
        target = url.pathname + url.search;
      } catch {
        message.error('Mã QR không hợp lệ.');
        return;
      }

      handledRef.current = true;
      message.success('Đã nhận diện mã QR, đang điểm danh...');
      onClose();
      router.push(target);
    },
    [message, onClose, router],
  );

  const handleError = useCallback((error: unknown) => {
    const name = (error as { name?: string })?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      setBlock('denied');
    } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      setBlock('missing');
    }
  }, []);

  if (block) {
    return (
      <div style={{ padding: '0 24px' }}>
        <Alert
          type="warning"
          showIcon
          message={BLOCK_MESSAGE[block].title}
          description={BLOCK_MESSAGE[block].detail}
        />
      </div>
    );
  }

  return (
    <>
      <Typography.Paragraph type="secondary" style={{ padding: '0 24px' }}>
        Đưa mã QR mà giáo viên mở vào giữa khung hình để điểm danh.
      </Typography.Paragraph>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#000' }}>
        <Scanner
          onScan={(results) => {
            if (results?.length) handleScan(results[0].rawValue);
          }}
          onError={handleError}
          components={{ zoom: false }}
          sound={false}
        />
      </div>
    </>
  );
}

/**
 * Camera modal a student uses to scan the teacher's attendance QR.
 */
export function StudentScannerModal({ open, onClose }: Props) {
  return (
    <Modal
      title={
        <Space>
          <ScanOutlined />
          <span>Quét mã điểm danh</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      styles={{ body: { padding: '24px 0' } }}
    >
      <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
        {open && <ScannerBody onClose={onClose} />}
      </div>
    </Modal>
  );
}
