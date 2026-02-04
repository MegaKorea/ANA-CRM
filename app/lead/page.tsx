'use client';

import { useState, useMemo, useCallback } from 'react';
import { Table, Button, Space, message, Row, Col, Form, Select, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Lead } from '@/lib/services/lead.service';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/validators/lead.validator';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from '@/lib/hooks/use-leads';
import { LeadPageGap, LeadPageMargin, LeadPagePadding, LeadPageText, LeadStatusLabel, getLeadTableColumns } from '@/app/lead/constants';
import { LeadModal, type LeadFormValues } from '@/app/lead/components/LeadModal';
import { DebouncedInput } from '@/components/common/DebouncedInput';
import { LeadStatus } from '@/constants/enums';
import { type LocationValue } from '@/components/common/LocationSelect';

export default function LeadPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form] = Form.useForm<LeadFormValues>();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>(undefined);

  const { data: leads, isLoading, isFetching, refetch } = useLeads(
    searchKeyword || statusFilter
      ? {
          search: searchKeyword || undefined,
          status: statusFilter,
        }
      : undefined
  );
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
          date_of_birth: lead.date_of_birth ? dayjs(lead.date_of_birth) : undefined,
          place_of_birth: (lead.place_of_birth ?? undefined) as LocationValue | undefined,
          place_of_origin: (lead.place_of_origin ?? undefined) as LocationValue | undefined,
          current_address: lead.current_address || undefined,
          citizen_id: lead.citizen_id || undefined,
          nationality: lead.nationality || undefined,
          ethnicity: lead.ethnicity || undefined,
          source: lead.source || undefined,
          status: lead.status || undefined,
          note: lead.note || undefined,
        });
      } else {
        setEditingLead(null);
        form.resetFields();
      }
      setIsModalOpen(true);
    },
    [form]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingLead(null);
    form.resetFields();
  }, [form]);

  const handleSubmit = useCallback(
    (values: LeadFormValues) => {
      const payloadBase = {
        full_name: values.full_name,
        email: values.email,
        phone_number: values.phone_number,
        date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : undefined,
        place_of_birth: (values.place_of_birth),
        place_of_origin: (values.place_of_origin),
        current_address: values.current_address,
        citizen_id: values.citizen_id,
        nationality: values.nationality,
        ethnicity: values.ethnicity,
        source: values.source,
        status: values.status,
        note: values.note,
      };
      const onError = (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : LeadPageText.ERROR_GENERIC;
        message.error(errorMessage);
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
            onError,
          }
        );
      } else {
        const payload: CreateLeadInput = payloadBase as CreateLeadInput;
        createLeadMutation.mutate(payload, {
          onSuccess: () => {
            message.success(LeadPageText.SUCCESS_CREATE);
            handleCloseModal();
          },
          onError,
        });
      }
    },
    [editingLead, updateLeadMutation, createLeadMutation, handleCloseModal]
  );

  const handleDelete = useCallback(
    (id: number) => {
      deleteLeadMutation.mutate(id, {
        onSuccess: () => {
          message.success(LeadPageText.SUCCESS_DELETE);
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : LeadPageText.ERROR_GENERIC;
          message.error(errorMessage);
        },
      });
    },
    [deleteLeadMutation]
  );

  const handleRefresh = useCallback(() => {
    refetch()
      .then(() => {
        message.success(LeadPageText.SUCCESS_REFRESH);
      })
      .catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : LeadPageText.ERROR_GENERIC;
        message.error(errorMessage);
      });
  }, [refetch]);

  const columns = useMemo(
    () =>
      getLeadTableColumns({
        handleOpenModal,
        handleDelete,
      }),
    [handleOpenModal, handleDelete]
  );

  const isSubmitting = createLeadMutation.isPending || updateLeadMutation.isPending;
  const filteredLeads = useMemo(() => {
    if (!leads) {
      return [];
    }

    return leads.filter((lead) => {
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const fullNameMatch = lead.full_name.toLowerCase().includes(keyword);
        const emailMatch = (lead.email || '').toLowerCase().includes(keyword);
        const phoneMatch = (lead.phone_number || '').toLowerCase().includes(keyword);

        if (!fullNameMatch && !emailMatch && !phoneMatch) {
          return false;
        }
      }

      if (statusFilter && lead.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [leads, searchKeyword, statusFilter]);

  const handleSubmitAsync = useCallback(
    async (values: LeadFormValues) => {
      handleSubmit(values);
    },
    [handleSubmit]
  );

  return (
    <div
      style={{
        padding: LeadPagePadding.CONTAINER,
      }}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: LeadPageMargin.HEADER_BOTTOM }}>
        <Col>
          <Typography.Title level={1}>{LeadPageText.TITLE}</Typography.Title>
        </Col>
        <Col>
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

      <Row gutter={16} style={{ marginBottom: LeadPageMargin.HEADER_BOTTOM }}>
        <Col xs={24} md={12}>
          <DebouncedInput
            placeholder={`${LeadPageText.COLUMN_FULL_NAME} / ${LeadPageText.COLUMN_EMAIL} / ${LeadPageText.COLUMN_PHONE_NUMBER}`}
            onChange={(value) => setSearchKeyword(value)}
            allowClear
          />
        </Col>
        <Col xs={24} md={4}>
          <Select
            allowClear
            placeholder={LeadPageText.COLUMN_STATUS}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={Object.keys(LeadStatusLabel).map((status) => ({
              label: LeadStatusLabel[status as keyof typeof LeadStatusLabel],
              value: status,
            }))}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Table<Lead>
            columns={columns}
            dataSource={filteredLeads}
            loading={isLoading}
            rowKey="id"
            pagination={false}
            bordered
          />
        </Col>
      </Row>

      <LeadModal
        open={isModalOpen}
        editingLead={editingLead}
        form={form}
        isSubmitting={isSubmitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAsync}
      />
    </div>
  );
}
