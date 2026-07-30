'use client';

import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { ClassTimetable } from '@/lib/validators/class.validator';
import { cx, type SessionRow, type SessionStatus } from './schedule.utils';
import styles from './tab-schedule.module.scss';

const STATUS_CELL: Record<SessionStatus, string> = {
  past: styles.calDay_past,
  today: styles.calDay_today,
  upcoming: styles.calDay_upcoming,
};

type Props = {
  day: number;
  row: SessionRow | undefined;
  isToday: boolean;
  isSelected: boolean;
  inMonth: boolean;
  isMobile: boolean;
  classCa: ClassTimetable | null;
  /** STU: icon theo chính họ; staff: theo cả buổi */
  attendanceForSelf?: boolean;
};

function AttendanceMark({
  taken,
  count,
  forSelf,
}: {
  taken: boolean;
  count: number;
  forSelf: boolean;
}) {
  if (taken) {
    return (
      <CheckCircleFilled
        className={cx(styles.calDayAttendIcon, styles.calDayAttendOk)}
        aria-label={forSelf ? 'Bạn đã điểm danh' : `${count} học viên đã điểm danh`}
        title={forSelf ? 'Bạn đã điểm danh' : `${count} HV đã điểm danh`}
      />
    );
  }
  return (
    <CloseCircleFilled
      className={cx(styles.calDayAttendIcon, styles.calDayAttendMissing)}
      aria-label={forSelf ? 'Bạn chưa điểm danh' : 'Chưa có học viên điểm danh'}
      title={forSelf ? 'Bạn chưa điểm danh' : 'Chưa có HV điểm danh'}
    />
  );
}

export function ScheduleDayCell({
  day,
  row,
  isToday,
  isSelected,
  inMonth,
  isMobile,
  classCa,
  attendanceForSelf = false,
}: Props) {
  const showAttendance = row?.status === 'past' || row?.status === 'today';

  return (
    <div
      className={cx(
        styles.calDay,
        row ? STATUS_CELL[row.status] : styles.calDayEmpty,
        isToday && styles.calDayIsToday,
        isSelected && styles.calDaySelected,
        !inMonth && styles.calDayOut,
        isMobile && styles.calDayCompact,
        showAttendance && styles.calDayHasAttend,
      )}
    >
      <div className={styles.calDayTop}>
        <span className={styles.calDayNum}>{day}</span>
        {!isMobile && row?.status === 'today' ? (
          <span className={styles.calDayBadge}>Hôm nay</span>
        ) : null}
        {!showAttendance && row && (isMobile || row.status !== 'today') ? (
          <span className={styles.calDayDot} aria-hidden />
        ) : null}
      </div>

      {showAttendance ? (
        <div className={styles.calDayAttendSlot}>
          <AttendanceMark
            taken={row.hasAttendance}
            count={row.attendanceMarkedCount}
            forSelf={attendanceForSelf}
          />
        </div>
      ) : null}

      {!isMobile && row ? (
        <div className={styles.calDayBody}>
          <span className={styles.calDayLabel}>{row.sessionLabel}</span>
          {classCa ? <span className={styles.calDayMeta}>Ca {classCa}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
