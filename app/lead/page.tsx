'use client';

import { useState, useMemo, useCallback } from 'react';
import { Table, Button, Space, message, Row, Col, Form, Typography, List, Tabs } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { Lead } from '@/lib/services/lead.service';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/validators/lead.validator';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from '@/lib/hooks/use-leads';
import {
  LeadDateRangePlaceholder,
  LeadPageGap,
  LeadPageMargin,
  LeadPagePadding,
  LeadPageText,
  getLeadTableColumns,
} from '@/app/lead/constants';
import type { LeadFormValues } from '@/app/lead/components/LeadModal';
import { LeadStatus, DateFormat, LeadSource, DateLocale } from '@/constants/enums';
import { type LocationValue } from '@/components/common/LocationSelect';
import type { LocationValueV2 } from '@/components/common/LocationSelectV2';
import { useCourses } from '@/lib/hooks/use-courses';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import dynamic from 'next/dynamic';
import { LeadFilters } from '@/app/lead/components/LeadFilters';
import { LeadMobileCard } from '@/app/lead/components/LeadMobileCard';
import { LeadStatistics } from '@/app/lead/components/LeadStatistics';

const LeadModal = dynamic(
  () => import('@/app/lead/components/LeadModal').then((m) => m.LeadModal),
  { ssr: false },
);
const LeadDetailModal = dynamic(
  () => import('@/app/lead/components/LeadDetailModal').then((m) => m.LeadDetailModal),
  { ssr: false },
);
const NoteAddModal = dynamic(
  () => import('@/app/lead/components/NoteAddModal').then((m) => m.NoteAddModal),
  { ssr: false },
);
const NoteHistoryModal = dynamic(
  () => import('@/app/lead/components/NoteHistoryModal').then((m) => m.NoteHistoryModal),
  { ssr: false },
);
const LeadImagesModal = dynamic(
  () => import('@/app/lead/components/LeadImagesModal').then((m) => m.LeadImagesModal),
  { ssr: false },
);

const AttendanceModal = dynamic(
  () => import('@/app/lead/components/AttendanceModal').then((m) => m.AttendanceModal),
  { ssr: false },
);

