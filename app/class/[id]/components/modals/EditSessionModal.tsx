'use client';

import { Modal, Select, Input, Typography, Divider, Space } from 'antd';
import { EditOutlined, EnvironmentOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { useState } from 'react';
import type { ClassSession } from '@/lib/services/class_session.service';

dayjs.locale('vi');

const { TextArea } = Input;


const ROOM_OPTIONS = [
    { value: 'PHÒNG A', label: 'PHÒNG A' },
    { value: 'PHÒNG B', label: 'PHÒNG B' },
];

export interface EditSessionValues {
    teacher_id: string | null;
    content: string | null;
    room: string | null;
}

interface Props {
    open: boolean;
    session: ClassSession | null;
    teacherOptions: { value: string; label: string }[];
    isMobile: boolean;
    loading: boolean;
    onOk: (values: EditSessionValues) => void;
    onCancel: () => void;
}

export function EditSessionModal({ open, session, teacherOptions, isMobile, loading, onOk, onCancel }: Props) {
    const { token } = theme.useToken();

    const [prevSessionId, setPrevSessionId] = useState<string | null>(null);
    const [teacherId, setTeacherId] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [room, setRoom] = useState<string | null>(null);

    if (open && session && session.id !== prevSessionId) {
        setPrevSessionId(session.id);
        setTeacherId(session.teacher_id);
        setContent(session.content || '');
        setRoom(session.room || null);
    }

    const handleOk = () => {
        onOk({ teacher_id: teacherId, content: content || null, room: room || null });
    };

    return (
        <Modal
            title={
                <Space>
                    <EditOutlined />
                    <span>{session ? `Chỉnh sửa Buổi ${session.session_number}` : 'Chỉnh sửa buổi học'}</span>
                    {session && (
                        <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                            — {dayjs(session.date).format('dddd, DD/MM/YYYY')}
                        </Typography.Text>
                    )}
                </Space>
            }
            open={open}
            centered
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            okText="Lưu thay đổi"
            cancelText="Huỷ"
            destroyOnHidden
            width={isMobile ? '95vw' : 520}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
                {/* Room */}
                <div>
                    <Typography.Text strong style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <EnvironmentOutlined style={{ color: token.colorPrimary }} />
                        Phòng học
                    </Typography.Text>
                    <Select
                        style={{ width: '100%' }}
                        value={room}
                        onChange={setRoom}
                        allowClear
                        placeholder="Chọn phòng học..."
                        options={ROOM_OPTIONS}
                        size="middle"
                    />
                </div>

                <Divider style={{ margin: '2px 0' }} />

                {/* Teacher */}
                <div>
                    <Typography.Text strong style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <UserOutlined style={{ color: token.colorPrimary }} />
                        Giáo viên phụ trách
                    </Typography.Text>
                    <Select
                        style={{ width: '100%' }}
                        value={teacherId}
                        onChange={setTeacherId}
                        allowClear
                        placeholder="Mặc định: Giáo viên chủ nhiệm"
                        options={teacherOptions}
                        size="middle"
                    />
                </div>

                {/* Content */}
                <div>
                    <Typography.Text strong style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BookOutlined style={{ color: token.colorPrimary }} />
                        Nội dung bài giảng
                    </Typography.Text>
                    <TextArea
                        rows={4}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Nhập nội dung bài giảng, chủ đề, LMS..."
                        showCount
                        maxLength={500}
                    />
                </div>
            </div>
        </Modal>
    );
}
