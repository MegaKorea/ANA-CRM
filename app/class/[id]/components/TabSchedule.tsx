import { Result, Typography } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import type { Class } from '@/lib/services/class.service';

export function TabSchedule({ classData }: { classData: Class }) {
    return (
        <div style={{ padding: '40px 0' }}>
            <Result
                icon={<SyncOutlined spin style={{ color: '#1890ff' }} />}
                title={<Typography.Title level={4}>Đang phát triển</Typography.Title>}
                subTitle="Tính năng quản lý thời khóa biểu của lớp học đang trong quá trình phát triển."
            />
        </div>
    );
}
