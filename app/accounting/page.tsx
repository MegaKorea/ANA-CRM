'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  App, Alert, Button, Card, Col, DatePicker, Empty, Pagination, Popconfirm, Row, Space, Spin, Table, Tag, Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, DollarOutlined, EditOutlined, PlusOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { usePaymentTickets, useReviewPaymentTicket } from '@/lib/hooks/use-payment-tickets';
import {
  useEnrollments, useEnrolledLeadIds, useDeleteEnrollment, useEnsureEnrollmentForLead,
} from '@/lib/hooks/use-enrollments';
import { useCourses } from '@/lib/hooks/use-courses';
import { useClasses } from '@/lib/hooks/use-classes';
import { useLeads } from '@/lib/hooks/use-leads';
import type { PaymentTicket } from '@/lib/services/payment-ticket.service';
import type { Enrollment } from '@/lib/services/enrollment.service';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';
import { getLatestNoteContent } from '@/lib/utils/notes';
import { LeadStatus } from '@/constants/enums';
import {
  ENROLLMENT_CATEGORY_COLOR,
  ENROLLMENT_CATEGORY_LABEL,
  PaymentMethodColor,
  PaymentMethodLabel,
} from './columns';
import { PaymentStatsCards } from './PaymentStatsCards';
import { RejectTicketModal } from './RejectTicketModal';
import { EnrollmentModal } from './EnrollmentModal';
import { EnrollmentPaymentModal } from './EnrollmentPaymentModal';
import { EnrollmentCreateDrawer } from './EnrollmentCreateDrawer';
import { MainRowCard, type MainRow } from './MainRowCard';
import { useIsMobile } from '@/lib/hooks/use-mobile';

const autoMaterializedLeadIds = new Set<number>();
const EMPTY_ARRAY: readonly never[] = [];
const COURSE_CELL_STYLE = { textAlign: 'left', maxWidth: 192 } as const;

export default function AccountingPage() {
  return (
    <Suspense fallback={null}>
      <AccountingPageContent />
    </Suspense>
  );
}

