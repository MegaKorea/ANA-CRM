'use client';

import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ClassCapacityInfo } from './class-list.utils';

const { Text } = Typography;

export function ClassCapacityTag({ capacity }: { capacity: ClassCapacityInfo }) {
  if (!capacity.capacity) {
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

type ClassRowActionsProps = {
  classId: string;
  canDelete: boolean;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ClassRowActions({
  classId,
  canDelete,
  onView,
  onDelete,
}: ClassRowActionsProps) {
  return (
    <Space>
      <Button
        type="link"
        icon={<EyeOutlined />}
        title="Xem chi tiết"
        onClick={() => onView(classId)}
      />
      {canDelete ? (
        <Popconfirm
          title="Xóa lớp học"
          description="Bạn có chắc chắn muốn xóa lớp học này không?"
          onConfirm={() => onDelete(classId)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="link" danger icon={<DeleteOutlined />} title="Xóa" />
        </Popconfirm>
      ) : null}
    </Space>
  );
}
