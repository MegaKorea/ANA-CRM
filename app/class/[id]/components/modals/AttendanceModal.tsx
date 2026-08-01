'use client';

import { Modal, List, Select, Tag, Typography, Space, Empty } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { useState, useMemo } from 'react';
import type { ClassSession, SessionAttendance } from '@/lib/services/class_session.service';
import type { AttendanceStatus } from '@/lib/supabase/types/tables/session_attendances';
import { ScheduleLoading } from '../ScheduleLoading';

dayjs.locale('vi');

const ATTENDANCE_STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string }> = {
    present: { label: 'Có mặt', color: 'success' },
    absent: { label: 'Vắng', color: 'error' },
    late: { label: 'Đi trễ', color: 'warning' },
    excused: { label: 'Có phép', color: 'processing' },
    not_arrived: { label: 'Chưa đến', color: 'default' },
};

export interface StudentItem {
    id: string;
    name: string;
    phone: string;
}

export interface AttendanceRecord {
    student_id: string;
    status: AttendanceStatus;
    notes: string | null;
}

interface Props {
    open: boolean;
    session: ClassSession | null;
    studentList: StudentItem[];
    attendanceData: SessionAttendance[] | undefined;
    attendanceLoading: boolean;
    isMobile: boolean;
    loading: boolean;
    onSave: (records: AttendanceRecord[]) => void;
    onCancel: () => void;
}

export function AttendanceModal({
    open,
    session,
    studentList,
    attendanceData,
    attendanceLoading,
    isMobile,
    loading,
    onSave,
    onCancel,
}: Props) {
    const [prevSessionId, setPrevSessionId] = useState<string | null>(null);
    const [localAttendances, setLocalAttendances] = useState<
        Record<string, { status: AttendanceStatus; notes: string }>
    >({});

    if (open && session && session.id !== prevSessionId) {
        setPrevSessionId(session.id);
        setLocalAttendances({});
    }

    const mergedAttendances = useMemo(() => {
        const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
        // Default: not_arrived for everyone
        studentList.forEach((s) => { map[s.id] = { status: 'not_arrived', notes: '' }; });
        // Override with server data
        attendanceData?.forEach((a) => { map[a.student_id] = { status: a.status, notes: a.notes || '' }; });
        // Override with local edits
        Object.entries(localAttendances).forEach(([id, val]) => { map[id] = val; });
        return map;
    }, [studentList, attendanceData, localAttendances]);

    const handleOk = () => {
        const records = Object.entries(mergedAttendances).map(([student_id, val]) => ({
            student_id,
            status: val.status,
            notes: val.notes || null,
        }));
        onSave(records);
    };

    const title = session
        ? `Điểm danh — Buổi ${session.session_number} (${dayjs(session.date).format('DD/MM/YYYY')})`
        : 'Điểm danh';

    return (
        <Modal
            title={title}
            open={open}
            onCancel={onCancel}
            centered
            onOk={handleOk}
            confirmLoading={loading}
            okText="Lưu điểm danh"
            cancelText="Huỷ"
            width={isMobile ? '95vw' : 640}
            destroyOnHidden
        >
            {attendanceLoading ? (
                <ScheduleLoading tip="Đang tải…" />
            ) : studentList.length === 0 ? (
                <Empty description="Lớp chưa có học viên." />
            ) : (
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <List
                        dataSource={studentList}
                        renderItem={(student, index) => {
                            const att = mergedAttendances[student.id] || { status: 'not_arrived' as AttendanceStatus, notes: '' };
                            return (
                                <List.Item style={{ padding: '10px 4px' }}>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                        <Space>
                                            <Typography.Text type="secondary" style={{ minWidth: 24 }}>{index + 1}.</Typography.Text>
                                            <Typography.Text strong style={{ fontSize: 13 }}>{student.name}</Typography.Text>
                                            {student.phone && (
                                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{student.phone}</Typography.Text>
                                            )}
                                        </Space>
                                        <Select
                                            style={{ minWidth: 140 }}
                                            size="small"
                                            value={att.status}
                                            onChange={(val: AttendanceStatus) =>
                                                setLocalAttendances((prev) => ({
                                                    ...prev,
                                                    [student.id]: { ...att, status: val },
                                                }))
                                            }
                                        >
                                            {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([key, cfg]) => (
                                                <Select.Option key={key} value={key}>
                                                    <Tag color={cfg.color} style={{ margin: 0 }}>{cfg.label}</Tag>
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                </div>
            )}
        </Modal>
    );
}