function AccountingPageContent() {
  const { message, modal } = App.useApp();
  const isMobile = useIsMobile();
  const [filterRange, setFilterRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTicketId, setRejectTicketId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payingEnrollment, setPayingEnrollment] = useState<Enrollment | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const rangeStart = filterRange[0].format('YYYY-MM-DD');
  const rangeEnd = filterRange[1].format('YYYY-MM-DD');

  const {
    data: ticketData,
    isLoading: ticketsLoading,
    isFetching: ticketsFetching,
    refetch: refetchTickets,
  } = usePaymentTickets({
    startDate: `${rangeStart}T00:00:00.000Z`,
    endDate: `${rangeEnd}T23:59:59.999Z`,
    page: 1,
    limit: 200,
  });

  const {
    data: enrollmentData,
    isLoading: enrollmentsLoading,
    isFetching: enrollmentsFetching,
    refetch: refetchEnrollments,
  } = useEnrollments({
    startDate: rangeStart,
    endDate: rangeEnd,
    page: 1,
    limit: 200,
  });

  const {
    data: convertedLeadData,
    isLoading: convertedLeadsLoading,
    isFetching: convertedLeadsFetching,
    refetch: refetchConvertedLeads,
  } = useLeads({
    status: LeadStatus.CONVERTED,
    page: 1,
    limit: 200,
  });

  const { data: enrolledLeadIdsData, isLoading: enrolledLeadIdsLoading } = useEnrolledLeadIds();

  const { data: courses } = useCourses();
  const { data: classes } = useClasses();
  const reviewMutation = useReviewPaymentTicket();
  const deleteEnrollment = useDeleteEnrollment();
  const ensureEnrollment = useEnsureEnrollmentForLead();

  const tickets = ticketData?.data ?? EMPTY_ARRAY;
  const enrollments = enrollmentData?.data ?? EMPTY_ARRAY;
  const convertedLeads = convertedLeadData?.data ?? EMPTY_ARRAY;
  const allEnrolledLeadIds = useMemo(
    () => new Set(enrolledLeadIdsData?.data ?? []),
    [enrolledLeadIdsData],
  );
  const pendingConvertedLeads = useMemo(
    () => (enrolledLeadIdsLoading ? [] : convertedLeads.filter((l) => !allEnrolledLeadIds.has(l.id))),
    [enrolledLeadIdsLoading, convertedLeads, allEnrolledLeadIds],
  );
  const pendingTickets = useMemo(() => tickets.filter((t) => t.status === 'pending'), [tickets]);

  const latestPaymentMethodByEnrollmentId = useMemo(() => {
    const map = new Map<number, { method: string; date: string }>();
    tickets.forEach((t) => {
      if (t.status !== 'approved' || !t.enrollment_id) return;
      const date = t.payment_date ?? '';
      const existing = map.get(t.enrollment_id);
      if (!existing || date > existing.date) {
        map.set(t.enrollment_id, { method: t.payment_method, date });
      }
    });
    return map;
  }, [tickets]);

  const pendingLeadIdsKey = pendingConvertedLeads.map((l) => l.id).join(',');
  useEffect(() => {
    if (!courses || courses.length === 0) return;
    if (enrolledLeadIdsLoading) return;

    let cancelled = false;
    (async () => {
      for (const lead of pendingConvertedLeads) {
        if (cancelled) return;
        if (autoMaterializedLeadIds.has(lead.id)) continue;
        const courseId = lead.course_ids?.[0] ?? courses[0].id;

        autoMaterializedLeadIds.add(lead.id);
        const enrollmentDate = lead.appointment_date ?? lead.created_at ?? undefined;
        await ensureEnrollment.mutateAsync({
          lead_id: lead.id,
          category: 'khóa học',
          course_id: courseId,
          enrollment_date: enrollmentDate,
          sales_month: dayjs(enrollmentDate).format('YYYY-MM'),
          source: lead.source ?? undefined,
          tuition_fee: lead.tuition_fee ?? 0,
          note: getLatestNoteContent(lead.note),
        }).catch(() => {});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingLeadIdsKey, courses, enrolledLeadIdsLoading]);

  const mainRows: MainRow[] = useMemo(() => {
    const enrollmentRows: MainRow[] = enrollments.map((e) => ({ rowType: 'enrollment', ...e }));
    const leadRows: MainRow[] = pendingConvertedLeads.map((l) => ({ rowType: 'lead', ...l }));
    return [...enrollmentRows, ...leadRows].sort((a, b) => {
      const dateOf = (r: MainRow) => (r.rowType === 'enrollment' ? r.enrollment_date : r.created_at);
      return dayjs(dateOf(b) ?? undefined).valueOf() - dayjs(dateOf(a) ?? undefined).valueOf();
    });
  }, [enrollments, pendingConvertedLeads]);

  const pagedMainRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return mainRows.slice(start, start + pageSize);
  }, [mainRows, currentPage, pageSize]);

  const pendingLeadsTuition = useMemo(
    () => pendingConvertedLeads.reduce((sum, l) => sum + (l.tuition_fee ?? 0), 0),
    [pendingConvertedLeads],
  );
  const revenueTotal = useMemo(
    () => enrollments.reduce((sum, e) => sum + (e.tuition_fee ?? 0), 0) + pendingLeadsTuition,
    [enrollments, pendingLeadsTuition],
  );
  const debtTotal = useMemo(
    () => enrollments.reduce((sum, e) => sum + (e.debt_amount ?? 0), 0) + pendingLeadsTuition,
    [enrollments, pendingLeadsTuition],
  );

  const courseName = useCallback(
    (courseId: string | null) => (courseId ? (courses?.find((c) => c.id === courseId)?.name ?? courseId) : null),
    [courses]
  );
  const className = useCallback(
    (classId: string | null) => (classId ? (classes?.find((c) => c.id === classId)?.name ?? classId) : null),
    [classes]
  );

  const handleApprove = useCallback(
    (ticket: PaymentTicket) => {
      modal.confirm({
        title: 'Xác nhận duyệt',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        content: 'Bạn có chắc chắn muốn duyệt phiếu thu này?',
        okText: 'Duyệt',
        cancelText: 'Hủy',
        onOk: () => {
          reviewMutation.mutate(
            { id: ticket.id, input: { status: 'approved' } },
            {
              onSuccess: () => message.success('Đã duyệt phiếu thu'),
              onError: () => message.error('Duyệt thất bại'),
            }
          );
        },
      });
    },
    [message, modal, reviewMutation]
  );

  const handleOpenRejectModal = useCallback((ticket: PaymentTicket) => {
    setRejectTicketId(ticket.id);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const handleReject = useCallback(() => {
    if (!rejectTicketId || !rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    reviewMutation.mutate(
      { id: rejectTicketId, input: { status: 'rejected', reject_reason: rejectReason.trim() } },
      {
        onSuccess: () => {
          message.success('Đã từ chối phiếu thu');
          setRejectModalOpen(false);
          setRejectTicketId(null);
          setRejectReason('');
        },
        onError: () => message.error('Từ chối thất bại'),
      }
    );
  }, [message, rejectTicketId, rejectReason, reviewMutation]);

  const openEditForm = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    setFormOpen(true);
  };

  const openPaymentForm = (enrollment: Enrollment) => {
    setPayingEnrollment(enrollment);
    setPaymentOpen(true);
  };

  const handleDeleteEnrollment = useCallback(
    (enrollment: Enrollment) => {
      deleteEnrollment.mutate(enrollment.id, {
        onSuccess: () => message.success('Đã xóa đăng ký'),
        onError: () => message.error('Xóa đăng ký thất bại'),
      });
    },
    [deleteEnrollment, message]
  );

  const columns: ColumnsType<MainRow> = useMemo(
    () => [
      {
        title: 'STT',
        key: 'stt',
        width: 60,
        align: 'center' as const,
        render: (_: unknown, __: MainRow, index: number) => (currentPage - 1) * pageSize + index + 1,
      },
      {
        title: 'Họ và tên',
        key: 'customer_name',
        align: 'left' as const,
        render: (_: unknown, record: MainRow) => {
          const name = record.rowType === 'lead' ? record.full_name : record.lead_full_name || `Lead #${record.lead_id}`;
          return (
            <Typography.Text strong style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
              {name}
            </Typography.Text>
          );
        },
      },
      {
        title: 'Số điện thoại',
        key: 'customer_phone',
        width: 140,
        align: 'center' as const,
        render: (_: unknown, record: MainRow) => {
          const phone = record.rowType === 'lead' ? record.phone_number : record.lead_phone_number;
          return phone || '-';
        },
      },
      {
        title: 'Danh mục',
        key: 'category',
        width: 110,
        align: 'center' as const,
        render: (_: unknown, record: MainRow) => {
          const category = record.rowType === 'lead' ? 'khóa học' : record.category;
          return <Tag color={ENROLLMENT_CATEGORY_COLOR[category]}>{ENROLLMENT_CATEGORY_LABEL[category]}</Tag>;
        },
      },
      {
        title: 'Khóa học',
        key: 'course',
        width: 200,
        align: 'center' as const,
        render: (_: unknown, record: MainRow) => {
          if (record.rowType === 'lead') {
            const leadCourseId = record.course_ids?.[0];
            return (
              <div style={COURSE_CELL_STYLE}>
                {leadCourseId ? <span>{courseName(leadCourseId)}</span> : '-'}
              </div>
            );
          }
          if (record.category !== 'khóa học') {
            return <div style={COURSE_CELL_STYLE}>{record.item_name || '-'}</div>;
          }
          const crs = courseName(record.course_id);
          const cls = className(record.class_id);
          return (
            <div style={COURSE_CELL_STYLE}>
              <Space orientation="vertical" size={2}>
                <span>{crs}</span>
                {cls && cls !== crs && <Tag>{cls}</Tag>}
              </Space>
            </div>
          );
        },
      },
      {
        title: 'Nguồn',
        key: 'source',
        width: 110,
        align: 'center' as const,
        render: (_: unknown, record: MainRow) => record.source || '-',
      },
      {
        title: 'Học phí',
        key: 'tuition_fee',
        width: 140,
        align: 'center' as const,
        render: (_: unknown, record: MainRow) => (
          <Typography.Text strong style={{ color: '#1890ff' }}>
            {formatCurrencyVnd(record.tuition_fee ?? 0)}
          </Typography.Text>
        ),
      },
      {
        title: 'Đã đóng',
        key: 'paid_amount',
        width: 130,
        align: 'center' as const,
        render: (_: unknown, record: MainRow) =>
          formatCurrencyVnd(record.rowType === 'enrollment' ? record.paid_amount : 0),
      },
      {
        title: 'Còn nợ',
        key: 'debt_amount',
        width: 130,
        align: 'center' as const,
        render: (_: unknown, record: MainRow) => {
          const debt = record.rowType === 'enrollment' ? record.debt_amount : record.tuition_fee ?? 0;
          return <span style={{ color: debt > 0 ? '#cf1322' : undefined }}>{formatCurrencyVnd(debt)}</span>;
        },
      },
      {
        title: 'Ngày',
        key: 'date',
        width: 120,
        align: 'center' as const,
        render: (_: unknown, record: MainRow) => {
          const date = record.rowType === 'enrollment' ? record.enrollment_date : record.created_at;
          return date ? dayjs(date).format('DD/MM/YYYY') : '';
        },
      },
      {
        title: 'Phương thức',
        key: 'payment_method',
        width: 170,
        align: 'center' as const,
        render: (_: unknown, record: MainRow) => {
          if (record.rowType !== 'enrollment') return '-';
          const latest = latestPaymentMethodByEnrollmentId.get(record.id);
          if (!latest) return '-';
          return (
            <Tag color={PaymentMethodColor[latest.method] ?? 'default'}>
              {PaymentMethodLabel[latest.method] ?? latest.method}
            </Tag>
          );
        },
      },
      {
        title: 'Tư vấn viên',
        key: 'created_by_name',
        width: 140,
        align: 'center' as const,
        render: (_: unknown, record: MainRow) => (record.rowType === 'enrollment' ? record.created_by_name : null),
      },
      {
        title: 'Ghi chú',
        key: 'note',
        width: 180,
        align: 'left' as const,
        render: (_: unknown, record: MainRow) => {
          const note = record.rowType === 'lead' ? getLatestNoteContent(record.note) : record.note;
          return (
            <Typography.Text ellipsis={{ tooltip: note }} style={{ maxWidth: 172, display: 'block' }}>
              {note}
            </Typography.Text>
          );
        },
      },
      {
        title: 'Thao tác',
        key: 'action',
        align: 'center' as const,
        fixed: 'right' as const,
        width: 150,
        render: (_: unknown, record: MainRow) => {
          if (record.rowType === 'lead') return null;
          return (
            <Space>
              <Tooltip title="Thu tiền">
                <Button
                  type="primary"
                  size="small"
                  icon={<DollarOutlined />}
                  onClick={() => openPaymentForm(record)}
                />
              </Tooltip>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditForm(record)} />
              <Popconfirm
                title="Xóa đăng ký này?"
                description={
                  record.paid_amount > 0
                    ? `Sẽ xóa luôn ${formatCurrencyVnd(record.paid_amount)} phiếu thu đã ghi nhận cho đăng ký này.`
                    : undefined
                }
                okText="Xóa"
                cancelText="Hủy"
                onConfirm={() => handleDeleteEnrollment(record)}
              >
                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [courseName, className, handleDeleteEnrollment, currentPage, pageSize, latestPaymentMethodByEnrollmentId]
  );

  const pendingColumns: ColumnsType<PaymentTicket> = useMemo(
    () => [
      {
        title: 'Khách hàng',
        key: 'customer',
        render: (_: unknown, record: PaymentTicket) => (
          <Space orientation="vertical" size={2}>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {record.lead_full_name || `Lead #${record.lead_id}`}
            </Typography.Text>
            {record.lead_phone_number && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record.lead_phone_number}
              </Typography.Text>
            )}
          </Space>
        ),
      },
      {
        title: 'Số tiền',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount: number) => (
          <Typography.Text strong style={{ color: '#1890ff' }}>
            {formatCurrencyVnd(amount)}
          </Typography.Text>
        ),
      },
      {
        title: 'Phương thức',
        dataIndex: 'payment_method',
        key: 'payment_method',
        render: (method: string) => (
          <Tag color={PaymentMethodColor[method] ?? 'default'}>{PaymentMethodLabel[method] ?? method}</Tag>
        ),
      },
      {
        title: 'Ngày',
        dataIndex: 'payment_date',
        key: 'payment_date',
        render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : ''),
      },
      {
        title: 'Ghi chú',
        dataIndex: 'note',
        key: 'note',
        ellipsis: true,
      },
      {
        title: 'Thao tác',
        key: 'action',
        align: 'center' as const,
        render: (_: unknown, record: PaymentTicket) => (
          <Space>
            <Tooltip title="Duyệt">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record)}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              />
            </Tooltip>
            <Tooltip title="Từ chối">
              <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleOpenRejectModal(record)} />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [handleApprove, handleOpenRejectModal]
  );

  return (
    <div>
      <Row justify="space-between" align="middle" className="mb-section">
        <Col>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Kế toán
          </Typography.Title>
        </Col>
      </Row>

      <PaymentStatsCards
        enrollmentCount={enrollments.length + pendingConvertedLeads.length}
        debtTotal={debtTotal}
        revenueTotal={revenueTotal}
      />

      {pendingTickets.length > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 16, borderRadius: 12 }}
          title={
            <Alert
              type="warning"
              showIcon
              banner
              title={`${pendingTickets.length} phiếu thu đang chờ duyệt (không tính vào Đã đóng cho đến khi được duyệt)`}
            />
          }
          styles={{ header: { border: 'none', padding: 0 }, body: { paddingTop: 12 } }}
        >
          <Table
            columns={pendingColumns}
            dataSource={pendingTickets}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}

      <Row align="middle" className="mb-section" gutter={[12, 12]}>
        <Col xs={24} md={16}>
          <Space wrap style={isMobile ? { width: '100%' } : undefined}>
            <DatePicker.RangePicker
              value={filterRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setFilterRange([dates[0], dates[1]]);
                }
              }}
              format="DD/MM/YYYY"
              allowClear={false}
              style={isMobile ? { flex: 1, minWidth: 220 } : undefined}
            />
            <Button
              icon={<ReloadOutlined />}
              loading={ticketsFetching || enrollmentsFetching || convertedLeadsFetching}
              onClick={() => {
                refetchTickets();
                refetchEnrollments();
                refetchConvertedLeads();
              }}
              style={isMobile ? { flex: 1 } : undefined}
            >
              Làm mới
            </Button>
          </Space>
        </Col>
        <Col xs={24} md={8} style={isMobile ? undefined : { textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            block={isMobile}
            onClick={() => setCreateOpen(true)}
          >
            Thêm đăng ký
          </Button>
        </Col>
      </Row>

      {isMobile ? (
        <Spin spinning={ticketsLoading || enrollmentsLoading || convertedLeadsLoading}>
          {mainRows.length === 0 ? (
            <Empty description="Chưa có dữ liệu" style={{ padding: '32px 0' }} />
          ) : (
            <>
              {pagedMainRows.map((record) => (
                <MainRowCard
                  key={`${record.rowType}-${record.id}`}
                  record={record}
                  courseName={courseName}
                  className={className}
                  onPay={openPaymentForm}
                  onEdit={openEditForm}
                  onDelete={handleDeleteEnrollment}
                />
              ))}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={mainRows.length}
                  simple
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                />
              </div>
            </>
          )}
        </Spin>
      ) : (
        <Table
          columns={columns}
          dataSource={mainRows}
          loading={ticketsLoading || enrollmentsLoading || convertedLeadsLoading}
          rowKey={(record) => `${record.rowType}-${record.id}`}
          scroll={{ x: 'max-content' }}
          bordered={false}
          className="minimal-table"
          pagination={{
            current: currentPage,
            pageSize,
            total: mainRows.length,
            showSizeChanger: true,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
        />
      )}

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

      <EnrollmentModal
        open={formOpen}
        leadName={editingEnrollment?.lead_full_name}
        enrollment={editingEnrollment}
        onClose={() => setFormOpen(false)}
      />

      <EnrollmentPaymentModal
        open={paymentOpen}
        enrollment={payingEnrollment}
        onClose={() => setPaymentOpen(false)}
      />

      <EnrollmentCreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
