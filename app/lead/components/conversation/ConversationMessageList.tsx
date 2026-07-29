'use client';

import { useEffect, useRef } from 'react';
import { Empty, Skeleton, Result } from 'antd';
import type { SmaxChatMessage } from '@/lib/smax/types';
import { ConversationMessageItem } from './ConversationMessageItem';
import styles from '../ConversationModal.module.scss';

interface ConversationMessageListProps {
  messages: SmaxChatMessage[];
  loading: boolean;
  error?: boolean;
}

type ChatRow =
  | { type: 'date'; key: string; label: string }
  | {
      type: 'message';
      key: string;
      message: SmaxChatMessage;
      compact: boolean;
    };

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const today = startOfDay(new Date());
  const day = startOfDay(date);
  const dayMs = 24 * 60 * 60 * 1000;

  if (day === today) return 'Hôm nay';
  if (day === today - dayMs) return 'Hôm qua';

  return date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function dateKey(iso?: string): string {
  if (!iso) return 'unknown';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildChatRows(messages: SmaxChatMessage[]): ChatRow[] {
  const rows: ChatRow[] = [];
  let lastDateKey = '';
  let lastFromPage: boolean | null = null;

  for (const message of messages) {
    const key = dateKey(message.createdAt);
    if (message.createdAt && key !== lastDateKey) {
      const label = formatDateLabel(message.createdAt);
      if (label) {
        rows.push({ type: 'date', key: `date-${key}`, label });
      }
      lastDateKey = key;
      lastFromPage = null;
    }

    rows.push({
      type: 'message',
      key: message.id,
      message,
      compact: lastFromPage !== null && lastFromPage === message.isFromPage,
    });
    lastFromPage = message.isFromPage;
  }

  return rows;
}

export function ConversationMessageList({
  messages,
  loading,
  error,
}: ConversationMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (loading || error || !lastMessageId) return;
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [loading, error, lastMessageId, messages.length]);

  if (loading) {
    return (
      <div className={styles.loadingSkeleton}>
        <Skeleton avatar active paragraph={{ rows: 1 }} />
        <div className={styles.loadingSkeletonPage}>
          <Skeleton
            avatar
            active
            paragraph={{ rows: 2 }}
            style={{ width: '60%' }}
          />
        </div>
        <Skeleton avatar active paragraph={{ rows: 1 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <Result
          status="error"
          title="Không tải được hội thoại"
          subTitle="Thử đóng và mở lại, hoặc kiểm tra kết nối Smax."
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Empty
          description="Chưa có tin nhắn trong hội thoại này"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  const rows = buildChatRows(messages);

  return (
    <div ref={listRef} className={styles.messagesList}>
      {rows.map((row) => {
        if (row.type === 'date') {
          return (
            <div key={row.key} className={styles.dateDivider}>
              <span className={styles.dateChip}>{row.label}</span>
            </div>
          );
        }

        return (
          <ConversationMessageItem
            key={row.key}
            message={row.message}
            compact={row.compact}
          />
        );
      })}
    </div>
  );
}
