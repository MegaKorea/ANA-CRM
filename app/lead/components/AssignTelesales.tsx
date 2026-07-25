import React from 'react';
import { App, Select } from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import { useUsers } from '@/lib/hooks/use-users';
import { useAssignTelesales } from '@/lib/hooks/use-leads';

interface AssignTelesalesProps {
  lead: Lead;
}

export function AssignTelesales({ lead }: AssignTelesalesProps) {
  const { message } = App.useApp();
  const { data: users, isLoading } = useUsers({ roleCode: 'TELESALES' });
  const assignTelesalesMutation = useAssignTelesales();

  const handleChange = (value: string | undefined) => {
    assignTelesalesMutation.mutate(
      { leadId: lead.id, telesales_id: value || null },
      {
        onSuccess: () => {
          message.success('Cập nhật telesales thành công');
        },
        onError: () => {
          message.error('Cập nhật telesales thất bại');
        },
      }
    );
  };

  return (
    <Select
      allowClear
      loading={isLoading || assignTelesalesMutation.isPending}
      disabled={assignTelesalesMutation.isPending}
      value={lead.telesales_id}
      onChange={handleChange}
      placeholder="Chọn Telesales"
      style={{ width: 150 }}
      options={
        users?.map((user) => ({
          label: user.full_name || user.email,
          value: user.id,
        })) || []
      }
    />
  );
}
