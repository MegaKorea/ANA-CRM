import dayjs from 'dayjs';
import type { Class } from '@/lib/services/class.service';
import { getClassStatusMeta } from '@/lib/constants/classStatus';

export const CLASS_DELETE_BLOCKED_REASON =
  'Lớp đang còn học viên không thể xóa';

export type ClassCapacityInfo = {
  enrolled: number;
  capacity: number | null;
  isFull: boolean;
  tagColor: 'red' | 'orange' | 'default';
  label: string;
  tooltip: string | null;
};

export type ClassListRowModel = {
  id: string;
  name: string;
  code: string;
  courseLabel: string;
  scheduleLabel: string;
  capacity: ClassCapacityInfo;
  status: ReturnType<typeof getClassStatusMeta>;
};

export type ClassDeleteActionState = {
  canDelete: boolean;
  deleteBlockedReason: string | null;
};

export function getClassCapacityInfo(cls: Class): ClassCapacityInfo {
  const enrolled = cls.class_students?.length ?? 0;
  const capacity = cls.capacity ?? null;

  if (capacity == null) {
    return {
      enrolled,
      capacity: null,
      isFull: false,
      tagColor: enrolled > 0 ? 'orange' : 'default',
      label: enrolled > 0 ? `${enrolled}/—` : '—',
      tooltip: enrolled > 0 ? `${enrolled} học viên (chưa giới hạn sĩ số)` : null,
    };
  }

  const isFull = enrolled >= capacity;
  return {
    enrolled,
    capacity,
    isFull,
    tagColor: isFull ? 'red' : enrolled > 0 ? 'orange' : 'default',
    label: `${enrolled}/${capacity}`,
    tooltip: isFull ? 'Đã đầy lớp' : `Còn ${capacity - enrolled} chỗ`,
  };
}

export function formatCourseOptionLabel(name: string, code?: string | null): string {
  return `${name}${code ? ` (${code})` : ''}`;
}

export function formatClassCourseLabel(cls: Class): string {
  if (!cls.courses) return '—';
  return formatCourseOptionLabel(cls.courses.name, cls.courses.code);
}

export function formatClassScheduleLabel(schedule: string | null | undefined): string {
  return schedule ? dayjs(schedule).format('DD/MM/YYYY') : '—';
}

export function getClassDeleteActionState(
  canManage: boolean,
  enrolled: number,
): ClassDeleteActionState {
  if (!canManage) {
    return { canDelete: false, deleteBlockedReason: null };
  }
  if (enrolled > 0) {
    return { canDelete: false, deleteBlockedReason: CLASS_DELETE_BLOCKED_REASON };
  }
  return { canDelete: true, deleteBlockedReason: null };
}

export function toClassListRowModel(cls: Class): ClassListRowModel {
  return {
    id: cls.id,
    name: cls.name,
    code: cls.code?.trim() || '—',
    courseLabel: formatClassCourseLabel(cls),
    scheduleLabel: formatClassScheduleLabel(cls.schedule),
    capacity: getClassCapacityInfo(cls),
    status: getClassStatusMeta(cls.status),
  };
}
