'use client';

import type { ReactNode } from 'react';
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ClassCapacityInfo } from './class-list.utils';

const { Text } = Typography;

export function ClassCapacityTag({ capacity }: { capacity: ClassCapacityInfo }) {
  if (capacity.capacity == null && capacity.enrolled === 0) {
    return <Text type="secondary">—</Text>;
  }

  const tag = (
    <Tag color={capacity.tagColor} className="class-capacity-tag">
      {capacity.label}
    </Tag>
  );
  if (!capacity.tooltip) return tag;
  return <Tooltip title={capacity.tooltip}>{tag}</Tooltip>;
}

export function ClassStatusTag({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return <Tag color={color}>{label}</Tag>;
}

type ClassDeleteControlProps = {
  classId: string;
  canDelete: boolean;
  deleteBlockedReason?: string | null;
  onDelete: (id: string) => void;
  trigger: ReactNode;
};

export function ClassDeleteControl({
  classId,
  canDelete,
  deleteBlockedReason,
  onDelete,
  trigger,
}: ClassDeleteControlProps) {
  if (canDelete) {
    return (
      <Popconfirm
        title="Xóa lớp học"
        description="Bạn có chắc chắn muốn xóa lớp học này không?"
        onConfirm={() => onDelete(classId)}
        okText="Xóa"
        cancelText="Hủy"
      >
        {trigger}
      </Popconfirm>
    );
  }

  if (deleteBlockedReason) {
    return <Tooltip title={deleteBlockedReason}>{trigger}</Tooltip>;
  }

  return null;
}

type ClassRowActionsProps = {
  classId: string;
  canDelete: boolean;
  deleteBlockedReason?: string | null;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ClassRowActions({
  classId,
  canDelete,
  deleteBlockedReason,
  onView,
  onDelete,
}: ClassRowActionsProps) {
  const deleteTrigger = (
    <Button
      type="link"
      danger
      icon={<DeleteOutlined />}
      disabled={!canDelete}
      title={deleteBlockedReason ?? 'Xóa'}
    />
  );

  return (
    <Space>
      <Button
        type="link"
        icon={<EyeOutlined />}
        title="Xem chi tiết"
        onClick={() => onView(classId)}
      />
      <ClassDeleteControl
        classId={classId}
        canDelete={canDelete}
        deleteBlockedReason={deleteBlockedReason}
        onDelete={onDelete}
        trigger={deleteTrigger}
      />
    </Space>
  );
}
