'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Progress, QRCode, Space, Spin, Typography } from 'antd';
import { QrcodeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import type { ClassSession } from '@/lib/services/class_session.service';
import { QR_TOKEN_TTL_MS } from '@/constants/attendance';
import { useQrCodeToken, useRevokeQrToken } from '@/lib/hooks/use-class-sessions';
import styles from '../tab-schedule.module.scss';

dayjs.locale('vi');

interface Props {
    open: boolean;
    session: ClassSession | null;
    classId: string;
    onClose: () => void;
}

/** Nhịp cập nhật đồng hồ đếm ngược trên màn hình. */
const COUNTDOWN_TICK_MS = 500;

/**
 * Mã QR điểm danh, tự làm mới liên tục.
 *
 * Vì sao phải xoay mã: nếu mã sống 30 phút thì chỉ cần một học viên chụp màn
 * hình gửi vào nhóm chat là cả lớp điểm danh được từ nhà. Mã đổi đều đặn và
 * server chỉ chấp nhận mã còn hạn QR_TOKEN_TTL_MS, nên ảnh chụp mất tác dụng gần
 * như tức thì — muốn quét vẫn phải đứng trước màn hình.
 *
 * Đóng cửa sổ sẽ thu hồi mã, không để mã sống lơ lửng sau buổi điểm danh.
 */
export function QrCodeModal({ open, session, classId, onClose }: Props) {
    const { token: themeToken } = theme.useToken();

    const sessionId = session?.id ?? null;
    const { data, isPending, isError } = useQrCodeToken(sessionId, open);
    const revokeQr = useRevokeQrToken(classId);

    // Đồng hồ chạy độc lập; thời gian còn lại được TÍNH RA khi render thay vì
    // lưu thành state, nên effect chỉ có đúng một việc là nhích `now`.
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!open) {
            return;
        }
        const timer = setInterval(() => setNow(Date.now()), COUNTDOWN_TICK_MS);
        return () => clearInterval(timer);
    }, [open]);

    const handleClose = useCallback(() => {
        if (sessionId) {
            // Thu hồi là việc dọn dẹp — thất bại cũng không nên chặn giáo viên
            // đóng cửa sổ, vì mã sẽ tự hết hạn sau vài chục giây.
            revokeQr.mutate(sessionId);
        }
        onClose();
    }, [sessionId, revokeQr, onClose]);

    const qrValue = data?.token
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/attendance/qr?token=${data.token}`
        : '';

    const remainingMs = data?.expiresAt
        ? Math.max(0, new Date(data.expiresAt).getTime() - now)
        : 0;
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const percent = Math.round((remainingMs / QR_TOKEN_TTL_MS) * 100);

    return (
        <Modal
            title={
                <Space>
                    <QrcodeOutlined />
                    <span>
                        Mã QR điểm danh
                        {session ? ` — Buổi ${session.session_number}` : ''}
                    </span>
                </Space>
            }
            open={open}
            onCancel={handleClose}
            footer={null}
            width={380}
            destroyOnHidden
            centered
        >
            <div className={styles.qrWrapper}>
                {isError && (
                    <Alert
                        type="error"
                        showIcon
                        message="Không tạo được mã mới. Kiểm tra kết nối mạng rồi thử lại."
                        style={{ marginBottom: 12 }}
                    />
                )}

                <div className={styles.qrBox}>
                    {qrValue ? (
                        <QRCode
                            value={qrValue}
                            size={200}
                            icon="/favicon.ico"
                            bgColor={themeToken.colorBgElevated}
                            color={themeToken.colorText}
                        />
                    ) : (
                        <div style={{ width: 200, height: 200, display: 'grid', placeItems: 'center' }}>
                            <Spin />
                        </div>
                    )}
                </div>

                <Space orientation="vertical" align="center" size={6} style={{ width: '100%' }}>
                    <Space>
                        <CheckCircleOutlined style={{ color: themeToken.colorSuccess }} />
                        <Typography.Text>Học viên quét mã này để điểm danh</Typography.Text>
                    </Space>

                    {!isPending && (
                        <>
                            <Progress
                                percent={percent}
                                showInfo={false}
                                size="small"
                                strokeColor={
                                    remainingSeconds <= 10 ? themeToken.colorWarning : themeToken.colorPrimary
                                }
                                style={{ width: 220, marginBottom: 0 }}
                            />
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Mã tự đổi sau {remainingSeconds}s
                            </Typography.Text>
                        </>
                    )}

                    <Typography.Text
                        type="secondary"
                        style={{ fontSize: 11, textAlign: 'center', display: 'block' }}
                    >
                        Mã chỉ có hiệu lực vài chục giây và đổi liên tục, nên ảnh chụp màn hình
                        gửi cho người vắng mặt sẽ không dùng được.
                    </Typography.Text>
                </Space>
            </div>
        </Modal>
    );
}
