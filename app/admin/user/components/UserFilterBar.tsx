import { Col, DatePicker, Row, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { DebouncedInput } from '@/components/common/DebouncedInput';
import type { Role } from '@/lib/services/role.service';
import { UserPageMargin, UserPageText, UserStatusLabel } from '@/app/admin/user/constants';

type Props = {
  roles?: Role[];
  statusFilter: string | undefined;
  onStatusChange: (value: string | undefined) => void;
  roleFilter: number | undefined;
  onRoleChange: (value: number | undefined) => void;
  createdAtRange: [Dayjs, Dayjs] | null;
  onCreatedAtRangeChange: (value: [Dayjs, Dayjs] | null) => void;
  onSearchChange: (value: string) => void;
};

export function UserFilterBar({
  roles,
  statusFilter,
  onStatusChange,
  roleFilter,
  onRoleChange,
  createdAtRange,
  onCreatedAtRangeChange,
  onSearchChange,
}: Props) {
  return (
    <Row gutter={16} style={{ marginBottom: UserPageMargin.HEADER_BOTTOM }}>
      <Col xs={24} md={10}>
        <DebouncedInput
          placeholder={`${UserPageText.FIELD_FULL_NAME_PLACEHOLDER} / ${UserPageText.FIELD_EMAIL_PLACEHOLDER}`}
          onChange={onSearchChange}
          allowClear
        />
      </Col>
      <Col xs={24} md={4}>
        <Select
          allowClear
          placeholder={UserPageText.COLUMN_STATUS}
          value={statusFilter}
          onChange={onStatusChange}
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
          onChange={onRoleChange}
          options={
            roles?.map((role) => ({
              label: role.name,
              value: role.id,
            })) || []
          }
          style={{ width: '100%' }}
        />
      </Col>
      <Col xs={24} md={6}>
        <DatePicker.RangePicker
          style={{ width: '100%' }}
          value={createdAtRange || undefined}
          onChange={(values) => {
            if (!values || values.length !== 2 || !values[0] || !values[1]) {
              onCreatedAtRangeChange(null);
              return;
            }
            onCreatedAtRangeChange([values[0], values[1]]);
          }}
        />
      </Col>
    </Row>
  );
}
