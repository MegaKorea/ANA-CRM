import type { ClassSession } from '@/lib/services/class_session.service';
import type { ClassTimetable } from '@/lib/validators/class.validator';

export type SessionStatus = 'past' | 'today' | 'upcoming';

export type SessionRow = {
  key: string;
  session: ClassSession;
  sessionLabel: string;
  dateKey: string;
  isToday: boolean;
  status: SessionStatus;
  teacherName: string;
  room: string;
  hasQr: boolean;
  hasAttendance: boolean;
  attendanceMarkedCount: number;
  caLabel: string;
};

export const STATUS_LABEL: Record<SessionStatus, string> = {
  past: 'Đã qua',
  today: 'Hôm nay',
  upcoming: 'Sắp tới',
};

export const TIMETABLE_CONFIG: Record<ClassTimetable, { tiet1: string; tiet2: string }> = {
  Sáng: { tiet1: '8h00 - 9h40', tiet2: '10h00 - 11h45' },
  Chiều: { tiet1: '13h00 - 14h40', tiet2: '15h00 - 16h45' },
};

export function formatCaLabel(ca: ClassTimetable | null): string {
  if (!ca) return 'Chưa gán ca';
  const cfg = TIMETABLE_CONFIG[ca];
  if (!cfg) return `Ca ${ca}`;
  const start = cfg.tiet1.split(' - ')[0] ?? cfg.tiet1;
  const end = cfg.tiet2.split(' - ').pop() ?? cfg.tiet2;
  return `Ca ${ca} · ${start} – ${end}`;
}

export function getSessionStatus(dateStr: string, todayStr: string): SessionStatus {
  if (dateStr < todayStr) return 'past';
  if (dateStr === todayStr) return 'today';
  return 'upcoming';
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function buildSessionRows(
  sessions: ClassSession[],
  todayStr: string,
  caLabel: string,
  fallbackTeacherName?: string | null,
): SessionRow[] {
  return sessions.map((s) => {
    const status = getSessionStatus(s.date, todayStr);
    return {
      key: s.id,
      session: s,
      sessionLabel: `Buổi ${s.session_number}`,
      dateKey: s.date,
      isToday: s.date === todayStr,
      status,
      teacherName: s.teacher?.full_name || fallbackTeacherName || '—',
      room: s.room || '',
      hasQr: !!s.qr_code_token,
      hasAttendance: !!s.hasAttendance,
      attendanceMarkedCount: s.attendanceMarkedCount ?? 0,
      caLabel,
    };
  });
}

export function countByStatus(rows: SessionRow[]) {
  let past = 0;
  let today = 0;
  let upcoming = 0;
  for (const row of rows) {
    if (row.status === 'past') past += 1;
    else if (row.status === 'today') today += 1;
    else upcoming += 1;
  }
  return { past, today, upcoming, total: rows.length };
}
