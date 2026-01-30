'use client';

import { useState, useMemo, useCallback } from 'react';
import { Table, Button, Form, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/lib/hooks/use-roles';
import type { Role } from '@/lib/services/role.service';
import { createRoleColumns } from './constants';
import { RoleModal } from './components';

interface RoleFormValues {
  name: string;
  code: string;
  description?: string;
}

export default function RolePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm<RoleFormValues>();

  const { data: roles, isLoading, isFetching, refetch } = useRoles();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  const handleOpenModal = useCallback((role?: Role) => {
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
  }, [form]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingRole(null);
    form.resetFields();
  }, [form]);

  const handleSubmit = useCallback(async (values: RoleFormValues) => {
    try {
      if (editingRole) {
        await updateRoleMutation.mutateAsync({
          id: editingRole.id,
          input: values,
        });
        message.success('Cập nhật vai trò thành công');
      } else {
        await createRoleMutation.mutateAsync(values);
        message.success('Tạo vai trò thành công');
      }
      handleCloseModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      message.error(errorMessage);
    }
  }, [editingRole, updateRoleMutation, createRoleMutation, handleCloseModal]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteRoleMutation.mutateAsync(id);
      message.success('Xóa vai trò thành công');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      message.error(errorMessage);
    }
  }, [deleteRoleMutation]);

  const columns = useMemo(
    () => createRoleColumns(handleOpenModal, handleDelete),
    [handleOpenModal, handleDelete]
  );

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      message.success('Đã làm mới danh sách vai trò');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      message.error(errorMessage);
    }
  }, [refetch]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>QUẢN LÝ VAI TRÒ</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<ReloadOutlined />}
            loading={isFetching}
            onClick={handleRefresh}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Thêm vai trò
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={roles}
        loading={isLoading}
        rowKey="id"
        pagination={false}
        bordered
      />

      <RoleModal
        open={isModalOpen}
        editingRole={editingRole}
        form={form}
        isLoading={createRoleMutation.isPending || updateRoleMutation.isPending}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
