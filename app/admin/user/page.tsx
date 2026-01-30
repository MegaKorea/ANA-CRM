
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Table, Button, Space, message, Row, Col, Form, Input, Select, DatePicker } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { User } from '@/lib/services/user.service';
import type { CreateUserInput, UpdateUserInput } from '@/lib/validators/user.validator';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/lib/hooks/use-users';
import { useRoles } from '@/lib/hooks/use-roles';
import { UserPageGap, UserPageMargin, UserPagePadding, UserPageText, UserStatusLabel, getUserTableColumns } from '@/app/admin/user/constants';
import { UserModal, type UserFormValues } from '@/app/admin/user/components/UserModal';
import { DebouncedInput } from '@/components/common/DebouncedInput';

export default function UserPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm<UserFormValues>();

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<number | undefined>(undefined);
  const [createdAtRange, setCreatedAtRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const { data: users, isLoading, isFetching, refetch } = useUsers();
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
    [form]
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
        password: values.password,
        phone: values.phone,
        role_id: values.role_id,
        sex: values.sex,
        age: values.age,
        address: values.address,
        birth_day: values.birth_day ? values.birth_day.format('YYYY-MM-DD') : undefined,
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
          }
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
    [editingUser, updateUserMutation, createUserMutation, handleCloseModal]
  );

  const handleDelete = useCallback(
    (id: number) => {
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
    [deleteUserMutation]
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
  }, [refetch]);

  const columns = useMemo(
    () =>
      getUserTableColumns({
        roles,
        handleOpenModal,
        handleDelete,
      }),
    [roles, handleOpenModal, handleDelete]
  );

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;
  const filteredUsers = useMemo(() => {
    if (!users) {
      return [];
    }

    return users.filter((user) => {
      if (searchName && !user.full_name.toLowerCase().includes(searchName.toLowerCase())) {
        return false;
      }

      if (searchPhone && !(user.phone || '').toLowerCase().includes(searchPhone.toLowerCase())) {
        return false;
      }

      if (statusFilter && user.status !== statusFilter) {
        return false;
      }

      if (roleFilter && user.role_id !== roleFilter) {
        return false;
      }

      if (createdAtRange && user.created_at) {
        const createdAt = dayjs(user.created_at);
        const [start, end] = createdAtRange;
        if (createdAt.isBefore(start, 'day') || createdAt.isAfter(end, 'day')) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchName, searchPhone, statusFilter, roleFilter, createdAtRange]);


  const handleSubmitAsync = useCallback(
    async (values: UserFormValues) => {
      handleSubmit(values);
    },
    [handleSubmit]
  );

  return (
    <div
      style={{
        padding: UserPagePadding.CONTAINER,
      }}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: UserPageMargin.HEADER_BOTTOM }}>
        <Col>
          <h1>{UserPageText.TITLE}</h1>
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

      <Row gutter={16} style={{ marginBottom: UserPageMargin.HEADER_BOTTOM }}>
        <Col xs={24} md={8}>
          <DebouncedInput
            placeholder={UserPageText.FIELD_FULL_NAME_PLACEHOLDER}
            onChange={(value) => setSearchName(value)}
            allowClear
          />
        </Col>
        <Col xs={24} md={4}>
          <Input
            placeholder={UserPageText.FIELD_PHONE_PLACEHOLDER}
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} md={4}>
          <Select
            allowClear
            placeholder={UserPageText.COLUMN_STATUS}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={Object.keys(UserStatusLabel).map((status) => ({
              label: UserStatusLabel[status as keyof typeof UserStatusLabel],
              value: status,
            }))}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={4}>
          <Select
            allowClear
            placeholder={UserPageText.FIELD_ROLE_PLACEHOLDER}
            value={roleFilter}
            onChange={(value) => setRoleFilter(value)}
            options={
              roles?.map((role) => ({
                label: role.name,
                value: role.id,
              })) || []
            }
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={4}>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            value={createdAtRange || undefined}
            onChange={(values) => {
              if (!values || values.length !== 2 || !values[0] || !values[1]) {
                setCreatedAtRange(null);
                return;
              }
              setCreatedAtRange([values[0], values[1]]);
            }}
          />
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Table<User>
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

