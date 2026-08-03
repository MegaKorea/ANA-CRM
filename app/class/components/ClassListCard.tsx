'use client';

import type { ReactNode } from 'react';
import { Card, Flex, Tooltip, Typography } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ClassListRowModel } from './class-list.utils';
import { ClassCapacityTag, ClassDeleteControl, ClassStatusTag } from './ClassListCells';
import styles from '../page.module.scss';

const { Text } = Typography;

type Props = {
  row: ClassListRowModel;
  canDelete: boolean;
  deleteBlockedReason?: string | null;
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

export function ClassListCard({
  row,
  canDelete,
  deleteBlockedReason,
  onView,
  onDelete,
}: Props) {
  const deleteTrigger = (
    <button
      type="button"
      className={`${styles.classCardAction} ${styles.classCardActionDanger}`}
      aria-label={deleteBlockedReason ?? 'Xóa'}
      disabled={!canDelete}
    >
      <DeleteOutlined />
    </button>
  );

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

  if (canDelete || deleteBlockedReason) {
    actions.push(
      <ClassDeleteControl
        key="delete"
        classId={row.id}
        canDelete={canDelete}
        deleteBlockedReason={deleteBlockedReason}
        onDelete={onDelete}
        trigger={
          canDelete ? (
            <Tooltip title="Xóa">{deleteTrigger}</Tooltip>
          ) : (
            deleteTrigger
          )
        }
      />,
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
