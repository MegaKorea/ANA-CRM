import { useCallback, useMemo, useState } from 'react';
import { Button, Table, Space, Tag, Popconfirm, message, Select, Row, Col, Typography } from 'antd';
import { DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { useClassStudents, useAddClassStudent, useRemoveClassStudent } from '@/lib/hooks/use-classes';
import { useLeads } from '@/lib/hooks/use-leads';
import type { Class } from '@/lib/services/class.service';
import dayjs from 'dayjs';

const { Text } = Typography;

const studentStatusMeta: Record<string, { label: string; color: string }> = {
    active: { label: 'Đang học', color: 'green' },
    withdrawn: { label: 'Đã rút', color: 'red' },
    completed: { label: 'Hoàn thành', color: 'blue' },
};

export function TabStudents({ classData }: { classData: Class }) {
    const { data: students, isLoading } = useClassStudents(classData.id);
    const { data: leadsData, isLoading: isLeadsLoading } = useLeads({ limit: 100, page: 1 });

    const addStudentMutation = useAddClassStudent(classData.id);
    const removeStudentMutation = useRemoveClassStudent(classData.id);

    const [selectedLeadId, setSelectedLeadId] = useState<number | undefined>(undefined);

    const handleAddStudent = useCallback(() => {
        if (!selectedLeadId) return;

        // Check capacity
        if (classData.capacity && students && students.length >= classData.capacity) {
            message.error(`Lớp đã đạt sĩ số tối đa (${classData.capacity} học viên)`);
            return;
        }

        addStudentMutation.mutate({ classId: classData.id, studentId: selectedLeadId }, {
            onSuccess: () => {
                message.success('Thêm học viên vào lớp thành công');
                setSelectedLeadId(undefined);
            },
            onError: (error: any) => {
                message.error('Lỗi khi thêm học viên: ' + error.message);
            }
        });
    }, [addStudentMutation, classData.capacity, classData.id, selectedLeadId, students]);

    const handleRemoveStudent = useCallback(
        (studentId: string) => {
            removeStudentMutation.mutate(studentId, {
                onSuccess: () => {
                    message.success('Đã xóa học viên khỏi lớp');
                },
                onError: (error: any) => {
                    message.error('Lỗi khi xóa học viên: ' + error.message);
                },
            });
        },
        [removeStudentMutation]
    );

    const columns = useMemo(
        () => [
            {
                title: 'Họ tên',
                dataIndex: ['leads', 'full_name'],
                key: 'full_name',
                render: (text: string) => <Text strong>{text || 'N/A'}</Text>,
            },
            {
                title: 'SĐT',
                dataIndex: ['leads', 'phone_number'],
                key: 'phone_number',
            },
            {
                title: 'Email',
                dataIndex: ['leads', 'email'],
                key: 'email',
            },
            {
                title: 'Ngày tham gia',
                dataIndex: 'enrollment_date',
                key: 'enrollment_date',
                render: (text: string) => (text ? dayjs(text).format('DD/MM/YYYY') : ''),
            },
            {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (text: string) => {
                    const meta = studentStatusMeta[text] ?? { label: text || '—', color: 'default' };
                    return <Tag color={meta.color}>{meta.label}</Tag>;
                },
            },
            {
                title: 'Hành động',
                key: 'action',
                render: (_: any, record: any) => (
                    <Space size="middle">
                        <Popconfirm
                            title="Xóa khỏi lớp"
                            description="Bạn có muốn xóa học viên này khỏi lớp không?"
                            onConfirm={() => handleRemoveStudent(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="link" danger icon={<DeleteOutlined />}>
                                Xóa
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            },
        ].map(col => ({
            ...col,
            onCell: () => ({
                'data-label': typeof col.title === 'string' ? col.title : '',
            } as any),
        })),
        [handleRemoveStudent]
    );

    // Lọc leads chưa có trong lớp
    const availableLeadOptions = useMemo(() => {
        const leadList = leadsData?.data ?? [];
        const existingStudentIds = new Set((students ?? []).map((s: any) => s.student_id));
        return leadList
            .filter((lead: any) => !existingStudentIds.has(lead.id))
            .map((lead: any) => ({
                value: lead.id,
                label: `${lead.full_name}${lead.phone_number ? ` - ${lead.phone_number}` : ''}`,
            }));
    }, [leadsData?.data, students]);

    const isFull = classData.capacity && students && students.length >= classData.capacity;

    return (
        <div style={{ padding: '20px 0' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Space>
                        <Text strong>Sĩ số hiện tại:</Text>
                        <Tag color={isFull ? 'red' : 'green'}>
                            {students?.length || 0} {classData.capacity ? `/ ${classData.capacity}` : ''}
                        </Tag>
                        {isFull && <Text type="danger">(Đã đầy)</Text>}
                    </Space>
                </Col>
                <Col>
                    <Space>
                        <Select
                            showSearch
                            style={{ width: 250 }}
                            placeholder="Chọn học viên từ Leads"
                            loading={isLeadsLoading}
                            value={selectedLeadId}
                            onChange={setSelectedLeadId}
                            optionFilterProp="label"
                            options={availableLeadOptions}
                        />
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={handleAddStudent}
                            loading={addStudentMutation.isPending}
                            disabled={!selectedLeadId || !!isFull}
                        >
                            Thêm vào lớp
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table
                className="mobile-card-table"
                columns={columns}
                dataSource={students || []}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}
