import { Table, Typography, List, Card, Space, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { theme } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import type { Class } from '@/lib/services/class.service';
import styles from './components.module.scss';

dayjs.locale('vi');

const TIMETABLE_CONFIG: Record<string, { tiet1: string; tiet2: string }> = {
  Sáng: { tiet1: '8h00 - 9h40', tiet2: '10h00 - 11h45' },
  Chiều: { tiet1: '13h00 - 14h40', tiet2: '15h00 - 16h45' },
  Tối: { tiet1: '18h00 - 19h30', tiet2: '19h40 - 21h00' },
};

function getDayOfWeek(day: number) {
  return ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][day];
}

type ScheduleRow = {
  key: string;
  session: string;
  date: string;
  dayOfWeek: string;
  timetable: string;
  tiet1: string;
  tiet2: string;
  isToday: boolean;
};

export function TabSchedule({ classData }: { classData: Class }) {
  const { token } = theme.useToken();
  const todayBg = token.colorPrimaryBg;
  const todayBorder = token.colorPrimaryBorder;
  const todayText = token.colorPrimaryText;
  const todayTextBold = token.colorPrimary;
  const iconColor = token.colorTextQuaternary;
  const subTextColor = token.colorTextSecondary;

  if (!classData.timetable || !classData.start_date || !classData.end_date) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <Typography.Text type="secondary">
          Vui lòng cập nhật "Thời khóa biểu", "Ngày bắt đầu" và "Ngày kết thúc" ở mục Thông tin cơ
          bản để xem lịch học.
        </Typography.Text>
      </div>
    );
  }

  const timeCfg = TIMETABLE_CONFIG[classData.timetable] ?? { tiet1: '', tiet2: '' };
  const todayStr = dayjs().format('YYYY-MM-DD');
  const scheduleData: ScheduleRow[] = [];
  let current = dayjs(classData.start_date);
  let sessionCount = 1;

  while (
    current.isBefore(dayjs(classData.end_date)) ||
    current.isSame(dayjs(classData.end_date), 'day')
  ) {
    if (current.day() !== 0) {
      const dateStr = current.format('YYYY-MM-DD');
      scheduleData.push({
        key: dateStr,
        session: `Buổi ${sessionCount++}`,
        date: current.format('DD/MM/YYYY'),
        dayOfWeek: getDayOfWeek(current.day()),
        timetable: classData.timetable,
        tiet1: timeCfg.tiet1,
        tiet2: timeCfg.tiet2,
        isToday: dateStr === todayStr,
      });
    }
    current = current.add(1, 'day');
  }

  const isMobile = useIsMobile();

  const columns = [
    { title: 'Buổi học', dataIndex: 'session', key: 'session', width: 100 },
    {
      title: 'Ngày học',
      dataIndex: 'date',
      key: 'date',
      width: 160,
      render: (val: string, r: ScheduleRow) => (
        <Space size={6}>
          <Typography.Text
            strong={r.isToday}
            style={r.isToday ? { color: todayTextBold } : undefined}
          >
            {val}
          </Typography.Text>
          {r.isToday && (
            <Tag color="blue" style={{ margin: 0 }}>
              Hôm nay
            </Tag>
          )}
        </Space>
      ),
    },
    { title: 'Thứ', dataIndex: 'dayOfWeek', key: 'dayOfWeek', width: 100 },
    { title: 'Ca học', dataIndex: 'timetable', key: 'timetable', width: 90 },
    { title: 'Tiết 1', dataIndex: 'tiet1', key: 'tiet1', width: 150 },
    { title: 'Tiết 2', dataIndex: 'tiet2', key: 'tiet2', width: 150 },
  ];

  return (
    <div className={styles.scheduleContainer}>
      {isMobile ? (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={scheduleData}
          pagination={{ pageSize: 20, size: 'small', align: 'center' }}
          renderItem={(item) => (
            <List.Item>
              <Card
                size="small"
                style={
                  item.isToday
                    ? {
                        borderColor: todayBorder,
                        background: todayBg,
                      }
                    : undefined
                }
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Typography.Text strong style={{ fontSize: 15, color: todayText }}>
                    {item.session} — {item.dayOfWeek}
                  </Typography.Text>
                  {item.isToday && <Tag color="blue">Hôm nay</Tag>}
                </div>

                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarOutlined style={{ color: iconColor }} />
                    <Typography.Text
                      strong={item.isToday}
                      style={item.isToday ? { color: todayTextBold } : undefined}
                    >
                      {item.date}
                    </Typography.Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BookOutlined style={{ color: iconColor }} />
                    <Typography.Text>Ca học: {item.timetable}</Typography.Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <ClockCircleOutlined style={{ color: iconColor, marginTop: 3 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography.Text style={{ fontSize: 13, color: subTextColor }}>
                        Tiết 1: {item.tiet1}
                      </Typography.Text>
                      <Typography.Text style={{ fontSize: 13, color: subTextColor }}>
                        Tiết 2: {item.tiet2}
                      </Typography.Text>
                    </div>
                  </div>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={scheduleData}
          pagination={{ pageSize: 20 }}
          bordered
          scroll={{ x: 'max-content' }}
          onRow={(record) =>
            record.isToday ? { style: { background: todayBg, fontWeight: 500 } } : {}
          }
        />
      )}
    </div>
  );
}
