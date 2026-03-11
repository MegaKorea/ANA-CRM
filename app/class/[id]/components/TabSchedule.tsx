import { Table, Typography } from 'antd';
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

    // Generate dates:
    const scheduleData = [];
    let current = start.clone();
    let sessionCount = 1;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
        // Exclude Sunday (day() === 0 in dayjs)
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

    return (
        <div style={{ paddingTop: 20 }}>
            <Table
                columns={columns}
                dataSource={scheduleData}
                pagination={{ pageSize: 20 }}
                bordered
                scroll={{ x: 'max-content' }}
            />
        </div>
    );
}

function getDayOfWeek(day: number) {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[day];
}
