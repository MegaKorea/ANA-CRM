'use client';

import { Modal, Tag, Image, Empty, Spin } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import type { Lead } from '@/lib/services/lead.service';
import {
  usePaymentTicketsByLead,
  usePaymentSummary,
} from '@/lib/hooks/use-payment-tickets';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';
import type { PaymentTicket } from '@/lib/services/payment-ticket.service';
import { DateLocale } from '@/constants/enums';
import styles from './PaymentHistory.module.scss';

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

interface PaymentHistoryModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export function PaymentHistoryModal({
  open,
  lead,
  onClose,
}: PaymentHistoryModalProps) {
  const { data: tickets, isLoading: ticketsLoading } =
    usePaymentTicketsByLead(lead?.id);
  const { data: summary, isLoading: summaryLoading } = usePaymentSummary(
    lead?.id
  );

  const tuitionFee = summary?.tuition_fee ?? lead?.tuition_fee ?? 0;
  const totalPaid = summary?.total_paid ?? 0;
  const remaining = Math.max(0, tuitionFee - totalPaid);
  const progressPercent =
    tuitionFee > 0
      ? Math.min(100, Math.round((totalPaid / tuitionFee) * 100))
      : 0;

  const renderTicketItem = (ticket: PaymentTicket) => {
    const cfg = TicketStatusConfig[ticket.status] ?? TicketStatusConfig.pending;

    const borderClass =
      ticket.status === 'approved'
        ? styles.ticketItemApproved
        : ticket.status === 'rejected'
          ? styles.ticketItemRejected
          : styles.ticketItemPending;

    return (
      <div
        key={ticket.id}
        className={`${styles.ticketItem} ${borderClass}`}
      >
        {/* Header row */}
        <div className={styles.ticketHeader}>
          <span className={styles.ticketAmount}>
            {formatCurrencyVnd(ticket.amount)}
          </span>
          <div className={styles.ticketTags}>
            <Tag color={cfg.color} icon={cfg.icon}>
              {cfg.label}
            </Tag>
            <Tag color={PaymentTypeColor[ticket.payment_type] ?? 'default'}>
              {PaymentTypeLabel[ticket.payment_type] ?? ticket.payment_type}
            </Tag>
          </div>
        </div>

        {/* Meta row */}
        <div className={styles.ticketMeta}>
          {ticket.payment_date && (
            <span>
              <CalendarOutlined className={styles.ticketMetaIcon} />
              {new Date(ticket.payment_date).toLocaleString(
                DateLocale.VIET_NAM
              )}
            </span>
          )}
          {ticket.payment_type && (
            <span>
              <CreditCardOutlined className={styles.ticketMetaIcon} />
              #{ticket.id}
            </span>
          )}
        </div>

        {/* Note */}
        {ticket.note && (
          <div className={styles.ticketNote}>{ticket.note}</div>
        )}

        {/* Reject reason */}
        {ticket.reject_reason && (
          <div className={styles.ticketRejectReason}>
            ✕ Lý do từ chối: {ticket.reject_reason}
          </div>
        )}

        {/* Images */}
        {ticket.images && ticket.images.length > 0 && (
          <div className={styles.ticketImages}>
            <Image.PreviewGroup>
              {ticket.images.map((url, idx) => (
                <div key={idx} className={styles.ticketImageWrap}>
                  <Image
                    src={url}
                    width={64}
                    height={64}
                    alt={`Chứng từ ${idx + 1}`}
                    style={{ objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ))}
            </Image.PreviewGroup>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      open={open}
      title={`Lịch sử thanh toán — ${lead?.full_name || ''}`}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnHidden
      centered
      className={styles.modal}
    >
      <Spin spinning={ticketsLoading || summaryLoading}>
        {/* ── Summary Hero ── */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryBg} />
          <div className={styles.summaryInner}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Học phí</span>
                <span className={styles.summaryValue}>
                  {formatCurrencyVnd(tuitionFee)}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Đã nộp</span>
                <span className={styles.summaryValue}>
                  {formatCurrencyVnd(totalPaid)}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Còn lại</span>
                <span
                  className={`${styles.summaryValue} ${styles.summaryValueSmall} ${remaining > 0 ? styles.summaryValueDanger : ''}`}
                >
                  {formatCurrencyVnd(remaining)}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Số lần nộp</span>
                <span
                  className={`${styles.summaryValue} ${styles.summaryValueSmall}`}
                >
                  {summary?.ticket_count ?? 0}
                </span>
              </div>
            </div>

            {tuitionFee > 0 && (
              <div className={styles.progressRow}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className={styles.progressPercent}>
                  {progressPercent}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Ticket List ── */}
        {tickets && tickets.length > 0 ? (
          <div className={styles.ticketList}>
            <div className={styles.ticketListTitle}>
              Lịch sử giao dịch ({tickets.length})
            </div>
            {tickets.map(renderTicketItem)}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Empty description="Chưa có lịch sử thanh toán" />
          </div>
        )}
      </Spin>
    </Modal>
  );
}
