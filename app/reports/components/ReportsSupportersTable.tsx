'use client';

import { Alert, Card, Empty, Image, Pagination, Skeleton, Typography } from 'antd';
import { memo, useMemo, useState, type ReactNode } from 'react';
import logoAna from '@/app/assets/logo/logo-ana.png';
import type { SmaxSupporterRow } from '@/lib/smax/types';
import styles from './ReportsSupportersTable.module.css';

const { Title, Text } = Typography;

const PAGE_SIZE = 4;
const AVATAR_SIZE = 32;
const REPLY_GOOD_MAX_SEC = 300;
const REPLY_OK_MAX_SEC = 1800;
const ANA_LOGO_SRC = typeof logoAna === 'string' ? logoAna : logoAna.src;

const COPY = {
  title: 'Hiệu suất nhân viên',
  hint: 'SMAX · theo kỳ đã chọn',
  colStaff: 'Nhân viên',
  colMessages: 'Tin nhắn',
  colConversations: 'Hội thoại',
  colReply: 'Phản hồi',
  errorTitle: 'Không tải được thống kê nhân viên',
  errorFallback: 'Vui lòng thử lại sau.',
  empty: 'Không có dữ liệu nhân viên trong kỳ',
  previewMask: 'Xem',
  dash: '—',
} as const;

type Props = {
  rows: SmaxSupporterRow[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
};

function formatReplyTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return COPY.dash;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return secs > 0 ? `${mins}p ${secs}s` : `${mins}p`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}g ${remMins}p` : `${hours}g`;
}

function replyToneClass(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return styles.replyMuted;
  if (seconds <= REPLY_GOOD_MAX_SEC) return styles.replyGood;
  if (seconds <= REPLY_OK_MAX_SEC) return styles.replyOk;
  return styles.replySlow;
}

function StaffAvatar({ row }: { row: SmaxSupporterRow }): ReactNode {
  const isLogoFallback = !row.avatar;
  return (
    <Image
      src={row.avatar || ANA_LOGO_SRC}
      alt={row.name}
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      className={`${styles.avatar} ${isLogoFallback ? styles.avatarLogo : ''}`}
      preview={{ mask: COPY.previewMask }}
    />
  );
}

function StaffRow({ row, rank }: { row: SmaxSupporterRow; rank: number }): ReactNode {
  return (
    <div className={styles.row}>
      <span className={styles.rank}>{rank}</span>
      <StaffAvatar row={row} />
      <div className={styles.staff} title={row.id}>
        <Text className={styles.staffName} ellipsis>
          {row.name}
        </Text>
        <Text type="secondary" className={styles.staffId} ellipsis>
          {row.id}
        </Text>
      </div>
      <span className={styles.metricValue} data-metric="messages">
        {row.messages.toLocaleString('vi-VN')}
      </span>
      <span className={styles.metricValue} data-metric="conversations">
        {row.conversations.toLocaleString('vi-VN')}
      </span>
      <span
        className={`${styles.metricValue} ${replyToneClass(row.replyTimeSec)}`}
        data-metric="reply"
      >
        {formatReplyTime(row.replyTimeSec)}
      </span>
    </div>
  );
}

function EmptyStaffRow(): ReactNode {
  return (
    <div className={`${styles.row} ${styles.rowEmpty}`} aria-hidden>
      <span className={styles.rank}>0</span>
      <Image
        src={ANA_LOGO_SRC}
        alt=""
        width={AVATAR_SIZE}
        height={AVATAR_SIZE}
        className={`${styles.avatar} ${styles.avatarLogo}`}
        preview={false}
      />
      <div className={styles.staff}>
        <Text className={styles.staffName}>{COPY.dash}</Text>
        <Text type="secondary" className={styles.staffId}>
          {COPY.dash}
        </Text>
      </div>
      <span className={styles.metricValue} data-metric="messages">
        0
      </span>
      <span className={styles.metricValue} data-metric="conversations">
        0
      </span>
      <span className={styles.metricValue} data-metric="reply">
        {COPY.dash}
      </span>
    </div>
  );
}

export const ReportsSupportersTable = memo(function ReportsSupportersTable({
  rows,
  isLoading,
  isError = false,
  errorMessage,
}: Props) {
  const [page, setPage] = useState(1);
  const [prevRows, setPrevRows] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  const emptySlotCount = rows.length > PAGE_SIZE ? PAGE_SIZE - pageRows.length : 0;

  let body: ReactNode;
  if (isLoading) {
    body = <Skeleton active avatar paragraph={{ rows: 2 }} />;
  } else if (isError) {
    body = (
      <Alert
        type="error"
        showIcon
        message={COPY.errorTitle}
        description={errorMessage || COPY.errorFallback}
      />
    );
  } else if (rows.length === 0) {
    body = <Empty description={COPY.empty} />;
  } else {
    body = (
      <>
        <div className={styles.table}>
          <div className={styles.colHead}>
            <span className={styles.headSpacer} />
            <span className={styles.headSpacer} />
            <span className={styles.headStaff}>{COPY.colStaff}</span>
            <span className={styles.headMetric}>{COPY.colMessages}</span>
            <span className={styles.headMetric}>{COPY.colConversations}</span>
            <span className={styles.headMetric}>{COPY.colReply}</span>
          </div>
          <div className={styles.list}>
            {pageRows.map((row, index) => (
              <StaffRow
                key={row.id}
                row={row}
                rank={(currentPage - 1) * PAGE_SIZE + index + 1}
              />
            ))}
            {Array.from({ length: emptySlotCount }, (_, index) => (
              <EmptyStaffRow key={`empty-${index}`} />
            ))}
          </div>
        </div>
        {rows.length > PAGE_SIZE ? (
          <div className={styles.pager}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={rows.length}
              onChange={setPage}
              size="small"
              showSizeChanger={false}
            />
          </div>
        ) : null}
      </>
    );
  }

  return (
    <Card className={styles.card} styles={{ body: { padding: 0, height: '100%' } }}>
      <div className={styles.body}>
        <div className={styles.header}>
          <Title level={5} className={styles.title}>
            {COPY.title}
          </Title>
          <Text type="secondary" className={styles.hint}>
            {COPY.hint}
          </Text>
        </div>
        <div className={styles.content}>{body}</div>
      </div>
    </Card>
  );
});
