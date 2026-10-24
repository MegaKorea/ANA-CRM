'use client';

import { useState } from 'react';
import { App, Select, Tag } from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import type { Course } from '@/lib/services/course.service';
import { useInlineUpdateLead } from '@/lib/hooks/use-leads';
import { LeadStatus } from '@/constants/enums';
import { LeadStatusLabel } from '@/app/lead/constants/labels';
import { getLeadStatusColor } from '@/app/lead/constants/lead-helpers';
import { toSentenceCase } from '@/lib/utils/text-case';
import styles from './LeadInlineSelects.module.scss';

function StatusTag({ status }: { status: string }) {
  return (
    <Tag color={getLeadStatusColor(status)} style={{ marginInlineEnd: 0 }}>
      {toSentenceCase(LeadStatusLabel[status as keyof typeof LeadStatusLabel] ?? status)}
    </Tag>
  );
}

const STATUS_OPTIONS = Object.values(LeadStatus).map((status) => ({
  value: status,
  label: <StatusTag status={status} />,
}));

/** Status cell: saves as soon as an option is picked (optimistic). */
export function LeadStatusSelect({ lead }: { lead: Lead }) {
  const { message } = App.useApp();
  const updateLead = useInlineUpdateLead();

  const handleChange = (status: LeadStatus) => {
    if (status === lead.status) return;
    updateLead.mutate(
      { id: lead.id, input: { status } },
      { onError: () => message.error('Cập nhật trạng thái thất bại') },
    );
  };

  return (
    <Select<LeadStatus>
      size="small"
      variant="borderless"
      className={styles.select}
      value={(lead.status as LeadStatus) ?? undefined}
      placeholder="Chọn"
      options={STATUS_OPTIONS}
      onChange={handleChange}
      popupMatchSelectWidth={false}
    />
  );
}

/**
 * Course cell: picks are kept as a local draft while the dropdown is open and
 * saved once it closes, so ticking several courses is a single request and
 * the row never flickers between intermediate states.
 */
export function LeadCourseSelect({ lead, courses }: { lead: Lead; courses?: Course[] | null }) {
  const { message } = App.useApp();
  const updateLead = useInlineUpdateLead();
  const [draft, setDraft] = useState<string[] | null>(null);

  const saved = lead.course_ids ?? [];
  const value = draft ?? saved;

  const [open, setOpen] = useState(false);

  const commit = (next: string[] | null) => {
    if (next == null) return;
    setDraft(null);
    const unchanged = next.length === saved.length && next.every((id) => saved.includes(id));
    if (unchanged) return;
    updateLead.mutate(
      { id: lead.id, input: { course_ids: next } },
      { onError: () => message.error('Cập nhật khóa học thất bại') },
    );
  };

  return (
    <Select<string[]>
      mode="multiple"
      size="small"
      variant="borderless"
      className={`${styles.select} ${styles.courses}`}
      value={value}
      placeholder="Chọn khóa học"
      options={courses?.map((course) => ({ label: course.name, value: course.id }))}
      open={open}
      // Removing a tag with its × while closed saves straight away.
      onChange={(next) => (open ? setDraft(next) : commit(next))}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) commit(draft);
      }}
      maxTagCount="responsive"
      showSearch={{ optionFilterProp: 'label' }}
      popupMatchSelectWidth={false}
    />
  );
}
