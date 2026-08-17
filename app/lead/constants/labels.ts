import { LeadStatus } from '@/constants/enums';

export const LeadStatusLabel = {
  [LeadStatus.NEW]: 'MỚI',
  [LeadStatus.CONVERTED]: 'ĐÃ ĐĂNG KÍ',
  [LeadStatus.NOT_CONTACTED]: 'CHƯA TIẾP CẬN',
  [LeadStatus.REJECT]: 'TỪ CHỐI',
  [LeadStatus.INTERESTED]: 'QUAN TÂM',
  [LeadStatus.NOT_INTERESTED]: 'KHÔNG QUAN TÂM',
  [LeadStatus.NURTURING]: 'ĐANG CHĂM SÓC',
  [LeadStatus.LOW_INTERACTION]: 'ÍT TƯƠNG TÁC',
  [LeadStatus.OTHER]: 'KHÁC',
} as const;

export const LEAD_STATUS_OPTIONS = Object.values(LeadStatus).map((status) => ({
  value: status,
  label: LeadStatusLabel[status],
}));
