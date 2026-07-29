'use client';

import { useState, useMemo, useCallback } from 'react';
import { App, Table, Button, Space, Row, Col, Typography, Form } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/lib/hooks/use-roles';
import type { Role } from '@/lib/services/role.service';
import type { CreateRoleInput, UpdateRoleInput } from '@/lib/services/role.service';
import {
  RolePageGap,
  RolePageMargin,
  RolePagePadding,
  RolePageText,
  createRoleColumns,
} from './constants';
import type { RoleFormValues } from './components/RoleModal';
import dynamic from 'next/dynamic';

const RoleModal = dynamic(() => import('./components/RoleModal').then((m) => m.RoleModal), {
  ssr: false,
});

export default function RolePage() {
  const { message } = App.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm<RoleFormValues>();

  const { data: roles, isLoading, isFetching, refetch } = useRoles();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  const handleOpenModal = useCallback(
    (role?: Role) => {
      if (role) {
        setEditingRole(role);
        form.setFieldsValue({
          name: role.name,
          code: role.code,
          description: role.description || undefined,
        });
      } else {
        setEditingRole(null);
        form.resetFields();
      }
      setIsModalOpen(true);
    },
    [form],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingRole(null);
    form.resetFields();
  }, [form]);

  const handleSubmit = useCallback(
    (values: RoleFormValues) => {
      const onError = (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : RolePageText.ERROR_GENERIC;
        message.error(errorMessage);
      };

      if (editingRole) {
        const payload: UpdateRoleInput = values;
        updateRoleMutation.mutate(
          {
            id: editingRole.id,
            input: payload,
          },
          {
            onSuccess: () => {
              message.success(RolePageText.SUCCESS_UPDATE);
              handleCloseModal();
            },
            onError,
          },
        );
      } else {
        const payload: CreateRoleInput = values;
        createRoleMutation.mutate(payload, {
          onSuccess: () => {
            message.success(RolePageText.SUCCESS_CREATE);
            handleCloseModal();
          },
          onError,
        });
      }
    },
    [editingRole, updateRoleMutation, createRoleMutation, handleCloseModal, message],
  );

  const handleDelete = useCallback(
    (id: number) => {
      deleteRoleMutation.mutate(id, {
        onSuccess: () => {
          message.success(RolePageText.SUCCESS_DELETE);
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : RolePageText.ERROR_GENERIC;
          message.error(errorMessage);
        },
      });
    },
    [deleteRoleMutation, message],
  );

  const columns = useMemo(
    () =>
      createRoleColumns(handleOpenModal, handleDelete).map((col: any) => ({
        ...col,
        onCell: () =>
          ({
            'data-label': typeof col.title === 'string' ? col.title : '',
          }) as any,
      })),
    [handleOpenModal, handleDelete],
  );

  const handleRefresh = useCallback(() => {
    refetch()
      .then(() => {
        message.success(RolePageText.SUCCESS_REFRESH);
      })
      .catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : RolePageText.ERROR_GENERIC;
        message.error(errorMessage);
      });
  }, [refetch, message]);

  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending;

  const handleSubmitAsync = useCallback(
    async (values: RoleFormValues) => {
      handleSubmit(values);
    },
    [handleSubmit],
  );

  return (
    <div
      style={{
        padding: RolePagePadding.CONTAINER,
      }}
    >
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: RolePageMargin.HEADER_BOTTOM }}
      >
        <Col>
          <Typography.Title level={1}>{RolePageText.TITLE}</Typography.Title>
        </Col>
        <Col>
          <Space size={RolePageGap.ACTIONS}>
            <Button icon={<ReloadOutlined />} loading={isFetching} onClick={handleRefresh}>
              {RolePageText.BUTTON_REFRESH}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              {RolePageText.BUTTON_CREATE}
            </Button>
          </Space>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Table<Role>
            className="mobile-card-table"
            columns={columns}
            dataSource={roles}
            loading={isLoading}
            rowKey="id"
            pagination={false}
            bordered
          />
        </Col>
      </Row>

      <RoleModal
        open={isModalOpen}
        editingRole={editingRole}
        form={form}
        isSubmitting={isSubmitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAsync}
      />
    </div>
  );
}