export default function LeadPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form] = Form.useForm<LeadFormValues>();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  const [isNoteAddModalOpen, setIsNoteAddModalOpen] = useState(false);
  const [noteAddLead, setNoteAddLead] = useState<Lead | null>(null);
  const [isNoteHistoryModalOpen, setIsNoteHistoryModalOpen] = useState(false);
  const [noteHistoryLead, setNoteHistoryLead] = useState<Lead | null>(null);

  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
  const [imagesLead, setImagesLead] = useState<Lead | null>(null);

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceLead, setAttendanceLead] = useState<Lead | null>(null);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>(undefined);
  const [sourceFilter, setSourceFilter] = useState<LeadSource | undefined>(undefined);
  const [courseFilter, setCourseFilter] = useState<string | undefined>(undefined);
  const [createdAtRange, setCreatedAtRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const isMobile = useIsMobile();

  const { data, isLoading, isFetching, refetch } = useLeads({
    search: searchKeyword || undefined,
    status: statusFilter,
    source: sourceFilter,
    course_id: courseFilter,
    startDate: createdAtRange?.[0] ? createdAtRange[0].format(DateFormat.ISO_DATE) : undefined,
    endDate: createdAtRange?.[1] ? createdAtRange[1].format(DateFormat.ISO_DATE) : undefined,
    page: currentPage,
    limit: pageSize,
  });

  const { data: courses } = useCourses();

  const leads = data?.data || [];
  const total = data?.total || 0;
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
          sales_amount: lead.sales_amount ?? undefined,
          deposit: lead.deposit ?? undefined,
          outstanding_balance: lead.outstanding_balance ?? undefined,
          appointment_date: lead.appointment_date ? dayjs(lead.appointment_date) : undefined,
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
  }, []);

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
        sales_amount: values.sales_amount === null ? null : values.sales_amount,
        deposit: values.deposit === null ? null : values.deposit,
        outstanding_balance:
          values.outstanding_balance === null ? null : values.outstanding_balance,
        appointment_date:
          values.appointment_date === null
            ? null
            : values.appointment_date
              ? values.appointment_date.toISOString()
              : undefined,
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
    [editingLead, updateLeadMutation, createLeadMutation, handleCloseModal, handleError],
  );

  const handleDelete = useCallback(
    (id: number) => {
      deleteLeadMutation.mutate(id, {
        onSuccess: () => {
          message.success(LeadPageText.SUCCESS_DELETE);
        },
        onError: handleError,
      });
    },
    [deleteLeadMutation, handleError],
  );

  const handleRefresh = useCallback(() => {
    refetch()
      .then(() => {
        message.success(LeadPageText.SUCCESS_REFRESH);
      })
      .catch(handleError);
  }, [refetch, handleError]);

  const handleOpenDetailModal = useCallback((lead: Lead) => {
    setDetailLead(lead);
    setIsDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setDetailLead(null);
  }, []);

  const handleOpenNoteAddModal = useCallback((lead: Lead) => {
    setNoteAddLead(lead);
    setIsNoteAddModalOpen(true);
  }, []);

  const handleCloseNoteAddModal = useCallback(() => {
    setIsNoteAddModalOpen(false);
    setNoteAddLead(null);
  }, []);

  const handleOpenNoteHistoryModal = useCallback((lead: Lead) => {
    setNoteHistoryLead(lead);
    setIsNoteHistoryModalOpen(true);
  }, []);

  const handleCloseNoteHistoryModal = useCallback(() => {
    setIsNoteHistoryModalOpen(false);
    setNoteHistoryLead(null);
  }, []);

  const handleOpenImagesModal = useCallback((lead: Lead) => {
    setImagesLead(lead);
    setIsImagesModalOpen(true);
  }, []);

  const handleCloseImagesModal = useCallback(() => {
    setIsImagesModalOpen(false);
    setImagesLead(null);
  }, []);

  const handleOpenAttendanceModal = useCallback((lead: Lead) => {
    setAttendanceLead(lead);
    setIsAttendanceModalOpen(true);
  }, []);

  const handleCloseAttendanceModal = useCallback(() => {
    setIsAttendanceModalOpen(false);
    setAttendanceLead(null);
  }, []);

  const columns = useMemo(
    () =>
      getLeadTableColumns({
        handleOpenModal,
        handleDelete,
        handleOpenDetailModal,
        handleOpenNoteAddModal,
        handleOpenNoteHistoryModal,
        handleOpenImagesModal,
        handleOpenAttendanceModal,
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
      handleDelete,
      handleOpenDetailModal,
      handleOpenNoteAddModal,
      handleOpenNoteHistoryModal,
      handleOpenImagesModal,
      handleOpenAttendanceModal,
      courses,
    ],
  );

  const isSubmitting = createLeadMutation.isPending || updateLeadMutation.isPending;

  const handleSubmitAsync = useCallback(
    async (values: LeadFormValues) => {
      handleSubmit(values);
    },
    [handleSubmit],
  );

  return (
    <div className="p-page">
      <Row justify="space-between" align="middle" className="mb-section">
        <Col>
          <Typography.Title level={2} className="text-h2" style={{ margin: 0 }}>
            {LeadPageText.TITLE}
          </Typography.Title>
        </Col>
        <Col style={{ marginTop: 15 }}>
          <Space size={LeadPageGap.ACTIONS}>
            <Button icon={<ReloadOutlined />} loading={isFetching} onClick={handleRefresh}>
              {LeadPageText.BUTTON_REFRESH}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              {LeadPageText.BUTTON_CREATE}
            </Button>
          </Space>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="list"
        items={[
          {
            key: 'list',
            label: 'Danh sách khách hàng',
            children: (
              <>
                <LeadFilters
                  onSearch={setSearchKeyword}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  sourceFilter={sourceFilter}
                  onSourceChange={setSourceFilter}
                  courseFilter={courseFilter}
                  onCourseChange={setCourseFilter}
                  createdAtRange={createdAtRange}
                  onCreatedAtRangeChange={setCreatedAtRange}
                  courses={courses || []}
                />

                <Row>
                  <Col span={24}>
                    {!isMobile ? (
                      <Table<Lead>
                        scroll={{ x: 'max-content' }}
                        columns={columns}
                        dataSource={leads}
                        loading={isLoading}
                        rowKey="id"
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
                        bordered
                      />
                    ) : (
                      <List
                        grid={{ gutter: 16, column: 1 }}
                        dataSource={leads}
                        loading={isLoading}
                        pagination={{
                          current: currentPage,
                          pageSize: pageSize,
                          total: total,
                          size: 'small',
                          align: 'center',
                          onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                          },
                        }}
                        renderItem={(lead) => (
                          <List.Item>
                            <LeadMobileCard
                              lead={lead}
                              courses={courses || []}
                              onOpenDetail={handleOpenDetailModal}
                              onOpenModal={handleOpenModal}
                              onOpenNoteAdd={handleOpenNoteAddModal}
                              onOpenNoteHistory={handleOpenNoteHistoryModal}
                              onOpenImages={handleOpenImagesModal}
                              onOpenAttendance={handleOpenAttendanceModal}
                              onDelete={handleDelete}
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: 'stats',
            label: 'Thống kê',
            children: <LeadStatistics />,
          },
        ]}
      />

      <LeadModal
        open={isModalOpen}
        editingLead={editingLead}
        form={form}
        isSubmitting={isSubmitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAsync}
      />

      <LeadDetailModal
        open={isDetailModalOpen}
        lead={detailLead}
        onClose={handleCloseDetailModal}
      />

      <NoteAddModal
        open={isNoteAddModalOpen}
        lead={noteAddLead}
        onClose={handleCloseNoteAddModal}
      />

      <NoteHistoryModal
        open={isNoteHistoryModalOpen}
        lead={noteHistoryLead}
        onClose={handleCloseNoteHistoryModal}
      />

      <LeadImagesModal
        open={isImagesModalOpen}
        lead={imagesLead}
        onClose={handleCloseImagesModal}
      />

      <AttendanceModal
        open={isAttendanceModalOpen}
        lead={attendanceLead}
        onClose={handleCloseAttendanceModal}
      />
    </div>
  );
}
