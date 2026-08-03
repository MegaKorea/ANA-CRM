import { Row, Col, Select, DatePicker, Space } from 'antd';
import { DebouncedInput } from '@/components/common/DebouncedInput';
import { LeadStatus, LeadSource, DateFormat } from '@/constants/enums';
import {
  LeadPageText,
  LeadPageGap,
  LeadDateRangePlaceholder,
  LeadStatusLabel,
  LeadSourceIcon,
  LeadSourceLabel,
} from '@/app/lead/constants';
import type { Dayjs } from 'dayjs';
import { memo } from 'react';

interface LeadFiltersProps {
  onSearch: (value: string) => void;
  statusFilter: LeadStatus | undefined;
  onStatusChange: (status: LeadStatus | undefined) => void;
  sourceFilter: LeadSource | undefined;
  onSourceChange: (source: LeadSource | undefined) => void;
  courseFilter: string | undefined;
  onCourseChange: (course: string | undefined) => void;
  createdAtRange: [Dayjs | null, Dayjs | null] | null;
  onCreatedAtRangeChange: (range: [Dayjs | null, Dayjs | null] | null) => void;
  courses: any[];
}

export const LeadFilters = memo(function LeadFilters({
  onSearch,
  statusFilter,
  onStatusChange,
  sourceFilter,
  onSourceChange,
  courseFilter,
  onCourseChange,
  createdAtRange,
  onCreatedAtRangeChange,
  courses,
}: LeadFiltersProps) {
  return (
    <Row gutter={[16, 16]} className="mb-section">
      <Col xs={24} md={8}>
        <DebouncedInput
          placeholder={`${LeadPageText.COLUMN_FULL_NAME} / ${LeadPageText.COLUMN_EMAIL} / ${LeadPageText.COLUMN_PHONE_NUMBER}`}
          onChange={onSearch}
          allowClear
        />
      </Col>
      <Col xs={24} md={4}>
        <Select
          allowClear
          placeholder={LeadPageText.COLUMN_STATUS}
          value={statusFilter}
          onChange={onStatusChange}
          options={Object.values(LeadStatus).map((status) => ({
            label: LeadStatusLabel[status as keyof typeof LeadStatusLabel],
            value: status,
          }))}
          style={{ width: '100%' }}
        />
      </Col>
      <Col xs={24} md={4}>
        <Select
          allowClear
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
      </Col>
      <Col xs={24} md={4}>
        <Select
          allowClear
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
      </Col>
      <Col xs={24} md={4}>
        <DatePicker.RangePicker
          allowClear
          placeholder={[LeadDateRangePlaceholder[0], LeadDateRangePlaceholder[1]]}
          value={createdAtRange ?? undefined}
          onChange={onCreatedAtRangeChange}
          style={{ width: '100%' }}
          format={DateFormat.ISO_DATE}
        />
      </Col>
    </Row>
  );
});
