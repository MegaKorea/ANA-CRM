'use client';

import { useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Typography,
  Row,
  Col,
  message,
  Modal,
  Input,
  Image,
  Card,
  Statistic,
  Tooltip,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  DollarOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  usePaymentTickets,
  useReviewPaymentTicket,
} from '@/lib/hooks/use-payment-tickets';
import type { PaymentTicket } from '@/lib/services/payment-ticket.service';
import { formatCurrencyVnd, formatNumberVi } from '@/lib/utils/numberFormat';
import { DateLocale, TicketStatus } from '@/constants/enums';

const PaymentTypeLabel: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'Momo',
  other: 'Khác',
};

const PaymentTypeColor: Record<string, string> = {
  cash: 'green',
  bank_transfer: 'blue',
  momo: 'magenta',
  other: 'default',
};

const TicketStatusConfig: Record<
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

export default function AccountingPage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTicketId, setRejectTicketId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isFetching, refetch } = usePaymentTickets({
    date: selectedDate.format('YYYY-MM-DD'),
    status: statusFilter,
    page: currentPage,
    limit: pageSize,
  });

  const reviewMutation = useReviewPaymentTicket();

  const tickets = data?.data || [];
  const total = data?.total || 0;

  // Compute stats from current filtered list
  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const approvedTotal = tickets
    .filter((t) => t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingTotal = tickets
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleApprove = useCallback(
    (ticketId: number) => {
      Modal.confirm({
        title: 'Xác nhận duyệt',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        content: 'Bạn có chắc chắn muốn duyệt phiếu thu này?',
        okText: 'Duyệt',
        cancelText: 'Hủy',
        onOk: () => {
          reviewMutation.mutate(
            { id: ticketId, input: { status: 'approved' } },
            {
              onSuccess: () => {
                message.success('Đã duyệt phiếu thu');
              },
              onError: () => {
                message.error('Duyệt thất bại');
              },
            }
          );
        },
      });
    },
    [reviewMutation]
  );

  const handleOpenRejectModal = useCallback((ticketId: number) => {
    setRejectTicketId(ticketId);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const handleReject = useCallback(() => {
    if (!rejectTicketId || !rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    reviewMutation.mutate(
      {
        id: rejectTicketId,
        input: {
          status: 'rejected',
          reject_reason: rejectReason.trim(),
        },
      },
      {
        onSuccess: () => {
          message.success('Đã từ chối phiếu thu');
          setRejectModalOpen(false);
          setRejectTicketId(null);
          setRejectReason('');
        },
        onError: () => {
          message.error('Từ chối thất bại');
        },
      }
    );
  }, [rejectTicketId, rejectReason, reviewMutation]);

  const columns: ColumnsType<PaymentTicket> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Lead ID',
      dataIndex: 'lead_id',
      key: 'lead_id',
      width: 90,
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
      title: 'Loại thanh toán',
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
                onClick={() => handleApprove(record.id)}
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
                onClick={() => handleOpenRejectModal(record.id)}
              >
                Từ chối
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-page">
      <Row justify="space-between" align="middle" className="mb-section">
        <Col>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Kế toán — Quản lý phiếu thu
          </Typography.Title>
        </Col>
        <Col>
          <Space>
            <DatePicker
              value={selectedDate}
              onChange={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setCurrentPage(1);
                }
              }}
              format="DD/MM/YYYY"
              allowClear={false}
            />
            <Button
              icon={<ReloadOutlined />}
              loading={isFetching}
              onClick={() => refetch()}
            >
              Làm mới
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Stats cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng phiếu trong ngày"
              value={total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Chờ duyệt"
              value={pendingCount}
              valueStyle={{ color: '#faad14' }}
              prefix={
                <Badge
                  count={pendingCount}
                  offset={[-6, 0]}
                  overflowCount={99}
                >
                  <ExclamationCircleOutlined
                    style={{ color: '#faad14', fontSize: 20 }}
                  />
                </Badge>
              }
              suffix={
                pendingTotal > 0 ? (
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 14 }}
                  >
                    ({formatCurrencyVnd(pendingTotal)})
                  </Typography.Text>
                ) : null
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã duyệt"
              value={formatNumberVi(approvedTotal)}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
              suffix="đ"
            />
          </Card>
        </Col>
      </Row>

      <Table<PaymentTicket>
        columns={columns}
        dataSource={tickets}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        bordered={false}
        className="minimal-table"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        rowClassName={(record) =>
          record.status === 'pending' ? 'ant-table-row-pending' : ''
        }
      />

      {/* Reject confirmation modal */}
      <Modal
        open={rejectModalOpen}
        title="Từ chối phiếu thu"
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectTicketId(null);
          setRejectReason('');
        }}
        onOk={handleReject}
        okText="Từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        confirmLoading={reviewMutation.isPending}
      >
        <Typography.Paragraph>
          Vui lòng nhập lý do từ chối:
        </Typography.Paragraph>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
        />
      </Modal>
    </div>
  );
}
