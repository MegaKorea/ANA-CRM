'use client';

import { useState } from 'react';
import { App, Rate } from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import { useUpdateLead } from '@/lib/hooks/use-leads';

interface LeadRateProps {
  lead: Lead;
}

export function LeadRate({ lead }: LeadRateProps) {
  const { message } = App.useApp();
  const updateLead = useUpdateLead();

  const serverValue = lead.rate ?? 0;
  const [value, setValue] = useState(serverValue);
  const [syncedValue, setSyncedValue] = useState(serverValue);

  if (serverValue !== syncedValue) {
    setSyncedValue(serverValue);
    setValue(serverValue);
  }

  const handleChange = (next: number) => {
    const previous = value;
    setValue(next); 
    updateLead.mutate(
      { id: lead.id, input: { rate: next } },
      {
        onError: () => {
          setValue(previous); 
          message.error('Cập nhật mức độ tiềm năng thất bại');
        },
      }
    );
  };

  return (
    <Rate
      allowClear
      value={value}
      onChange={handleChange}
      style={{ fontSize: 16, whiteSpace: 'nowrap' }}
    />
  );
}
