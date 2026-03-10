'use client';

import { Tabs, Spin, Typography, Card, Breadcrumb, Space, Tag } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { useClass } from '@/lib/hooks/use-classes';

import { TabBasicInfo } from './components/TabBasicInfo';
import { TabTeachers } from './components/TabTeachers';
import { TabStudents } from './components/TabStudents';
import { TabSchedule } from './components/TabSchedule';
import { getClassStatusMeta } from '@/lib/constants/classStatus';

const { Title, Text } = Typography;

export default function ClassDetailPage() {
    const params = useParams();
    const classId = params.id as string;

    const { data: classData, isLoading } = useClass(classId);

    if (isLoading) {
        return <div className="p-8 flex justify-center h-full items-center"><Spin size="large" /></div>;
    }

    if (!classData) {
        return <div className="p-8 text-center"><Text type="secondary">Không tìm thấy thông tin lớp học.</Text></div>;
    }

    const statusMeta = getClassStatusMeta(classData.status);

    return (
        <div className="p-6 h-full overflow-y-auto">
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item href="/">
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item href="/class">
                    Danh sách lớp học
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    {classData.name} {classData.code ? `(${classData.code})` : ''}
                </Breadcrumb.Item>
            </Breadcrumb>

            <div style={{ marginBottom: 24 }}>
                <Space align="center" size="large">
                    <Title level={2} style={{ margin: 0 }}>
                        {classData.name}
                    </Title>
                    <Tag color={statusMeta.color} style={{ fontSize: 14, padding: '4px 8px' }}>
                        {statusMeta.label}
                    </Tag>
                </Space>
                {classData.courses && (
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Khóa học: </Text>
                        <Text strong>{classData.courses.name}</Text>
                    </div>
                )}
            </div>

            <Card className="h-full">
                <Tabs
                    defaultActiveKey="basic_info"
                    items={[
                        {
                            label: 'Thông tin cơ bản',
                            key: 'basic_info',
                            children: <TabBasicInfo classData={classData} />,
                        },
                        {
                            label: 'Giáo viên',
                            key: 'teachers',
                            children: <TabTeachers classData={classData} />,
                        },
                        {
                            label: 'Học viên',
                            key: 'students',
                            children: <TabStudents classData={classData} />,
                        },
                        {
                            label: 'Lịch mở lớp',
                            key: 'schedule',
                            children: <TabSchedule classData={classData} />,
                        },
                    ]}
                />
            </Card>
        </div>
    );
}
