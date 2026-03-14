import {
  Table, Typography, List, Space, Tag, Button, Modal, Badge, Tooltip,
  message, Spin, Empty,
} from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, BookOutlined,
  EditOutlined, QrcodeOutlined,
  UserOutlined, SyncOutlined, TeamOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { theme } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import type { Class } from '@/lib/services/class.service';
import type { ClassSession } from '@/lib/services/class_session.service';
import {
  useClassSessions,
  useGenerateSessions,
  useUpdateSession,
  useGenerateQrToken,
  useSessionAttendances,
  useBulkUpsertAttendances,
} from '@/lib/hooks/use-class-sessions';
import { useSubjectTeachers, useClassStudents } from '@/lib/hooks/use-classes';
import { EditSessionModal, type EditSessionValues } from './modals/EditSessionModal';
import { AttendanceModal, type AttendanceRecord } from './modals/AttendanceModal';
import { QrCodeModal } from './modals/QrCodeModal';
import { StudentScannerModal } from './modals/StudentScannerModal';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { ScanOutlined } from '@ant-design/icons';
import styles from './tab-schedule.module.scss';
import { useState, useMemo, useCallback } from 'react';

dayjs.locale('vi');

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMETABLE_CONFIG: Record<string, { tiet1: string; tiet2: string }> = {
  Sáng: { tiet1: '8h00 - 9h40', tiet2: '10h00 - 11h45' },
  Chiều: { tiet1: '13h00 - 14h40', tiet2: '15h00 - 16h45' },
  Tối: { tiet1: '18h00 - 19h30', tiet2: '19h40 - 21h00' },
};

function getDayOfWeek(day: number) {
  return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day];
}
function getDayOfWeekFull(day: number) {
  return ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][day];
}

function getSessionStatus(dateStr: string, todayStr: string) {
  if (dateStr < todayStr) return 'past';
  if (dateStr === todayStr) return 'today';
  return 'upcoming';
}

const STATUS_DOT: Record<string, string> = {
  past: '#8c8c8c',
  today: '#1677ff',
  upcoming: '#52c41a',
};

// ─── TabSchedule ──────────────────────────────────────────────────────────────

