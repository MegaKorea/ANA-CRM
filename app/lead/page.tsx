'use client';

import { Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { App, Table, Row, Col, Form, Empty, Pagination, Spin } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { Lead, LeadQueryParams } from '@/lib/services/lead.service';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/validators/lead.validator';
import { useLeads, useLead, useCreateLead, useUpdateLead, useDeleteLead } from '@/lib/hooks/use-leads';
import { useLeadModal } from '@/lib/hooks/use-lead-modal';
import {
  LeadPageText,
  getLeadTableColumns,
  resolveCreatedAtBounds,
  type CareMilestone,
} from '@/app/lead/constants';
import type { LeadFormValues } from '@/app/lead/components/LeadModal';
import { LeadStatus, LeadSource, DateFormat } from '@/constants/enums';
import { type LocationValue } from '@/components/common/LocationSelect';
import type { LocationValueV2 } from '@/components/common/LocationSelectV2';
import { useCourses } from '@/lib/hooks/use-courses';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import dynamic from 'next/dynamic';
import { LeadFilters } from '@/app/lead/components/LeadFilters';
import { LeadMobileCard } from '@/app/lead/components/LeadMobileCard';
import {
  LeadSummaryCards,
  resolveSummaryRange,
  type LeadStatFilter,
} from '@/app/lead/components/LeadSummaryCards';
import {
  LeadColumnSettings,
  useLeadHiddenColumns,
} from '@/app/lead/components/LeadColumnSettings';
import { hasSmaxConversation } from '@/lib/smax/parse-smax-log';

const LeadModal = dynamic(
  () => import('@/app/lead/components/LeadModal').then((m) => m.LeadModal),
  { ssr: false },
);
const LeadDetailModal = dynamic(
  () => import('@/app/lead/components/LeadDetailModal').then((m) => m.LeadDetailModal),
  { ssr: false },
);
const NoteHistoryModal = dynamic(
  () => import('@/app/lead/components/NoteHistoryModal').then((m) => m.NoteHistoryModal),
  { ssr: false },
);
const NoteSummarizeModal = dynamic(
  () => import('@/app/lead/components/NoteSummarizeModal').then((m) => m.NoteSummarizeModal),
  { ssr: false },
);
const LeadImagesModal = dynamic(
  () => import('@/app/lead/components/LeadImagesModal').then((m) => m.LeadImagesModal),
  { ssr: false },
);

const AttendanceDrawer = dynamic(
  () => import('@/app/lead/components/AttendanceDrawer').then((m) => m.AttendanceDrawer),
  { ssr: false },
);

const AppointmentDrawer = dynamic(
  () => import('@/app/lead/components/AppointmentDrawer'),
  { ssr: false }
);

const ConversationModal = dynamic(
  () => import('@/app/lead/components/ConversationModal'),
  { ssr: false },
);

const LEAD_PAGE_SIZE_OPTIONS = [15, 30, 50, 100];

export default function LeadPage() {
  return (
    <Suspense fallback={null}>
      <LeadPageContent />
    </Suspense>
  );
}

function LeadPageContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form] = Form.useForm<LeadFormValues>();
  const detailModal = useLeadModal();

  const highlightParam = searchParams.get('highlight');
  const highlightId = highlightParam ? Number(highlightParam) : null;
  const { data: highlightedLead } = useLead(
    highlightId != null && !Number.isNaN(highlightId) ? highlightId : null,
  );
  const [appliedHighlightId, setAppliedHighlightId] = useState<number | null>(null);
  if (highlightedLead && highlightedLead.id !== appliedHighlightId) {
    setAppliedHighlightId(highlightedLead.id);
    detailModal.openModal(highlightedLead);
  }
  useEffect(() => {
    if (appliedHighlightId != null) {
      router.replace('/lead', { scroll: false });
    }
  }, [appliedHighlightId, router]);

  const noteHistoryModal = useLeadModal();
  const noteSummarizeModal = useLeadModal();
  const imagesModal = useLeadModal();
  const attendanceModal = useLeadModal();
  const appointmentModal = useLeadModal();
  const conversationModal = useLeadModal();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInputKey, setSearchInputKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>(undefined);
  const [sourceFilter, setSourceFilter] = useState<LeadSource | undefined>(undefined);
  const [courseFilter, setCourseFilter] = useState<string | undefined>(undefined);
  const [createdAtRange, setCreatedAtRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [careMilestone, setCareMilestone] = useState<CareMilestone | undefined>(undefined);
  const [statFilter, setStatFilter] = useState<LeadStatFilter | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(LEAD_PAGE_SIZE_OPTIONS[0]);
  const isMobile = useIsMobile();

  const appointmentParam = searchParams.get('appointment');
  const appointmentLeadId = appointmentParam ? Number(appointmentParam) : null;
  const { data: appointmentDeepLinkLead } = useLead(
    appointmentLeadId != null && !Number.isNaN(appointmentLeadId) ? appointmentLeadId : null,
  );
  const [appliedAppointmentId, setAppliedAppointmentId] = useState<number | null>(null);
  const [focusAppointmentLeadId, setFocusAppointmentLeadId] = useState<number | null>(null);

  if (appointmentDeepLinkLead && appointmentDeepLinkLead.id !== appliedAppointmentId) {
    setAppliedAppointmentId(appointmentDeepLinkLead.id);
    const lookup =
      appointmentDeepLinkLead.phone_number?.trim() ||
      appointmentDeepLinkLead.full_name?.trim() ||
      '';
    if (lookup) {
      setSearchKeyword(lookup);
      setSearchInputKey((key) => key + 1);
    }
    setStatusFilter(undefined);
    setSourceFilter(undefined);
    setCourseFilter(undefined);
    setCreatedAtRange(null);
    setCareMilestone(undefined);
    setStatFilter(undefined);
    setCurrentPage(1);
    setFocusAppointmentLeadId(appointmentDeepLinkLead.id);
  }
  useEffect(() => {
    if (appliedAppointmentId != null) {
      router.replace('/lead', { scroll: false });
    }
  }, [appliedAppointmentId, router]);

  const handleSearch = useCallback((val: string) => {
    setSearchKeyword(val);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((val: LeadStatus | undefined) => {
    setStatusFilter(val);
    setCurrentPage(1);
  }, []);

  const handleSourceChange = useCallback((val: LeadSource | undefined) => {
    setSourceFilter(val);
    setCurrentPage(1);
  }, []);

  const handleCourseChange = useCallback((val: string | undefined) => {
    setCourseFilter(val);
    setCurrentPage(1);
  }, []);

  const handleCreatedAtRangeChange = useCallback((val: [Dayjs | null, Dayjs | null] | null) => {
    setCreatedAtRange(val);
    setCurrentPage(1);
  }, []);

  const handleCareMilestoneChange = useCallback((val: CareMilestone | undefined) => {
    setCareMilestone(val);
    setCurrentPage(1);
  }, []);

  const handleStatFilterChange = useCallback((val: LeadStatFilter | undefined) => {
    setStatFilter(val);
    setCurrentPage(1);
  }, []);

  const createdAtBounds = useMemo(
    () => resolveCreatedAtBounds(createdAtRange, careMilestone),
    [createdAtRange, careMilestone],
  );

  const summaryFilters = useMemo(
    () => ({
      search: searchKeyword || undefined,
      status: statusFilter,
      source: sourceFilter,
      courseId: courseFilter,
      startDate: createdAtBounds.startDate,
      endDate: createdAtBounds.endDate,
    }),
    [searchKeyword, statusFilter, sourceFilter, courseFilter, createdAtBounds],
  );

  // A clicked stat card narrows the table to the leads behind its number, so
  // the funnel cards use the funnel's own range and the today/tomorrow cards
  // ignore the created-at range (their counts are fixed to the appointment day).
  const statQuery = useMemo((): LeadQueryParams | null => {
    switch (statFilter) {
      case 'booked':
        return { ...resolveSummaryRange(createdAtBounds), hasAppointment: true };
      case 'converted':
        return { ...resolveSummaryRange(createdAtBounds), status: LeadStatus.CONVERTED };
      case 'today':
      case 'tomorrow': {
        const day = dayjs()
          .add(statFilter === 'tomorrow' ? 1 : 0, 'day')
          .format(DateFormat.ISO_DATE);
        return {
          startDate: undefined,
          endDate: undefined,
          appointmentStartDate: day,
          appointmentEndDate: day,
        };
      }
      default:
        return null;
    }
  }, [statFilter, createdAtBounds]);

  const tableStatus = statQuery?.status ?? statusFilter;
  const { data, isLoading } = useLeads({
    search: searchKeyword || undefined,
    status: tableStatus,
    excludeStatus: tableStatus || statQuery ? undefined : LeadStatus.CONVERTED,
    source: sourceFilter,
    course_id: courseFilter,
    startDate: createdAtBounds.startDate,
    endDate: createdAtBounds.endDate,
    ...statQuery,
    page: currentPage,
    limit: pageSize,
  });

  const { data: courses } = useCourses();

  const leads = useMemo(() => data?.data || [], [data?.data]);
  const total = data?.total || 0;

  useEffect(() => {
    if (focusAppointmentLeadId == null || isLoading) return;
    if (!leads.some((lead) => lead.id === focusAppointmentLeadId)) return;

    const timer = window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(
        `[data-lead-appointment="${focusAppointmentLeadId}"]`,
      );
      target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [focusAppointmentLeadId, leads, isLoading]);

  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();

  const handleOpenModal = useCallback(
    (lead?: Lead) => {
      if (lead) {
        setEditingLead(lead);
        form.setFieldsValue({
          full_name: lead.full_name,
          email: lead.email || undefined,
          phone_number: lead.phone_number || undefined,
          date_of_birth: lead.date_of_birth || undefined,
          place_of_birth: (lead.place_of_birth ?? undefined) as LocationValue | undefined,
          place_of_origin: (lead.place_of_origin ?? undefined) as LocationValue | undefined,
          current_address: (lead.current_address ?? undefined) as LocationValue | undefined,
          current_address_temp: (lead.current_address_temp ?? undefined) as LocationValueV2 | undefined,
          citizen_id: lead.citizen_id || undefined,
          nationality: lead.nationality || undefined,
          ethnicity: lead.ethnicity || undefined,
          source: lead.source || undefined,
          status: lead.status || undefined,
          course_ids: lead.course_ids || undefined,

          appointment_date: lead.appointment_date ? dayjs(lead.appointment_date) : undefined,
          facebook_url: lead.facebook_url || undefined,
          pid_zalo: lead.pid_zalo || undefined,
          conversation: lead.conversation || undefined,
          tuition_fee: lead.tuition_fee ?? undefined,
          rate: lead.rate ?? 0,
          created_at: lead.created_at ? dayjs(lead.created_at) : undefined,
        });
      } else {
        setEditingLead(null);
        form.resetFields();
      }
      setIsModalOpen(true);
    },
    [form],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingLead(null);
    form.resetFields();
  }, [form]);

  const handleError = useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : LeadPageText.ERROR_GENERIC;
    message.error(errorMessage);
  }, [message]);

  const handleSubmit = useCallback(
    (values: LeadFormValues) => {
      const payloadBase = {
        full_name: values.full_name,
        email: values.email,
        phone_number: values.phone_number,
        date_of_birth: values.date_of_birth,
        place_of_birth: values.place_of_birth,
        place_of_origin: values.place_of_origin,
        current_address: values.current_address,
        current_address_temp: values.current_address_temp,
        citizen_id: values.citizen_id,
        nationality: 'Việt Nam',
        ethnicity: values.ethnicity,
        source: values.source,
        status: values.status,
        course_ids: values.course_ids,

        appointment_date:
          values.appointment_date === null
            ? null
            : values.appointment_date
              ? values.appointment_date.toISOString()
              : undefined,
        facebook_url: values.facebook_url,
        pid_zalo: values.pid_zalo,
        conversation: values.conversation,
        tuition_fee: values.tuition_fee,
        rate: values.rate,
        created_at: values.created_at ? values.created_at.toISOString() : undefined,
      };

      if (editingLead) {
        const payload: UpdateLeadInput = payloadBase;
        updateLeadMutation.mutate(
          {
            id: editingLead.id,
            input: payload,
          },
          {
            onSuccess: () => {
              message.success(LeadPageText.SUCCESS_UPDATE);
              handleCloseModal();
            },
            onError: handleError,
          },
        );
      } else {
        const payload: CreateLeadInput = payloadBase as CreateLeadInput;
        createLeadMutation.mutate(payload, {
          onSuccess: () => {
            message.success(LeadPageText.SUCCESS_CREATE);
            handleCloseModal();
          },
          onError: handleError,
        });
      }
    },
    [editingLead, updateLeadMutation, createLeadMutation, handleCloseModal, handleError, message],
  );

  const handleDelete = useCallback(
    (id: number) => {
      deleteLeadMutation.mutate(id, {
        onSuccess: () => {
          message.success(LeadPageText.SUCCESS_DELETE);
          handleCloseModal();
        },
        onError: handleError,
      });
    },
    [deleteLeadMutation, handleCloseModal, handleError, message],
  );

  const columns = useMemo(
    () =>
      getLeadTableColumns({
        handleOpenModal,
        handleOpenDetailModal: detailModal.openModal,
        handleOpenNoteHistoryModal: noteHistoryModal.openModal,
        handleOpenNoteSummarizeModal: noteSummarizeModal.openModal,
        handleOpenImagesModal: imagesModal.openModal,
        handleOpenAttendanceModal: attendanceModal.openModal,
        handleOpenAppointmentModal: appointmentModal.openModal,
        handleOpenConversationModal: conversationModal.openModal,
        courses,
      }).map((col: any) => ({
        ...col,
        onCell: () =>
          ({
            'data-label': typeof col.title === 'string' ? col.title : '',
          }) as any,
      })),
    [
      handleOpenModal,
      detailModal.openModal,
      noteHistoryModal.openModal,
      noteSummarizeModal.openModal,
      imagesModal.openModal,
      attendanceModal.openModal,
      appointmentModal.openModal,
      conversationModal.openModal,
      courses,
    ],
  );

  const { hiddenKeys: hiddenColumnKeys, setHiddenKeys: setHiddenColumnKeys } =
    useLeadHiddenColumns();
  const columnOptions = useMemo(
    () => columns.map((col: any) => ({ key: col.key as string, title: col.title })),
    [columns],
  );
  const visibleColumns = useMemo(
    () => columns.filter((col: any) => !hiddenColumnKeys.has(col.key as string)),
    [columns, hiddenColumnKeys],
  );

  const isSubmitting = createLeadMutation.isPending || updateLeadMutation.isPending;

  const handleSubmitAsync = useCallback(
    async (values: LeadFormValues) => {
      handleSubmit(values);
    },
    [handleSubmit],
  );

  return (
    <div>
      <LeadSummaryCards
        filters={summaryFilters}
        activeFilter={statFilter}
        onFilterChange={handleStatFilterChange}
      />

      <LeadFilters
        searchKey={searchInputKey}
        searchDefaultValue={searchKeyword}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        sourceFilter={sourceFilter}
        onSourceChange={handleSourceChange}
        courseFilter={courseFilter}
        onCourseChange={handleCourseChange}
        createdAtRange={createdAtRange}
        onCreatedAtRangeChange={handleCreatedAtRangeChange}
        careMilestone={careMilestone}
        onCareMilestoneChange={handleCareMilestoneChange}
        courses={courses || []}
        onCreate={() => handleOpenModal()}
        extra={
          !isMobile && (
            <LeadColumnSettings
              columns={columnOptions}
              hiddenKeys={hiddenColumnKeys}
              onChange={setHiddenColumnKeys}
            />
          )
        }
      />

      <Row>
        <Col span={24}>
          {!isMobile ? (
            <Table<Lead>
              scroll={{ x: 'max-content' }}
              columns={visibleColumns}
              dataSource={leads}
              loading={isLoading}
              rowKey="id"
              rowClassName={(record) =>
                record.id === focusAppointmentLeadId ? 'lead-appointment-focus' : ''
              }
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                pageSizeOptions: LEAD_PAGE_SIZE_OPTIONS,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
              }}
              bordered={false}
              size="small"
              className="minimal-table"
            />
          ) : isLoading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : leads.length === 0 ? (
            <Empty description="Không có dữ liệu" />
          ) : (
            <>
              <div role="list" style={{ display: 'grid', gap: 16 }}>
                {leads.map((lead) => (
                  <div
                    role="listitem"
                    key={lead.id}
                    className={
                      lead.id === focusAppointmentLeadId ? 'lead-appointment-focus' : undefined
                    }
                  >
                    <LeadMobileCard
                      lead={lead}
                      courses={courses || []}
                      onOpenDetail={detailModal.openModal}
                      onOpenModal={handleOpenModal}
                      onOpenNoteHistory={noteHistoryModal.openModal}
                      onOpenNoteSummarize={noteSummarizeModal.openModal}
                      onOpenImages={imagesModal.openModal}
                      onOpenAttendance={attendanceModal.openModal}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                size="small"
                align="center"
                showSizeChanger
                pageSizeOptions={LEAD_PAGE_SIZE_OPTIONS}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                style={{ marginTop: 16 }}
              />
            </>
          )}
        </Col>
      </Row>

      <LeadModal
        open={isModalOpen}
        editingLead={editingLead}
        form={form}
        isSubmitting={isSubmitting}
        isDeleting={deleteLeadMutation.isPending}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAsync}
        onDelete={handleDelete}
      />

      <LeadDetailModal
        open={detailModal.open}
        lead={detailModal.lead}
        onClose={detailModal.closeModal}
        onOpenNoteSummarize={noteSummarizeModal.openModal}
        onOpenImages={imagesModal.openModal}
      />

      <NoteHistoryModal
        open={noteHistoryModal.open}
        lead={noteHistoryModal.lead}
        onClose={noteHistoryModal.closeModal}
      />

      <NoteSummarizeModal
        open={noteSummarizeModal.open}
        lead={noteSummarizeModal.lead}
        onClose={noteSummarizeModal.closeModal}
      />

      <LeadImagesModal
        open={imagesModal.open}
        lead={imagesModal.lead}
        onClose={imagesModal.closeModal}
      />

      <AttendanceDrawer
        open={attendanceModal.open}
        lead={attendanceModal.lead}
        onClose={attendanceModal.closeModal}
      />

      <AppointmentDrawer
        open={appointmentModal.open}
        leadId={appointmentModal.lead?.id}
        leadName={appointmentModal.lead?.full_name}
        onClose={appointmentModal.closeModal}
      />

      {conversationModal.lead && hasSmaxConversation(conversationModal.lead.smax_log) && (
        <ConversationModal
          smaxLog={conversationModal.lead.smax_log}
          open={conversationModal.open}
          onCancel={conversationModal.closeModal}
        />
      )}
    </div>
  );
}
