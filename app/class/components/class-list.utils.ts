import dayjs from 'dayjs';
import type { Class } from '@/lib/services/class.service';
import { getClassStatusMeta } from '@/lib/constants/classStatus';

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

export function getClassCapacityInfo(cls: Class): ClassCapacityInfo {
  const enrolled = cls.class_students?.length ?? 0;
  const capacity = cls.capacity ?? null;
  if (!capacity) {
    return {
      enrolled,
      capacity: null,
      isFull: false,
      tagColor: 'default',
      label: '—',
      tooltip: null,
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

export function formatClassCourseLabel(cls: Class): string {
  if (!cls.courses) return '—';
  return `${cls.courses.name}${cls.courses.code ? ` (${cls.courses.code})` : ''}`;
}

export function formatClassScheduleLabel(schedule: string | null | undefined): string {
  return schedule ? dayjs(schedule).format('DD/MM/YYYY') : '—';
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
