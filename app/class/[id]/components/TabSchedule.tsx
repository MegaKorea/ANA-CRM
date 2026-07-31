'use client';

import {
  Typography, Button, Modal, Calendar,
  message, Spin, Empty,
} from 'antd';
import type { CalendarProps } from 'antd';
import { ClockCircleOutlined, SyncOutlined, ScanOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import dayjs, { type Dayjs } from 'dayjs';
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
import { ClassMemberRole } from '@/constants/enums';
import { normalizeClassTimetable } from '@/lib/validators/class.validator';
import { createCalendarHeaderRender } from './ScheduleCalendarNav';
import { ScheduleDayCell } from './ScheduleDayCell';
import { ScheduleDayDetail } from './ScheduleDayDetail';
import {
  buildSessionRows,
  countByStatus,
  formatCaLabel,
  cx,
} from './schedule.utils';
import styles from './tab-schedule.module.scss';
import { useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

dayjs.locale('vi');

const STAFF_ROLES = ['ADMIN', 'AO', 'TEA'] as const;

export function TabSchedule({ classData }: { classData: Class }) {
  const { hasPermission: canManage, isLoading: authLoading } = useAuthPermission([...STAFF_ROLES]);
  const { hasPermission: canEditLectures } = useAuthPermission([ClassMemberRole.TEA]);
  const { hasPermission: canTakeQuizzes } = useAuthPermission([ClassMemberRole.STU]);
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();

  const classId = classData.id;
  const { data: sessions, isLoading: sessionsLoading } = useClassSessions(classId);
  const { data: subjectTeachers } = useSubjectTeachers(classId);
  const { data: classStudents } = useClassStudents(classId);
  const generateSessions = useGenerateSessions(classId);
  const updateSession = useUpdateSession(classId);
  const generateQr = useGenerateQrToken(classId);
  const bulkUpsert = useBulkUpsertAttendances(classId);

  const classCa = normalizeClassTimetable(classData.timetable);
  const caLabel = formatCaLabel(classCa);

  // Single source of truth for calendar panel + day detail
  const [activeDate, setActiveDate] = useState<Dayjs>(() => {
    const fromQr = searchParams.get('date');
    const parsed = fromQr ? dayjs(fromQr) : dayjs();
    return parsed.isValid() ? parsed : dayjs();
  });
  const selectedDate = activeDate.format('YYYY-MM-DD');
  const [editSession, setEditSession] = useState<ClassSession | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<ClassSession | null>(null);
  const [qrModal, setQrModal] = useState<{ open: boolean; token: string; expiresAt: string }>({
    open: false, token: '', expiresAt: '',
  });
  const [scannerOpen, setScannerOpen] = useState(false);

  const detailRef = useRef<HTMLElement>(null);
  const todayStr = dayjs().format('YYYY-MM-DD');
  const hasSessions = Boolean(sessions?.length);
  const hasRequiredDates = Boolean(classData.start_date && classData.end_date);

  const { data: attendanceData, isLoading: attendanceLoading } = useSessionAttendances(
    attendanceSession?.id ?? null,
  );

  const teacherOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const seen = new Set<string>();

    if (classData.teacher) {
      seen.add(classData.teacher.id);
      options.push({
        value: classData.teacher.id,
        label: `${classData.teacher.full_name} (Chủ nhiệm)`,
      });
    }

    subjectTeachers?.forEach((st: { users?: { id: string; full_name: string }; subject?: string | null }) => {
      const user = st.users;
      if (!user || seen.has(user.id)) return;
      seen.add(user.id);
      options.push({
        value: user.id,
        label: `${user.full_name}${st.subject ? ` - ${st.subject}` : ''}`,
      });
    });

    return options;
  }, [classData.teacher, subjectTeachers]);

  const studentList = useMemo(() => {
    if (!classStudents) return [];
    // session_attendances.student_id FK → users.id
    return classStudents
      .filter((cs: { user_id?: string | null }) => !!cs.user_id)
      .map((cs: {
        user_id: string;
        leads?: { full_name?: string; phone_number?: string } | null;
      }) => ({
        id: cs.user_id,
        name: cs.leads?.full_name || 'N/A',
        phone: cs.leads?.phone_number || '',
      }));
  }, [classStudents]);

  const allRows = useMemo(
    () => buildSessionRows(sessions ?? [], todayStr, caLabel, classData.teacher?.full_name),
    [sessions, todayStr, caLabel, classData.teacher?.full_name],
  );

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, (typeof allRows)[number]>();
    for (const row of allRows) {
      // Keep first session per date (rows are ordered by session_number)
      if (!map.has(row.dateKey)) map.set(row.dateKey, row);
    }
    return map;
  }, [allRows]);

  const selectedSession = sessionsByDate.get(selectedDate) ?? null;
  const stats = useMemo(() => countByStatus(allRows), [allRows]);

  const scrollDetailIntoView = useCallback(() => {
    if (!isMobile) return;
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [isMobile]);

  const resetToToday = useCallback(() => {
    setActiveDate(dayjs());
  }, []);

  const handleGenerateSessions = useCallback(() => {
    if (!classData.start_date || !classData.end_date) {
      message.warning('Vui lòng cập nhật ngày bắt đầu và ngày kết thúc trước.');
      return;
    }

    Modal.confirm({
      title: 'Tạo lịch học tự động?',
      content: hasSessions
        ? 'Hành động này sẽ xoá toàn bộ lịch cũ và tạo lại. Dữ liệu điểm danh cũng sẽ bị xoá. Bạn chắc chắn?'
        : 'Hệ thống sẽ tự động tạo lịch học dựa trên ngày bắt đầu & kết thúc (bỏ qua Chủ nhật).',
      okText: 'Tạo lịch',
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await generateSessions.mutateAsync({
            classId,
            startDate: classData.start_date!,
            endDate: classData.end_date!,
            schedule: classData.schedule,
          });
          message.success('Đã tạo lịch học thành công!');
          resetToToday();
        } catch (e: unknown) {
          message.error(e instanceof Error ? e.message : 'Tạo lịch thất bại.');
        }
      },
    });
  }, [classData, classId, generateSessions, hasSessions, resetToToday]);

  const handleSaveSession = useCallback(async (values: EditSessionValues) => {
    if (!editSession) return;
    try {
      await updateSession.mutateAsync({ sessionId: editSession.id, data: values });
      message.success('Đã cập nhật buổi học.');
      setEditSession(null);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Cập nhật thất bại.');
    }
  }, [editSession, updateSession]);

  const handleSaveAttendances = useCallback(async (records: AttendanceRecord[]) => {
    if (!attendanceSession) return;
    try {
      await bulkUpsert.mutateAsync({ sessionId: attendanceSession.id, records });
      message.success('Đã lưu điểm danh.');
      setAttendanceSession(null);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Lưu điểm danh thất bại.');
    }
  }, [attendanceSession, bulkUpsert]);

  const handleGenerateQr = useCallback(async (session: ClassSession) => {
    try {
      const result = await generateQr.mutateAsync(session.id);
      setQrModal({ open: true, token: result.token, expiresAt: result.expiresAt });
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Tạo mã QR thất bại.');
    }
  }, [generateQr]);

  const onSelectDate = useCallback((value: Dayjs) => {
    setActiveDate(value);
    scrollDetailIntoView();
  }, [scrollDetailIntoView]);

  const goPrevMonth = useCallback(() => {
    setActiveDate((prev) => prev.subtract(1, 'month'));
  }, []);

  const goNextMonth = useCallback(() => {
    setActiveDate((prev) => prev.add(1, 'month'));
  }, []);

  const calendarHeaderRender = useMemo(
    () => createCalendarHeaderRender({
      isMobile,
      onChange: setActiveDate,
      onPrevMonth: goPrevMonth,
      onNextMonth: goNextMonth,
    }),
    [isMobile, goPrevMonth, goNextMonth],
  );

  const dateFullCellRender = useCallback<NonNullable<CalendarProps<Dayjs>['fullCellRender']>>((current, info) => {
    if (info.type !== 'date') return info.originNode;
    const key = current.format('YYYY-MM-DD');
    return (
      <ScheduleDayCell
        day={current.date()}
        row={sessionsByDate.get(key)}
        isToday={key === todayStr}
        isSelected={key === selectedDate}
        inMonth={current.month() === activeDate.month()}
        isMobile={isMobile}
        classCa={classCa}
        attendanceForSelf={!canManage}
      />
    );
  }, [sessionsByDate, todayStr, selectedDate, activeDate, isMobile, classCa, canManage]);

  if (!hasRequiredDates) {
    return (
      <div className={styles.stateBlock}>
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

  if (sessionsLoading || authLoading) {
    return (
      <div className={styles.stateBlockLarge}>
        <Spin size="large" />
        <Typography.Text type="secondary" className={styles.stateHint}>
          Đang tải lịch học...
        </Typography.Text>
      </div>
    );
  }

  if (!hasSessions) {
    return (
      <div className={styles.stateBlock}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Typography.Text type="secondary">Chưa có lịch học. Hãy tạo lịch tự động.</Typography.Text>}
        />
        <Button
          type="primary"
          className={styles.stateAction}
          icon={canManage ? <SyncOutlined /> : <ScanOutlined />}
          onClick={canManage ? handleGenerateSessions : () => setScannerOpen(true)}
          loading={canManage && generateSessions.isPending}
        >
          {canManage ? 'Tạo lịch học tự động' : 'Quét mã điểm danh'}
        </Button>
        <StudentScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.summary}>
          <div className={cx(styles.statChip, styles.statPast)}>
            <span className={styles.dot} />
            <span>{stats.past} đã qua</span>
          </div>
          <div className={cx(styles.statChip, styles.statToday)}>
            <span className={styles.dot} />
            <span>{stats.today} hôm nay</span>
          </div>
          <div className={cx(styles.statChip, styles.statUpcoming)}>
            <span className={styles.dot} />
            <span>{stats.upcoming} sắp tới</span>
          </div>
          <div className={styles.statTotal}>Tổng {stats.total} buổi</div>
          <div className={cx(styles.caChip, classCa && styles.caChipActive)}>
            <ClockCircleOutlined />
            <span>{caLabel}</span>
          </div>
        </div>
        {canManage ? (
          <Button
            className={styles.headerAction}
            icon={<SyncOutlined />}
            onClick={handleGenerateSessions}
            loading={generateSessions.isPending}
          >
            {isMobile ? 'Tạo lại' : 'Tạo lại lịch'}
          </Button>
        ) : (
          <Button
            className={styles.headerAction}
            type="primary"
            icon={<ScanOutlined />}
            onClick={() => setScannerOpen(true)}
          >
            Quét mã
          </Button>
        )}
      </div>

      <div className={styles.calendarLayout}>
        <div className={styles.calendarPanel}>
          <div className={styles.panelLabel}>Thời khóa biểu</div>
          <div className={styles.calendarScroll}>
            <Calendar
              fullscreen
              value={activeDate}
              onSelect={onSelectDate}
              onPanelChange={setActiveDate}
              headerRender={calendarHeaderRender}
              fullCellRender={dateFullCellRender}
              className={styles.calendar}
            />
          </div>
        </div>

        <aside className={styles.dayDetail} ref={detailRef}>
          <ScheduleDayDetail
            classId={classId}
            selectedDate={selectedDate}
            selectedSession={selectedSession}
            canManage={canManage}
            canEditLectures={canEditLectures}
            canTakeQuizzes={canTakeQuizzes}
            isMobile={isMobile}
            attendanceForSelf={!canManage}
            onEdit={setEditSession}
            onAttendance={setAttendanceSession}
            onGenerateQr={handleGenerateQr}
          />
        </aside>
      </div>

      <EditSessionModal
        open={Boolean(editSession)}
        session={editSession}
        teacherOptions={teacherOptions}
        isMobile={isMobile}
        loading={updateSession.isPending}
        onOk={handleSaveSession}
        onCancel={() => setEditSession(null)}
      />

      <AttendanceModal
        open={Boolean(attendanceSession)}
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

      <StudentScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  );
}
