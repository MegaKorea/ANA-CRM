import { Table, Typography, List, Card, Space } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import type { Class } from '@/lib/services/class.service';

dayjs.locale('vi');

export function TabSchedule({ classData }: { classData: Class }) {
    if (!classData.timetable || !classData.start_date || !classData.end_date) {
        return (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Typography.Text type="secondary">
                    Vui lòng cập nhật "Thời khóa biểu", "Ngày bắt đầu" và "Ngày kết thúc" ở mục Thông tin cơ bản để xem lịch học.
                </Typography.Text>
            </div>
        );
    }

    const start = dayjs(classData.start_date);
    const end = dayjs(classData.end_date);
    const scheduleData = [];
    let current = start.clone();
    let sessionCount = 1;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
        if (current.day() !== 0) {
            let timeStr = '';
            if (classData.timetable === 'Sáng') {
                timeStr = '8h00 - 9h40 | Nghỉ: 9h40 - 10h00 | 10h00 - 11h45';
            } else if (classData.timetable === 'Chiều') {
                timeStr = '13h00 - 14h40 | Nghỉ: 14h40 - 15h00 | 15h00 - 16h45';
            } else if (classData.timetable === 'Tối') {
                timeStr = '18h00 - 21h00 (Nghỉ linh động 10 phút giữa giờ)';
            }

            scheduleData.push({
                key: current.format('YYYY-MM-DD'),
                session: `Buổi ${sessionCount}`,
                date: current.format('DD/MM/YYYY'),
                dayOfWeek: getDayOfWeek(current.day()),
                timetable: classData.timetable,
                time: timeStr,
            });
            sessionCount++;
        }
        current = current.add(1, 'day');
    }

    const columns = [
        { title: 'Buổi học', dataIndex: 'session', key: 'session', width: 100 },
        { title: 'Ngày học', dataIndex: 'date', key: 'date', width: 150 },
        { title: 'Thứ', dataIndex: 'dayOfWeek', key: 'dayOfWeek', width: 120 },
        { title: 'Buổi', dataIndex: 'timetable', key: 'timetable', width: 100 },
        { title: 'Thời gian', dataIndex: 'time', key: 'time' },
    ];

    const todayStr = dayjs().format('YYYY-MM-DD');
    const isMobile = useIsMobile();

    return (
        <div style={{ paddingTop: 20 }}>
            {isMobile ? (
                <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={scheduleData}
                    pagination={{ pageSize: 20, size: 'small', align: 'center' }}
                    renderItem={(item) => {
                        const isToday = item.key === todayStr;
                        return (
                            <List.Item>
                                <Card
                                    size="small"
                                    className={`w-full ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''}`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <Typography.Text strong className="text-blue-600 dark:text-blue-400 text-lg">
                                            {item.session}
                                        </Typography.Text>
                                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${isToday ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                            {item.dayOfWeek}
                                        </div>
                                    </div>
                                    <Space direction="vertical" size={8} className="w-full">
                                        <div className="flex items-center gap-2">
                                            <CalendarOutlined className="text-gray-400" />
                                            <Typography.Text strong={isToday} className={isToday ? 'text-blue-700 dark:text-blue-300' : ''}>
                                                {item.date}
                                            </Typography.Text>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookOutlined className="text-gray-400" />
                                            <Typography.Text>Ca học: {item.timetable}</Typography.Text>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <ClockCircleOutlined className="text-gray-400 mt-1" />
                                            <Typography.Text className="text-sm text-gray-600 dark:text-gray-300">{item.time}</Typography.Text>
                                        </div>
                                    </Space>
                                </Card>
                            </List.Item>
                        );
                    }}
                />
            ) : (
                <Table
                    columns={columns}
                    dataSource={scheduleData}
                    pagination={{ pageSize: 20 }}
                    bordered
                    scroll={{ x: 'max-content' }}
                    rowClassName={(record) => record.key === todayStr ? 'bg-blue-50/50 dark:bg-blue-900/20 font-medium' : ''}
                />
            )}
        </div>
    );
}

function getDayOfWeek(day: number) {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[day];
}
