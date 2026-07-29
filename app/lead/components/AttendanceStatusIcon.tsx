import { CheckCircleTwoTone, ClockCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { AttendanceStatus } from '@/constants/enums';

interface AttendanceStatusIconProps {
  status: string | null | undefined;
  fontSize?: number;
}

/**
 * Icon thể hiện trạng thái điểm danh của lead.
 * Dùng chung cho bảng desktop và card mobile để logic màu/biểu tượng đồng nhất.
 */
export function AttendanceStatusIcon({ status, fontSize = 16 }: AttendanceStatusIconProps) {
  if (status === AttendanceStatus.ARRIVED) {
    return <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize }} />;
  }
  if (status === AttendanceStatus.NO_SHOW) {
    return <CloseCircleTwoTone twoToneColor="#ff4d4f" style={{ fontSize }} />;
  }
  return <ClockCircleTwoTone twoToneColor="#faad14" style={{ fontSize }} />;
}
