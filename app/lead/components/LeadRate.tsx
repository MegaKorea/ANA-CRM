'use client';

import { useState } from 'react';
import { App, Rate } from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import { useUpdateLead } from '@/lib/hooks/use-leads';

interface LeadRateProps {
  lead: Lead;
}

/**
 * Inline customer-potential rating (0–5 stars) shown in the lead table. Clicking
 * a star updates the lead immediately via the shared update mutation; clicking
 * the current star clears it back to 0 (not yet rated).
 *
 * Local state gives instant feedback: the stars reflect the click right away
 * rather than snapping back to the old value while the list refetches. The
 * server value is synced during render (React's derived-state pattern) so an
 * update elsewhere still reflects here, and errors revert the optimistic value.
 */
export function LeadRate({ lead }: LeadRateProps) {
  const { message } = App.useApp();
  const updateLead = useUpdateLead();

  const serverValue = lead.rate ?? 0;
  const [value, setValue] = useState(serverValue);
  const [syncedValue, setSyncedValue] = useState(serverValue);

  // Adjust state during render when the server value changes (no effect needed).
  if (serverValue !== syncedValue) {
    setSyncedValue(serverValue);
    setValue(serverValue);
  }

  const handleChange = (next: number) => {
    const previous = value;
    setValue(next); // optimistic
    updateLead.mutate(
      { id: lead.id, input: { rate: next } },
      {
        // No success toast — silent inline update. Errors still surface so a
        // failed save (which reverts the stars) is not confusing.
        onError: () => {
          setValue(previous); // revert
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
