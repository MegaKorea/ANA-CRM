'use client';

import { useState } from 'react';
import { App, Select } from 'antd';
import { LuCheck, LuChevronDown } from 'react-icons/lu';
import type { Lead } from '@/lib/services/lead.service';
import type { Course } from '@/lib/services/course.service';
import { useInlineUpdateLead } from '@/lib/hooks/use-leads';
import { LeadStatus } from '@/constants/enums';
import { LeadStatusLabel } from '@/app/lead/constants/labels';
import { getLeadStatusColor } from '@/app/lead/constants/lead-helpers';
import { toSentenceCase } from '@/lib/utils/text-case';
import styles from './LeadInlineSelects.module.scss';

// Dot colours for the antd preset names used by LEAD_STATUS_COLORS.
const STATUS_DOT_COLOR: Record<string, string> = {
  default: '#9ca3af',
  purple: '#8b5cf6',
  magenta: '#db2777',
  volcano: '#ea580c',
  orange: '#f59e0b',
  green: '#16a34a',
  red: '#dc2626',
  gold: '#ca8a04',
};

function StatusLabel({ status }: { status: string }) {
  return (
    <span className={styles.status}>
      <span
        className={styles.dot}
        style={{ background: STATUS_DOT_COLOR[getLeadStatusColor(status)] ?? STATUS_DOT_COLOR.default }}
      />
      {toSentenceCase(LeadStatusLabel[status as keyof typeof LeadStatusLabel] ?? status)}
    </span>
  );
}

const STATUS_OPTIONS = Object.values(LeadStatus).map((status) => ({
  value: status,
  label: <StatusLabel status={status} />,
}));

const sharedSelectProps = {
  size: 'small' as const,
  variant: 'borderless' as const,
  suffixIcon: <LuChevronDown />,
  popupMatchSelectWidth: false,
  classNames: { popup: { root: styles.popup } },
};

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
      {...sharedSelectProps}
      className={styles.select}
      value={(lead.status as LeadStatus) ?? undefined}
      placeholder="—"
      options={STATUS_OPTIONS}
      onChange={handleChange}
      optionRender={(option) => (
        <span className={styles.option}>
          {option.label}
          {option.value === lead.status && <LuCheck className={styles.check} />}
        </span>
      )}
    />
  );
}

/**
 * Course cell: shown as plain comma-separated names. Picks are kept as a
 * local draft while the dropdown is open and saved once it closes, so ticking
 * several courses is a single request and the row never flickers.
 */
export function LeadCourseSelect({ lead, courses }: { lead: Lead; courses?: Course[] | null }) {
  const { message } = App.useApp();
  const updateLead = useInlineUpdateLead();
  const [draft, setDraft] = useState<string[] | null>(null);

  const saved = lead.course_ids ?? [];
  const value = draft ?? saved;

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
      {...sharedSelectProps}
      mode="multiple"
      className={`${styles.select} ${styles.courses}`}
      value={value}
      placeholder="—"
      options={courses?.map((course) => ({ label: course.name, value: course.id }))}
      onChange={setDraft}
      onOpenChange={(open) => {
        if (!open) commit(draft);
      }}
      tagRender={({ label }) => <span className={styles.courseName}>{label}</span>}
      menuItemSelectedIcon={<LuCheck className={styles.check} />}
      showSearch={{ optionFilterProp: 'label' }}
    />
  );
}
