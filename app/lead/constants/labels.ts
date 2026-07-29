import { LeadStatus } from '@/constants/enums';

/**
 * Nhãn hiển thị của trạng thái lead.
 *
 * Tách khỏi `app/lead/constants/index.tsx` vì file đó kéo theo antd Table,
 * react-icons và các component của trang lead — quá nặng cho những trang chỉ
 * cần nhãn, ví dụ form nhập lead nhúng trong Smax (`/lead-form`).
 * `index.tsx` re-export lại nên các import cũ vẫn dùng được như trước.
 */
export const LeadStatusLabel = {
  [LeadStatus.NEW]: 'MỚI',
  [LeadStatus.CONVERTED]: 'ĐÃ ĐĂNG KÍ',
  [LeadStatus.NOT_CONTACTED]: 'CHƯA TIẾP CẬN',
  [LeadStatus.REJECT]: 'TỪ CHỐI',
  [LeadStatus.INTERESTED]: 'QUAN TÂM',
  [LeadStatus.NOT_INTERESTED]: 'KHÔNG QUAN TÂM',
  [LeadStatus.NURTURING]: 'ĐANG CHĂM SÓC',
  [LeadStatus.OTHER]: 'KHÁC',
} as const;

/** Danh sách option trạng thái dùng cho các thanh Select. */
export const LEAD_STATUS_OPTIONS = Object.values(LeadStatus).map((status) => ({
  value: status,
  label: LeadStatusLabel[status],
}));
