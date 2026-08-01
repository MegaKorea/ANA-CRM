'use client';

import { Badge, Button, Empty, Space } from 'antd';
import {
  EditOutlined,
  QrcodeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ClassSession } from '@/lib/services/class_session.service';
import { STATUS_LABEL, cx, type SessionRow, type SessionStatus } from './schedule.utils';
import { SessionLecturesPanel } from './SessionLecturesPanel';
import { SessionQuizzesPanel } from './SessionQuizzesPanel';
import styles from './tab-schedule.module.scss';

const STATUS_TONE: Record<SessionStatus, string> = {
  past: styles.dayTone_past,
  today: styles.dayTone_today,
  upcoming: styles.dayTone_upcoming,
};

type Props = {
  classId: string;
  selectedDate: string;
  selectedSession: SessionRow | null;
  canManage: boolean;
  canEditLectures: boolean;
  canTakeQuizzes: boolean;
  isMobile: boolean;
  attendanceForSelf?: boolean;
  onEdit: (session: ClassSession) => void;
  onAttendance: (session: ClassSession) => void;
  onGenerateQr: (session: ClassSession) => void;
};

export function ScheduleDayDetail({
  classId,
  selectedDate,
  selectedSession,
  canManage,
  canEditLectures,
  canTakeQuizzes,
  isMobile,
  attendanceForSelf = false,
  onEdit,
  onAttendance,
  onGenerateQr,
}: Props) {
  const date = dayjs(selectedDate);
  const isToday = date.isSame(dayjs(), 'day');
  const showAttendance =
    !!selectedSession &&
    (selectedSession.status === 'past' || selectedSession.status === 'today');

  const attendanceLabel = selectedSession?.hasAttendance
    ? attendanceForSelf
      ? 'Bạn đã điểm danh'
      : `${selectedSession.attendanceMarkedCount} đã điểm danh`
    : attendanceForSelf
      ? 'Bạn chưa điểm danh'
      : 'Chưa điểm danh';

  const metaParts = selectedSession
    ? [
        selectedSession.caLabel,
        selectedSession.teacherName,
        selectedSession.room || null,
      ].filter(Boolean)
    : [];

  return (
    <div className={styles.dayDetailInner}>
      <header className={styles.dayDetailHead}>
        <p className={styles.dayDetailDate}>
          {isToday ? 'Hôm nay · ' : null}
          {date.format('dddd, DD/MM/YYYY')}
        </p>
        {selectedSession ? (
          <div className={styles.dayDetailTitleRow}>
            <h3 className={styles.dayDetailTitle}>{selectedSession.sessionLabel}</h3>
            <span className={cx(styles.dayTone, STATUS_TONE[selectedSession.status])}>
              {STATUS_LABEL[selectedSession.status]}
            </span>
          </div>
        ) : (
          <h3 className={styles.dayDetailTitle}>{date.format('dddd')}</h3>
        )}
      </header>

      {!selectedSession ? (
        <div className={styles.dayEmpty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có buổi học ngày này"
          />
        </div>
      ) : (
        <div className={styles.daySession}>
          {metaParts.length > 0 ? (
            <p className={styles.dayMetaLine}>{metaParts.join(' · ')}</p>
          ) : null}

          {showAttendance ? (
            <p
              className={cx(
                styles.dayAttendLine,
                selectedSession.hasAttendance ? styles.dayAttendOk : styles.dayAttendMissing,
              )}
            >
              {attendanceLabel}
            </p>
          ) : null}

          {canManage ? (
            <div className={styles.dayActions}>
              <Space wrap size={8}>
                <Button
                  type="primary"
                  size="middle"
                  icon={<TeamOutlined />}
                  danger={showAttendance && !selectedSession.hasAttendance}
                  onClick={() => onAttendance(selectedSession.session)}
                >
                  Điểm danh
                </Button>
                <Button
                  size="middle"
                  icon={
                    selectedSession.hasQr ? (
                      <Badge dot color="green">
                        <QrcodeOutlined />
                      </Badge>
                    ) : (
                      <QrcodeOutlined />
                    )
                  }
                  onClick={() => onGenerateQr(selectedSession.session)}
                >
                  QR
                </Button>
                <Button
                  type="text"
                  size="middle"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(selectedSession.session)}
                >
                  Sửa
                </Button>
              </Space>
            </div>
          ) : null}

          <div className={styles.dayContent}>
            <SessionLecturesPanel
              classId={classId}
              sessionId={selectedSession.session.id}
              canEdit={canEditLectures}
              isMobile={isMobile}
            />
            <SessionQuizzesPanel
              classId={classId}
              sessionId={selectedSession.session.id}
              canEdit={canEditLectures}
              canTake={canTakeQuizzes}
              isMobile={isMobile}
            />
          </div>
        </div>
      )}
    </div>
  );
}
