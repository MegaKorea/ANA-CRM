import { EnrollmentStatus } from '@/constants/enums';

export const EnrollmentStatusConfig: Record<EnrollmentStatus, { color: string; label: string }> = {
  [EnrollmentStatus.DEPOSITED]: { color: 'gold', label: 'Cọc' },
  [EnrollmentStatus.STUDYING]: { color: 'blue', label: 'Đang học' },
  [EnrollmentStatus.COMPLETED]: { color: 'green', label: 'Hoàn thành' },
  [EnrollmentStatus.CANCELLED]: { color: 'red', label: 'Hủy' },
};
