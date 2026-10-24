import { Select, DatePicker, Space, Tag, Button } from 'antd';
import {
  LuBookOpen,
  LuCalendar,
  LuPlus,
  LuSearch,
  LuShieldCheck,
  LuUser,
  LuWaypoints,
} from 'react-icons/lu';
import { DebouncedInput } from '@/components/common/DebouncedInput';
import { LeadStatus, LeadSource, DateFormat } from '@/constants/enums';
import {
  LeadPageText,
  LeadPageGap,
  LeadDateRangePlaceholder,
  LeadStatusLabel,
  LeadSourceIcon,
  LeadSourceLabel,
  CARE_MILESTONES,
  type CareMilestone,
} from '@/app/lead/constants';
import type { Dayjs } from 'dayjs';
import { memo } from 'react';
import styles from './LeadFilters.module.scss';

interface LeadFiltersProps {
  searchKey?: number;
  searchDefaultValue?: string;
  onSearch: (value: string) => void;
  statusFilter: LeadStatus | undefined;
  onStatusChange: (status: LeadStatus | undefined) => void;
  sourceFilter: LeadSource | undefined;
  onSourceChange: (source: LeadSource | undefined) => void;
  courseFilter: string | undefined;
  onCourseChange: (course: string | undefined) => void;
  createdAtRange: [Dayjs | null, Dayjs | null] | null;
  onCreatedAtRangeChange: (range: [Dayjs | null, Dayjs | null] | null) => void;
  careMilestone: CareMilestone | undefined;
  onCareMilestoneChange: (milestone: CareMilestone | undefined) => void;
  courses: any[];
  onCreate: () => void;
}

export const LeadFilters = memo(function LeadFilters({
  searchKey = 0,
  searchDefaultValue,
  onSearch,
  statusFilter,
  onStatusChange,
  sourceFilter,
  onSourceChange,
  courseFilter,
  onCourseChange,
  createdAtRange,
  onCreatedAtRangeChange,
  careMilestone,
  onCareMilestoneChange,
  courses,
  onCreate,
}: LeadFiltersProps) {
  return (
    <div className={`${styles.bar} mb-section`}>
      <div className={styles.search}>
        <DebouncedInput
          key={searchKey}
          defaultValue={searchDefaultValue}
          prefix={<LuSearch className={styles.prefix} />}
          placeholder="Tìm kiếm theo tên, SĐT, email..."
          onChange={onSearch}
          allowClear
        />
      </div>
      <div className={styles.field}>
        <Select
          allowClear
          prefix={<LuShieldCheck className={styles.prefix} />}
          placeholder={LeadPageText.COLUMN_STATUS}
          value={statusFilter}
          onChange={onStatusChange}
          options={Object.values(LeadStatus).map((status) => ({
            label: LeadStatusLabel[status as keyof typeof LeadStatusLabel],
            value: status,
          }))}
          style={{ width: '100%' }}
        />
      </div>
      <div className={styles.field}>
        <Select
          allowClear
          prefix={<LuWaypoints className={styles.prefix} />}
          placeholder={LeadPageText.COLUMN_SOURCE}
          value={sourceFilter}
          onChange={onSourceChange}
          options={Object.keys(LeadSourceLabel).map((source) => {
            const sourceKey = source as keyof typeof LeadSourceLabel;
            return {
              label: (
                <Space size={LeadPageGap.ACTIONS}>
                  {LeadSourceIcon[sourceKey]}
                  {LeadSourceLabel[sourceKey]}
                </Space>
              ),
              value: source,
            };
          })}
          style={{ width: '100%' }}
        />
      </div>
      <div className={styles.field}>
        <Select
          allowClear
          prefix={<LuBookOpen className={styles.prefix} />}
          placeholder={LeadPageText.FIELD_COURSE_IDS_PLACEHOLDER}
          value={courseFilter}
          onChange={onCourseChange}
          options={courses?.map((course) => ({
            label: course.name,
            value: course.id,
          }))}
          style={{ width: '100%' }}
          showSearch={{ optionFilterProp: 'label' }}
        />
      </div>
      <div className={styles.field}>
        <DatePicker.RangePicker
          allowClear
          prefix={<LuCalendar className={styles.prefix} />}
          placeholder={[LeadDateRangePlaceholder[0], LeadDateRangePlaceholder[1]]}
          value={createdAtRange ?? undefined}
          onChange={onCreatedAtRangeChange}
          style={{ width: '100%' }}
          format={DateFormat.ISO_DATE}
        />
      </div>
      <div className={styles.field}>
        <Select
          allowClear
          prefix={<LuUser className={styles.prefix} />}
          placeholder="Chăm sóc"
          value={careMilestone}
          onChange={onCareMilestoneChange}
          options={CARE_MILESTONES.map((milestone) => ({
            label: (
              <Tag color={milestone.color} style={{ marginInlineEnd: 0 }}>
                {milestone.label}
              </Tag>
            ),
            value: milestone.value,
          }))}
          style={{ width: '100%' }}
        />
      </div>
      <Button type="primary" icon={<LuPlus />} onClick={onCreate} className={styles.create}>
        Thêm khách hàng
      </Button>
    </div>
  );
});
