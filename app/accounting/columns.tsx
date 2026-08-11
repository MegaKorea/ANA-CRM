import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

export const PaymentMethodLabel: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_personal: 'Chuyển khoản - TK cá nhân',
  bank_company: 'Chuyển khoản - TK công ty',
};

export const PaymentMethodColor: Record<string, string> = {
  cash: 'green',
  bank_personal: 'blue',
  bank_company: 'geekblue',
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
