'use client';

import type { ReactNode } from 'react';
import { Card, Flex, Popconfirm, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ClassListRowModel } from './class-list.utils';
import { ClassCapacityTag, ClassStatusTag } from './ClassListCells';
import styles from '../page.module.scss';

const { Text } = Typography;

type Props = {
  row: ClassListRowModel;
  canDelete: boolean;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
};

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Flex justify="space-between" align="center" className={styles.classCardMetaRow}>
      <Text type="secondary">{label}</Text>
      <div className={styles.classCardMetaValue}>{children}</div>
    </Flex>
  );
}

export function ClassListCard({ row, canDelete, onView, onDelete }: Props) {
  const actions = [
    <Tooltip key="detail" title="Xem chi tiết">
      <button
        type="button"
        className={styles.classCardAction}
        onClick={() => onView(row.id)}
        aria-label="Xem chi tiết"
      >
        <EyeOutlined />
      </button>
    </Tooltip>,
  ];

  if (canDelete) {
    actions.push(
      <Popconfirm
        key="delete"
        title="Xóa lớp học"
        description="Bạn có chắc chắn muốn xóa lớp học này không?"
        onConfirm={() => onDelete(row.id)}
        okText="Xóa"
        cancelText="Hủy"
      >
        <Tooltip title="Xóa">
          <button
            type="button"
            className={`${styles.classCardAction} ${styles.classCardActionDanger}`}
            aria-label="Xóa"
          >
            <DeleteOutlined />
          </button>
        </Tooltip>
      </Popconfirm>,
    );
  }

  return (
    <Card
      size="small"
      className={styles.classCard}
      title={<Text strong className={styles.classCardTitle}>{row.name}</Text>}
      extra={<ClassStatusTag label={row.status.label} color={row.status.color} />}
      styles={{ body: { padding: 12 } }}
      actions={actions}
    >
      <Flex vertical gap="small">
        <MetaRow label="Mã lớp">
          <Text strong>{row.code}</Text>
        </MetaRow>
        <MetaRow label="Khóa học">
          <Text>{row.courseLabel}</Text>
        </MetaRow>
        <MetaRow label="Sĩ số">
          <ClassCapacityTag capacity={row.capacity} />
        </MetaRow>
        <MetaRow label="Lịch mở lớp">
          <Text>{row.scheduleLabel}</Text>
        </MetaRow>
      </Flex>
    </Card>
  );
}
