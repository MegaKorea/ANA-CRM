'use client';

import { useState } from 'react';
import { Select } from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import { useLeads } from '@/lib/hooks/use-leads';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

interface LeadPickerProps {
  onSelect: (lead: Lead) => void;
  style?: React.CSSProperties;
}

export function LeadPicker({ onSelect, style }: LeadPickerProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, isFetching } = useLeads({ search: debouncedSearch || undefined, limit: 20 });

  return (
    <Select
      showSearch
      style={style ?? { width: 320 }}
      placeholder="Tìm học viên theo tên hoặc SĐT"
      filterOption={false}
      loading={isFetching}
      onSearch={setSearch}
      notFoundContent={debouncedSearch ? 'Không tìm thấy' : null}
      onSelect={(_, option) => onSelect((option as { lead: Lead }).lead)}
      options={(data?.data ?? []).map((lead) => ({
        value: lead.id,
        label: `${lead.full_name}${lead.phone_number ? ` — ${lead.phone_number}` : ''}`,
        lead,
      }))}
    />
  );
}
