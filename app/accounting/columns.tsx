import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

export const PaymentTypeLabel: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'Momo',
  other: 'Khác',
};

export const PaymentTypeColor: Record<string, string> = {
  cash: 'green',
  bank_transfer: 'blue',
  momo: 'magenta',
  other: 'default',
};

export const TicketStatusConfig: Record<
  string,
  { color: string; label: string; icon: React.ReactNode }
> = {
  pending: {
    color: 'warning',
    label: 'Chờ duyệt',
    icon: <ClockCircleOutlined />,
  },
  approved: {
    color: 'success',
    label: 'Đã duyệt',
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    color: 'error',
    label: 'Từ chối',
    icon: <CloseCircleOutlined />,
  },
};
