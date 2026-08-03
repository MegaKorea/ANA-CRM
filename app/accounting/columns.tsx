import { Button, Image, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import type { PaymentTicket } from '@/lib/services/payment-ticket.service';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';
import { DateLocale, TicketStatus } from '@/constants/enums';

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

export function getPaymentTicketColumns({
  statusFilter,
  onApprove,
  onOpenReject,
}: {
  statusFilter: TicketStatus | undefined;
  onApprove: (ticketId: number) => void;
  onOpenReject: (ticketId: number) => void;
}): ColumnsType<PaymentTicket> {
  return [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 200,
      render: (_: unknown, record: PaymentTicket) => (
        <Space orientation="vertical" size={2}>
          <Space size={4}>
            <UserOutlined style={{ color: '#1890ff', fontSize: 12 }} />
            <Typography.Text strong style={{ fontSize: 13 }}>
              {record.lead_full_name || `Lead #${record.lead_id}`}
            </Typography.Text>
          </Space>
          {record.lead_phone_number && (
            <Space size={4}>
              <PhoneOutlined style={{ color: '#52c41a', fontSize: 12 }} />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record.lead_phone_number}
              </Typography.Text>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number) => (
        <Typography.Text strong style={{ color: '#1890ff' }}>
          {formatCurrencyVnd(amount)}
        </Typography.Text>
      ),
    },
    {
      title: 'Phương thức',
      dataIndex: 'payment_type',
      key: 'payment_type',
      width: 130,
      render: (type: string) => (
        <Tag color={PaymentTypeColor[type] ?? 'default'}>
          {PaymentTypeLabel[type] ?? type}
        </Tag>
      ),
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 170,
      render: (date: string) =>
        date ? new Date(date).toLocaleString(DateLocale.VIET_NAM) : '',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Ảnh',
      dataIndex: 'images',
      key: 'images',
      width: 120,
      render: (images: string[] | null) => {
        if (!images || images.length === 0) return null;
        return (
          <Image.PreviewGroup>
            <Space>
              {images.slice(0, 2).map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  width={40}
                  height={40}
                  alt={`Ảnh ${i + 1}`}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ))}
              {images.length > 2 && (
                <Typography.Text type="secondary">
                  +{images.length - 2}
                </Typography.Text>
              )}
            </Space>
          </Image.PreviewGroup>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Chờ duyệt', value: 'pending' },
        { text: 'Đã duyệt', value: 'approved' },
        { text: 'Từ chối', value: 'rejected' },
      ],
      filteredValue: statusFilter ? [statusFilter] : null,
      render: (status: string) => {
        const cfg = TicketStatusConfig[status] ?? TicketStatusConfig.pending;
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Lý do từ chối',
      dataIndex: 'reject_reason',
      key: 'reject_reason',
      width: 180,
      ellipsis: true,
      render: (reason: string | null) =>
        reason ? (
          <Typography.Text type="danger" italic>
            {reason}
          </Typography.Text>
        ) : null,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (date: string) =>
        date ? new Date(date).toLocaleString(DateLocale.VIET_NAM) : '',
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center',
      fixed: 'right',
      width: 160,
      render: (_: unknown, record: PaymentTicket) => {
        if (record.status !== 'pending') return null;
        return (
          <Space>
            <Tooltip title="Duyệt">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onApprove(record.id)}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Duyệt
              </Button>
            </Tooltip>
            <Tooltip title="Từ chối">
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => onOpenReject(record.id)}
              >
                Từ chối
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];
}
