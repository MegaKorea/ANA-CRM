'use client';

import { useCallback, useState } from 'react';
import { App, Button, Col, DatePicker, Row, Space, Table, Typography } from 'antd';
import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  usePaymentTickets,
  useReviewPaymentTicket,
} from '@/lib/hooks/use-payment-tickets';
import { TicketStatus } from '@/constants/enums';
import { getPaymentTicketColumns } from './columns';
import { PaymentStatsCards } from './PaymentStatsCards';
import { RejectTicketModal } from './RejectTicketModal';

export default function AccountingPage() {
  const { message, modal } = App.useApp();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(undefined);
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

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const approvedTotal = tickets
    .filter((t) => t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingTotal = tickets
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleApprove = useCallback(
    (ticketId: number) => {
      modal.confirm({
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
    [message, modal, reviewMutation]
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
  }, [message, rejectTicketId, rejectReason, reviewMutation]);

  const columns = getPaymentTicketColumns({
    statusFilter,
    onApprove: handleApprove,
    onOpenReject: handleOpenRejectModal,
  });

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

      <PaymentStatsCards
        total={total}
        pendingCount={pendingCount}
        pendingTotal={pendingTotal}
        approvedTotal={approvedTotal}
      />

      <Table
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
        }}
        onChange={(pagination, filters) => {
          if (pagination.current) setCurrentPage(pagination.current);
          if (pagination.pageSize) setPageSize(pagination.pageSize);
          const nextStatus = filters.status?.[0] as TicketStatus | undefined;
          if (nextStatus !== statusFilter) {
            setStatusFilter(nextStatus);
            setCurrentPage(1);
          }
        }}
        rowClassName={(record) =>
          record.status === 'pending' ? 'ant-table-row-pending' : ''
        }
      />

      <RejectTicketModal
        open={rejectModalOpen}
        reason={rejectReason}
        confirmLoading={reviewMutation.isPending}
        onReasonChange={setRejectReason}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectTicketId(null);
          setRejectReason('');
        }}
        onOk={handleReject}
      />
    </div>
  );
}