export function TabSchedule({ classData }: { classData: Class }) {
  const { hasPermission: notStudent } = useAuthPermission(['ADMIN', 'AO', 'TEA']);
  const { token } = theme.useToken();
  const isMobile = useIsMobile();

  const classId = classData.id;
  const { data: sessions, isLoading: sessionsLoading } = useClassSessions(classId);
  const { data: subjectTeachers } = useSubjectTeachers(classId);
  const { data: classStudents } = useClassStudents(classId);
  const generateSessions = useGenerateSessions(classId);
  const updateSession = useUpdateSession(classId);
  const generateQr = useGenerateQrToken(classId);
  const bulkUpsert = useBulkUpsertAttendances(classId);

  // ─── Edit modal state ──────────────────────────────────────────────────────
  const [editModal, setEditModal] = useState<{ open: boolean; session: ClassSession | null }>({
    open: false, session: null,
  });

  // ─── Attendance modal state ────────────────────────────────────────────────
  const [attendanceSession, setAttendanceSession] = useState<ClassSession | null>(null);
  const attendanceOpen = attendanceSession !== null;
  const { data: attendanceData, isLoading: attendanceLoading } = useSessionAttendances(
    attendanceSession?.id ?? null
  );

  // ─── QR modal state ───────────────────────────────────────────────────────
  const [qrModal, setQrModal] = useState<{ open: boolean; token: string; expiresAt: string }>({
    open: false, token: '', expiresAt: '',
  });

  // ─── Student Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);

  const hasSessions = sessions && sessions.length > 0;
  const hasRequiredDates = classData.start_date && classData.end_date;

  // ─── Teacher options (for edit modal) ─────────────────────────────────────
  const teacherOptions = useMemo(() => {
    const teachers: { value: string; label: string }[] = [];
    if (classData.teacher) {
      teachers.push({ value: classData.teacher.id, label: `${classData.teacher.full_name} (Chủ nhiệm)` });
    }
    subjectTeachers?.forEach((st: any) => {
      if (st.users && !teachers.find((t) => t.value === st.users.id)) {
        teachers.push({
          value: st.users.id,
          label: `${st.users.full_name}${st.subject ? ` - ${st.subject}` : ''}`,
        });
      }
    });
    return teachers;
  }, [classData.teacher, subjectTeachers]);

  // ─── Student list (for attendance modal) ──────────────────────────────────
  const studentList = useMemo(() => {
    if (!classStudents) return [];
    return classStudents.map((cs: any) => ({
      id: cs.student_id,
      name: cs.leads?.full_name || 'N/A',
      phone: cs.leads?.phone_number || '',
    }));
  }, [classStudents]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleGenerateSessions = useCallback(() => {
    if (!classData.start_date || !classData.end_date) {
      message.warning('Vui lòng cập nhật ngày bắt đầu và ngày kết thúc trước.');
      return;
    }
    Modal.confirm({
      title: 'Tạo lịch học tự động?',
      content: hasSessions
        ? 'Hành động này sẽ xoá toàn bộ lịch cũ và tạo lại. Dữ liệu điểm danh cũng sẽ bị xoá. Bạn chắc chắn?'
        : 'Hệ thống sẽ tự động tạo lịch học dựa trên ngày bắt đầu & kết thúc.',
      okText: 'Tạo lịch', cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await generateSessions.mutateAsync({
            classId,
            startDate: classData.start_date!,
            endDate: classData.end_date!,
            schedule: classData.schedule,
          });
          message.success('Đã tạo lịch học thành công!');
        } catch (e: any) {
          message.error(e.message || 'Tạo lịch thất bại.');
        }
      },
    });
  }, [classData, classId, generateSessions, hasSessions]);

  const handleSaveSession = useCallback(async (values: EditSessionValues) => {
    if (!editModal.session) return;
    try {
      await updateSession.mutateAsync({ sessionId: editModal.session.id, data: values });
      message.success('Đã cập nhật buổi học.');
      setEditModal({ open: false, session: null });
    } catch (e: any) {
      message.error(e.message || 'Cập nhật thất bại.');
    }
  }, [editModal.session, updateSession]);

  const handleSaveAttendances = useCallback(async (records: AttendanceRecord[]) => {
    if (!attendanceSession) return;
    try {
      await bulkUpsert.mutateAsync({ sessionId: attendanceSession.id, records });
      message.success('Đã lưu điểm danh.');
      setAttendanceSession(null);
    } catch (e: any) {
      message.error(e.message || 'Lưu điểm danh thất bại.');
    }
  }, [attendanceSession, bulkUpsert]);

  const handleGenerateQr = useCallback(async (session: ClassSession) => {
    try {
      const result = await generateQr.mutateAsync(session.id);
      setQrModal({ open: true, token: result.token, expiresAt: result.expiresAt });
    } catch (e: any) {
      message.error(e.message || 'Tạo mã QR thất bại.');
    }
  }, [generateQr]);

  // ─── Guard states ──────────────────────────────────────────────────────────
  if (!hasRequiredDates) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <Empty
          description={
            <Typography.Text type="secondary">
              Vui lòng cập nhật <strong>Ngày bắt đầu</strong> và <strong>Ngày kết thúc</strong> ở mục Thông tin cơ bản để xem lịch học.
            </Typography.Text>
          }
        />
      </div>
    );
  }

  if (sessionsLoading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 12 }}>
          <Typography.Text type="secondary">Đang tải lịch học...</Typography.Text>
        </div>
      </div>
    );
  }

  if (!hasSessions) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Typography.Text type="secondary">Chưa có lịch học. Hãy tạo lịch tự động.</Typography.Text>}
        />
        {notStudent && (
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={handleGenerateSessions}
            loading={generateSessions.isPending}
            style={{ marginTop: 16 }}
          >
            Tạo lịch học tự động
          </Button>
        )}
        {!notStudent && (
          <Button
            type="primary"
            icon={<ScanOutlined />}
            onClick={() => setScannerOpen(true)}
            style={{ marginTop: 16 }}
          >
            Quét mã điểm danh
          </Button>
        )}
      </div>
    );
  }

  // ─── Build table data ──────────────────────────────────────────────────────
  const todayStr = dayjs().format('YYYY-MM-DD');
  const timeCfg = classData.timetable ? TIMETABLE_CONFIG[classData.timetable] : null;

  const tableData = sessions!.map((s: ClassSession) => {
    const status = getSessionStatus(s.date, todayStr);
    return {
      key: s.id,
      session: s,
      sessionLabel: `Buổi ${s.session_number}`,
      date: dayjs(s.date).format('DD/MM/YYYY'),
      dayOfWeek: getDayOfWeekFull(dayjs(s.date).day()),
      dayShort: getDayOfWeek(dayjs(s.date).day()),
      timetable: classData.timetable || '—',
      tiet1: timeCfg?.tiet1 || '—',
      tiet2: timeCfg?.tiet2 || '—',
      isToday: s.date === todayStr,
      status,
      teacherName: s.teacher?.full_name || classData.teacher?.full_name || '—',
      content: s.content || '',
      room: s.room || '',
      hasQr: !!s.qr_code_token,
    };
  });

  // ─── Desktop Columns ───────────────────────────────────────────────────────
  const columns = [
    {
      title: '#',
      dataIndex: 'sessionLabel',
      key: 'session',
      width: 100,
      render: (val: string, r: any) => (
        <Space size={6} align="center">
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[r.status], flexShrink: 0 }} />
          <Typography.Text style={{ fontSize: 13 }}>{val}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 200,
      render: (val: string, r: any) => (
        <Space size={4} align="center">
          <Typography.Text strong={r.isToday} style={{ fontSize: 13, color: r.isToday ? token.colorPrimary : undefined }}>
            {r.dayShort} {val}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Tiết 1',
      dataIndex: 'tiet1',
      key: 'tiet1',
      width: 130,
      render: (val: string) => (
        <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />{val}
        </Typography.Text>
      ),
    },
    {
      title: 'Tiết 2',
      dataIndex: 'tiet2',
      key: 'tiet2',
      width: 130,
      render: (val: string) => (
        <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />{val}
        </Typography.Text>
      ),
    },
    {
      title: 'Phòng',
      dataIndex: 'room',
      key: 'room',
      width: 150,
      render: (val: string) =>
        val ? (
          <Tag icon={<EnvironmentOutlined />} color="cyan" style={{ margin: 0 }}>{val}</Tag>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>
        ),
    },
    {
      title: 'Giáo viên',
      dataIndex: 'teacherName',
      key: 'teacher',
      width: 150,
      render: (val: string) => (
        <Space size={4}>
          <UserOutlined style={{ color: token.colorTextQuaternary, fontSize: 12 }} />
          <Typography.Text ellipsis style={{ maxWidth: 110, fontSize: 13 }}>{val}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (val: string) =>
        val ? (
          <Tooltip title={val}>
            <Typography.Text ellipsis style={{ maxWidth: 160, fontSize: 12 }}>{val}</Typography.Text>
          </Tooltip>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>—</Typography.Text>
        ),
    },
    ...(notStudent ? [{
      title: 'Hành động',
      key: 'actions',
      width: 110,
      render: (_: any, r: any) => (
        <Space size={2}>
          <Tooltip title="Sửa buổi học">
            <Button type="text" icon={<EditOutlined />} onClick={() => setEditModal({ open: true, session: r.session })} style={{ color: token.colorTextSecondary }} />
          </Tooltip>
          <Tooltip title="Điểm danh">
            <Button type="text" icon={<TeamOutlined />} onClick={() => setAttendanceSession(r.session)} style={{ color: token.colorTextSecondary }} />
          </Tooltip>
          <Tooltip title="Tạo mã QR điểm danh">
            <Button
              type="text"
              icon={r.hasQr ? <Badge dot color="green"><QrcodeOutlined /></Badge> : <QrcodeOutlined />}
              onClick={() => handleGenerateQr(r.session)}
              style={{ color: token.colorTextSecondary }}
            />
          </Tooltip>
        </Space>
      ),
    }] : []),
  ];

  const totalSessions = tableData.length;
  const pastSessions = tableData.filter((d) => d.status === 'past').length;
  const todaySessions = tableData.filter((d) => d.status === 'today').length;
  const upcomingSessions = tableData.filter((d) => d.status === 'upcoming').length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.dot} style={{ background: '#8c8c8c' }} />
            <span>{pastSessions} đã qua</span>
          </div>
          {todaySessions > 0 && (
            <div className={styles.summaryItem}>
              <span className={styles.dot} style={{ background: '#1677ff' }} />
              <span>{todaySessions} hôm nay</span>
            </div>
          )}
          <div className={styles.summaryItem}>
            <span className={styles.dot} style={{ background: '#52c41a' }} />
            <span>{upcomingSessions} sắp tới</span>
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Tổng: {totalSessions} buổi
          </Typography.Text>
        </div>
        {notStudent ? (
          <Button icon={<SyncOutlined />} onClick={handleGenerateSessions} loading={generateSessions.isPending} size="small">
            {isMobile ? 'Tạo lại' : 'Tạo lại lịch'}
          </Button>
        ) : (
          <Button type="primary" icon={<ScanOutlined />} onClick={() => setScannerOpen(true)} size="small">
            Quét mã
          </Button>
        )}
      </div>
      {isMobile ? (
        <List
          dataSource={tableData}
          pagination={{ pageSize: 15, size: 'small', align: 'center' }}
          renderItem={(item) => (
            <List.Item style={{ padding: 0, marginBottom: 10 }}>
              <div className={`${styles.card} ${item.isToday ? styles.cardToday : item.status === 'past' ? styles.cardPast : ''}`}>
                <div className={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[item.status], flexShrink: 0 }} />
                    <Typography.Text strong style={{ fontSize: 14 }}>{item.sessionLabel}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>— {item.dayOfWeek}</Typography.Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {item.isToday && <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>Hôm nay</Tag>}
                    {item.room && <Tag icon={<EnvironmentOutlined />} color="cyan" style={{ margin: 0, fontSize: 11 }}>{item.room}</Tag>}
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardRow}>
                    <CalendarOutlined className={styles.cardIcon} />
                    <Typography.Text strong={item.isToday} style={{ fontSize: 13, color: item.isToday ? token.colorPrimary : undefined }}>
                      {item.date}
                    </Typography.Text>
                    {item.timetable !== '—' && <Tag color="geekblue" style={{ margin: 0, fontSize: 11 }}>{item.timetable}</Tag>}
                  </div>
                  <div className={styles.cardRow}>
                    <ClockCircleOutlined className={styles.cardIcon} />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      T1: {item.tiet1} &nbsp;|&nbsp; T2: {item.tiet2}
                    </Typography.Text>
                  </div>
                  <div className={styles.cardRow}>
                    <UserOutlined className={styles.cardIcon} />
                    <Typography.Text style={{ fontSize: 13 }}>{item.teacherName}</Typography.Text>
                  </div>
                  {item.content && (
                    <div className={styles.cardRow}>
                      <BookOutlined className={styles.cardIcon} />
                      <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>{item.content}</Typography.Text>
                    </div>
                  )}
                </div>
                {notStudent && (
                  <div className={styles.cardActions}>
                    <button className={styles.cardActionBtn} onClick={() => setEditModal({ open: true, session: item.session })}>
                      <EditOutlined /> Sửa
                    </button>
                    <button className={styles.cardActionBtn} onClick={() => setAttendanceSession(item.session)}>
                      <TeamOutlined /> Điểm danh
                    </button>
                    <button className={styles.cardActionBtn} onClick={() => handleGenerateQr(item.session)}>
                      {item.hasQr ? <Badge dot color="green"><QrcodeOutlined /></Badge> : <QrcodeOutlined />} QR
                    </button>
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={{ pageSize: 20, size: 'small' }}
          bordered={false}
          scroll={{ x: 'max-content' }}
          onRow={(record) =>
            record.isToday
              ? { style: { background: 'rgba(22,119,255,0.05)', fontWeight: 500 } }
              : record.status === 'past'
                ? { style: { opacity: 0.65 } }
                : {}
          }
        />
      )}
      <EditSessionModal
        open={editModal.open}
        session={editModal.session}
        teacherOptions={teacherOptions}
        isMobile={isMobile}
        loading={updateSession.isPending}
        onOk={handleSaveSession}
        onCancel={() => setEditModal({ open: false, session: null })}
      />

      <AttendanceModal
        open={attendanceOpen}
        session={attendanceSession}
        studentList={studentList}
        attendanceData={attendanceData}
        attendanceLoading={attendanceLoading}
        isMobile={isMobile}
        loading={bulkUpsert.isPending}
        onSave={handleSaveAttendances}
        onCancel={() => setAttendanceSession(null)}
      />

      <QrCodeModal
        open={qrModal.open}
        token={qrModal.token}
        expiresAt={qrModal.expiresAt}
        onClose={() => setQrModal({ open: false, token: '', expiresAt: '' })}
      />

      <StudentScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}
