'use client';

import { Modal, QRCode, Space, Typography } from 'antd';
import { QrcodeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import styles from '../tab-schedule.module.scss';

dayjs.locale('vi');

interface Props {
    open: boolean;
    token: string;
    expiresAt: string;
    onClose: () => void;
}

export function QrCodeModal({ open, token: qrToken, expiresAt, onClose }: Props) {
    const { token } = theme.useToken();

    const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/attendance/qr?token=${qrToken}`;

    return (
        <Modal
            title={
                <Space>
                    <QrcodeOutlined />
                    <span>Mã QR điểm danh</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={380}
            destroyOnHidden
            centered
        >
            <div className={styles.qrWrapper}>
                <div className={styles.qrBox}>
                    <QRCode
                        value={qrValue}
                        size={200}
                        icon="/favicon.ico"
                        bgColor={token.colorBgElevated}
                        color={token.colorText}
                    />
                </div>
                <Space direction="vertical" align="center" size={6}>
                    <Space>
                        <CheckCircleOutlined style={{ color: token.colorSuccess }} />
                        <Typography.Text>Học viên quét mã này để điểm danh</Typography.Text>
                    </Space>
                    {expiresAt && (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Hết hạn: {dayjs(expiresAt).format('HH:mm — DD/MM/YYYY')}
                        </Typography.Text>
                    )}
                </Space>
            </div>
        </Modal>
    );
}
