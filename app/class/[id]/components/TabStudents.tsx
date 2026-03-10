import { useState } from 'react';
import { Button, Table, Space, Tag, Popconfirm, message, Select, Row, Col, Typography } from 'antd';
import { DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { useClassStudents, useAddClassStudent, useRemoveClassStudent } from '@/lib/hooks/use-classes';
import { useLeads } from '@/lib/hooks/use-leads';
import type { Class } from '@/lib/services/class.service';
import dayjs from 'dayjs';

const { Text } = Typography;

export function TabStudents({ classData }: { classData: Class }) {
    const { data: students, isLoading } = useClassStudents(classData.id);
    const { data: leadsData, isLoading: isLeadsLoading } = useLeads({ limit: 100, page: 1 });

    const addStudentMutation = useAddClassStudent(classData.id);
    const removeStudentMutation = useRemoveClassStudent(classData.id);

    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

    const handleAddStudent = () => {
        if (!selectedLeadId) return;

        // Check capacity
        if (classData.capacity && students && students.length >= classData.capacity) {
            message.error(`Lớp đã đạt sĩ số tối đa (${classData.capacity} học viên)`);
            return;
        }

        addStudentMutation.mutate({ classId: classData.id, studentId: selectedLeadId }, {
            onSuccess: () => {
                message.success('Thêm học viên vào lớp thành công');
                setSelectedLeadId(null);
            },
            onError: (error: any) => {
                message.error('Lỗi khi thêm học viên: ' + error.message);
            }
        });
    };

    const handleRemoveStudent = (studentId: string) => {
        removeStudentMutation.mutate(studentId, {
            onSuccess: () => {
                message.success('Đã xóa học viên khỏi lớp');
            },
            onError: (error: any) => {
                message.error('Lỗi khi xóa học viên: ' + error.message);
            }
        });
    };

    const columns = [
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
            render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (text: string) => {
                const colors: Record<string, string> = {
                    active: 'green',
                    withdrawn: 'red',
                    completed: 'blue'
                };
                const labels: Record<string, string> = {
                    active: 'Đang học',
                    withdrawn: 'Đã rút',
                    completed: 'Hoàn thành'
                };
                return <Tag color={colors[text] || 'default'}>{labels[text] || text}</Tag>;
            }
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
                        <Button type="link" danger icon={<DeleteOutlined />}>Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Lọc leads chưa có trong lớp
    const availableLeads = leadsData?.data?.filter(
        lead => !students?.some((student: any) => student.student_id === lead.id)
    ) || [];

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
                            optionFilterProp="children"
                            loading={isLeadsLoading}
                            value={selectedLeadId}
                            onChange={setSelectedLeadId}
                            filterOption={(input, option) =>
                                (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {availableLeads.map((lead: any) => (
                                <Select.Option key={lead.id} value={lead.id}>
                                    {lead.full_name} {lead.phone_number ? `- ${lead.phone_number}` : ''}
                                </Select.Option>
                            ))}
                        </Select>
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={handleAddStudent}
                            loading={addStudentMutation.isPending}
                            disabled={!selectedLeadId || isFull}
                        >
                            Thêm vào lớp
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={students || []}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}
