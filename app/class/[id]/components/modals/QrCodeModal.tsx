'use client';

import { useMemo } from 'react';
import { Alert, Divider, Modal, Progress, QRCode, Space, Tag, Typography } from 'antd';
import { QrcodeOutlined, CheckCircleOutlined, CheckCircleFilled } from '@ant-design/icons';
import { theme } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import type { SessionAttendance } from '@/lib/services/class_session.service';
import type { StudentItem } from './AttendanceModal';
import styles from '../tab-schedule.module.scss';

dayjs.locale('vi');

/** Statuses that mean the student actually turned up. */
const ARRIVED = new Set(['present', 'late']);

interface Props {
    open: boolean;
    token: string;
    expiresAt: string;
    sessionNumber: number | null;
    sessionDate: string | null;
    studentList: StudentItem[];
    attendances: SessionAttendance[] | undefined;
    onClose: () => void;
}

export function QrCodeModal({
    open,
    token: qrToken,
    expiresAt,
    sessionNumber,
    sessionDate,
    studentList,
    attendances,
    onClose,
}: Props) {
    const { token } = theme.useToken();

    // The QR is generated for whichever day is selected on the calendar, which is
    // not always today. Scans then land on that other session and the teacher
    // sees nothing on the session they are actually watching — so say it plainly.
    const isForToday = sessionDate ? dayjs(sessionDate).isSame(dayjs(), 'day') : true;

    const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/attendance/qr?token=${qrToken}`;

    const arrivedNames = useMemo(() => {
        if (!attendances?.length) return [];
        const nameById = new Map(studentList.map((s) => [s.id, s.name]));
        return attendances
            .filter((a) => ARRIVED.has(a.status))
            .map((a) => nameById.get(a.student_id))
            .filter((name): name is string => Boolean(name));
    }, [attendances, studentList]);

    const total = studentList.length;
    const arrived = arrivedNames.length;
    const percent = total > 0 ? Math.round((arrived / total) * 100) : 0;

    return (
        <Modal
            title={
                <Space>
                    <QrcodeOutlined />
                    <span>
                        {sessionNumber != null
                            ? `Mã QR — Buổi ${sessionNumber} (${dayjs(sessionDate).format('DD/MM/YYYY')})`
                            : 'Mã QR điểm danh'}
                    </span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={380}
            destroyOnHidden
            centered
        >
            {!isForToday && (
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={`Mã này thuộc buổi ${dayjs(sessionDate).format('DD/MM/YYYY')}, không phải hôm nay`}
                    description="Học viên quét sẽ được ghi vào buổi đó. Chọn đúng ngày trên lịch rồi tạo lại mã nếu bạn muốn điểm danh hôm nay."
                />
            )}

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
                <Space orientation="vertical" align="center" size={6}>
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

            <Divider style={{ margin: '16px 0 12px' }} />

            {/* Live roster: the list refreshes on its own as students scan. */}
            <div>
                <Space
                    style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}
                >
                    <Typography.Text strong>Đã điểm danh</Typography.Text>
                    <Typography.Text strong style={{ color: token.colorSuccess }}>
                        {arrived}/{total}
                    </Typography.Text>
                </Space>

                <Progress
                    percent={percent}
                    showInfo={false}
                    strokeColor={token.colorSuccess}
                    size="small"
                />

                {arrived === 0 ? (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Chưa có học viên nào quét mã.
                    </Typography.Text>
                ) : (
                    <div style={{ marginTop: 10, maxHeight: 132, overflowY: 'auto' }}>
                        <Space size={[6, 6]} wrap>
                            {arrivedNames.map((name) => (
                                <Tag
                                    key={name}
                                    color="success"
                                    icon={<CheckCircleFilled />}
                                    style={{ margin: 0 }}
                                >
                                    {name}
                                </Tag>
                            ))}
                        </Space>
                    </div>
                )}
            </div>
        </Modal>
    );
}
