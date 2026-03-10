import type { CreateClassInput } from '@/lib/validators/class.validator';

export type ClassStatus = NonNullable<CreateClassInput['status']>;

export const CLASS_STATUS_META: Record<ClassStatus, { label: string; color: string }> = {
  planned: { label: 'Sắp mở', color: 'blue' },
  enrolling: { label: 'Đang tuyển sinh', color: 'orange' },
  in_progress: { label: 'Đang học', color: 'green' },
  completed: { label: 'Đã kết thúc', color: 'purple' },
  cancelled: { label: 'Đã hủy', color: 'red' },
};

export const CLASS_STATUS_OPTIONS = (Object.keys(CLASS_STATUS_META) as ClassStatus[]).map((value) => ({
  value,
  label: CLASS_STATUS_META[value].label,
}));

export function normalizeClassStatus(status: string | null | undefined): ClassStatus {
  return (status && status in CLASS_STATUS_META ? status : 'planned') as ClassStatus;
}

export function getClassStatusMeta(status: string | null | undefined) {
  return CLASS_STATUS_META[normalizeClassStatus(status)];
}

