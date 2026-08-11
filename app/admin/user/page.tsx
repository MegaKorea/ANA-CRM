'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  App,
  Table,
  Button,
  Space,
  Row,
  Col,
  Form,
  Typography,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { User } from '@/lib/services/user.service';
import type { CreateUserInput, UpdateUserInput } from '@/lib/validators/user.validator';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/lib/hooks/use-users';
import { useRoles } from '@/lib/hooks/use-roles';
import {
  UserPageGap,
  UserPageMargin,
  UserPageText,
  getUserTableColumns,
} from '@/app/admin/user/constants';
import type { UserFormValues } from '@/app/admin/user/components/UserModal';
import { UserFilterBar } from '@/app/admin/user/components/UserFilterBar';
import { filterUsers } from './user-filter.utils';
import { DateFormat } from '@/constants/enums';
import dynamic from 'next/dynamic';

const UserModal = dynamic(
  () => import('@/app/admin/user/components/UserModal').then((m) => m.UserModal),
  { ssr: false },
);

export default function UserPage() {
  const { message } = App.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm<UserFormValues>();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<number | undefined>(undefined);
  const [createdAtRange, setCreatedAtRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const {
    data: users,
    isLoading,
    isFetching,
    refetch,
  } = useUsers(
    searchKeyword
      ? {
          search: searchKeyword,
        }
      : undefined,
  );
  const { data: roles } = useRoles();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const handleOpenModal = useCallback(
    (user?: User) => {
      if (user) {
        setEditingUser(user);
        form.setFieldsValue({
          full_name: user.full_name,
          email: user.email || undefined,
          phone: user.phone || undefined,
          role_id: user.role_id,
          sex: user.sex || undefined,
          age: user.age ?? undefined,
          address: user.address || undefined,
          birth_day: user.birth_day ? dayjs(user.birth_day) : undefined,
        });
      } else {
        setEditingUser(null);
        form.resetFields();
      }
      setIsModalOpen(true);
    },
    [form],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  }, [form]);

  const handleSubmit = useCallback(
    (values: UserFormValues) => {
      const payloadBase = {
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        role_id: values.role_id,
        sex: values.sex,
        age: values.age,
        address: values.address,
        birth_day: values.birth_day ? values.birth_day.format(DateFormat.ISO_DATE) : undefined,
      };
      const onError = (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : UserPageText.ERROR_GENERIC;
        message.error(errorMessage);
      };

      if (editingUser) {
        const payload: UpdateUserInput = payloadBase;
        updateUserMutation.mutate(
          {
            id: editingUser.id,
            input: payload,
          },
          {
            onSuccess: () => {
              message.success(UserPageText.SUCCESS_UPDATE);
              handleCloseModal();
            },
            onError,
          },
        );
      } else {
        const payload: CreateUserInput = payloadBase as CreateUserInput;
        createUserMutation.mutate(payload, {
          onSuccess: () => {
            message.success(UserPageText.SUCCESS_CREATE);
            handleCloseModal();
          },
          onError,
        });
      }
    },
    [editingUser, updateUserMutation, createUserMutation, handleCloseModal, message],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteUserMutation.mutate(id, {
        onSuccess: () => {
          message.success(UserPageText.SUCCESS_DELETE);
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : UserPageText.ERROR_GENERIC;
          message.error(errorMessage);
        },
      });
    },
    [deleteUserMutation, message],
  );

  const handleRefresh = useCallback(() => {
    refetch()
      .then(() => {
        message.success(UserPageText.SUCCESS_REFRESH);
      })
      .catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : UserPageText.ERROR_GENERIC;
        message.error(errorMessage);
      });
  }, [message, refetch]);

  const columns = useMemo(
    () =>
      getUserTableColumns({
        roles,
        handleOpenModal,
        handleDelete,
      }).map((col: any) => ({
        ...col,
        onCell: () =>
          ({
            'data-label': typeof col.title === 'string' ? col.title : '',
          }) as any,
      })),
    [roles, handleOpenModal, handleDelete],
  );

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;
  const filteredUsers = useMemo(
    () => filterUsers(users, { searchKeyword, statusFilter, roleFilter, createdAtRange }),
    [users, searchKeyword, statusFilter, roleFilter, createdAtRange],
  );

  const handleSubmitAsync = useCallback(
    async (values: UserFormValues) => {
      handleSubmit(values);
    },
    [handleSubmit],
  );

  return (
    <div>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: UserPageMargin.HEADER_BOTTOM }}
      >
        <Col>
          <Typography.Title level={1}>{UserPageText.TITLE}</Typography.Title>
        </Col>
        <Col>
          <Space size={UserPageGap.ACTIONS}>
            <Button icon={<ReloadOutlined />} loading={isFetching} onClick={handleRefresh}>
              {UserPageText.BUTTON_REFRESH}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              {UserPageText.BUTTON_CREATE}
            </Button>
          </Space>
        </Col>
      </Row>

      <UserFilterBar
        roles={roles}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        createdAtRange={createdAtRange}
        onCreatedAtRangeChange={setCreatedAtRange}
        onSearchChange={setSearchKeyword}
      />
      <Row>
        <Col span={24}>
          <Table<User>
            className="mobile-card-table"
            columns={columns}
            dataSource={filteredUsers}
            loading={isLoading}
            rowKey="id"
            pagination={false}
            bordered
          />
        </Col>
      </Row>

      <UserModal
        open={isModalOpen}
        editingUser={editingUser}
        form={form}
        isSubmitting={isSubmitting}
        roles={roles}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAsync}
      />
    </div>
  );
}
