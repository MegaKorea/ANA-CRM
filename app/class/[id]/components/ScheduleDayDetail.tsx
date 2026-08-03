'use client';

import { Badge, Button, Empty } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  EditOutlined,
  EnvironmentOutlined,
  QrcodeOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ClassSession } from '@/lib/services/class_session.service';
import { STATUS_LABEL, cx, type SessionRow, type SessionStatus } from './schedule.utils';
import { SessionLecturesPanel } from './SessionLecturesPanel';
import { SessionQuizzesPanel } from './SessionQuizzesPanel';
import styles from './tab-schedule.module.scss';

const STATUS_BADGE: Record<SessionStatus, string> = {
  past: styles.dayStatus_past,
  today: styles.dayStatus_today,
  upcoming: styles.dayStatus_upcoming,
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

  const attendanceLabel = selectedSession?.hasAttendance
    ? attendanceForSelf
      ? 'Bạn đã điểm danh'
      : `${selectedSession.attendanceMarkedCount} học viên đã điểm danh`
    : attendanceForSelf
      ? 'Bạn chưa điểm danh'
      : 'Chưa có học viên điểm danh';

  return (
    <div className={styles.dayDetailInner}>
      <header className={styles.dayDetailHead}>
        <div className={styles.dayDetailHeadTop}>
          <span className={styles.dayDetailEyebrow}>Chi tiết ngày</span>
          {selectedSession ? (
            <span className={cx(styles.dayStatusBadge, STATUS_BADGE[selectedSession.status])}>
              {STATUS_LABEL[selectedSession.status]}
            </span>
          ) : null}
        </div>
        <h3 className={styles.dayDetailTitle}>{date.format('dddd')}</h3>
        <p className={styles.dayDetailDate}>
          {isToday ? 'Hôm nay · ' : null}
          {date.format('DD/MM/YYYY')}
        </p>
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
          <div className={styles.daySessionHero}>
            <div>
              <p className={styles.dayFieldLabel}>Buổi học</p>
              <p className={styles.daySessionName}>{selectedSession.sessionLabel}</p>
            </div>
            <div className={cx(styles.dayRoomChip, !selectedSession.room && styles.dayRoomChipMuted)}>
              <EnvironmentOutlined />
              <span>{selectedSession.room || 'Chưa gán phòng'}</span>
            </div>
          </div>

          <dl className={styles.dayMetaList}>
            {selectedSession.status === 'past' || selectedSession.status === 'today' ? (
              <div className={styles.dayMetaRow}>
                <dt>
                  {selectedSession.hasAttendance ? (
                    <CheckCircleFilled className={cx(styles.dayMetaRowIcon, styles.dayAttendOk)} />
                  ) : (
                    <CloseCircleFilled className={cx(styles.dayMetaRowIcon, styles.dayAttendMissing)} />
                  )}
                  Điểm danh
                </dt>
                <dd className={selectedSession.hasAttendance ? styles.dayAttendOk : styles.dayAttendMissing}>
                  {attendanceLabel}
                </dd>
              </div>
            ) : null}
            <div className={styles.dayMetaRow}>
              <dt>
                <ClockCircleOutlined className={styles.dayMetaRowIcon} />
                Ca học
              </dt>
              <dd>{selectedSession.caLabel}</dd>
            </div>
            <div className={styles.dayMetaRow}>
              <dt>
                <UserOutlined className={styles.dayMetaRowIcon} />
                Giáo viên
              </dt>
              <dd>{selectedSession.teacherName}</dd>
            </div>
          </dl>

          {canManage ? (
            <div className={styles.dayActions}>
              <Button icon={<EditOutlined />} onClick={() => onEdit(selectedSession.session)}>
                Sửa
              </Button>
              <Button
                icon={<TeamOutlined />}
                danger={
                  (selectedSession.status === 'past' || selectedSession.status === 'today')
                  && !selectedSession.hasAttendance
                }
                onClick={() => onAttendance(selectedSession.session)}
              >
                Điểm danh
              </Button>
              <Button
                type="primary"
                icon={
                  selectedSession.hasQr
                    ? <Badge dot color="green"><QrcodeOutlined /></Badge>
                    : <QrcodeOutlined />
                }
                onClick={() => onGenerateQr(selectedSession.session)}
              >
                Mã QR
              </Button>
            </div>
          ) : null}

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
      )}
    </div>
  );
}
