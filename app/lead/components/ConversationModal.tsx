'use client';

import { Modal, Skeleton } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { parseSmaxThreadRef } from '@/lib/smax/parse-smax-log';
import { useSmaxMessages } from '@/lib/hooks/use-smax-messages';
import { ConversationMessageList } from './conversation/ConversationMessageList';
import { PreviewableAvatar } from './conversation/PreviewableAvatar';
import type { SmaxChatMessage } from '@/lib/smax/types';
import styles from './ConversationModal.module.scss';

interface ConversationModalProps {
  smaxLog: unknown;
  open: boolean;
  onCancel: () => void;
}

function withThreadMeta(
  messages: SmaxChatMessage[],
  customerName: string,
  customerAvatar?: string
): SmaxChatMessage[] {
  return messages.map((msg) => {
    if (msg.isFromPage) {
      return { ...msg, senderName: 'ANA' };
    }

    return {
      ...msg,
      senderName: customerName || msg.senderName,
      senderAvatar: customerAvatar || msg.senderAvatar,
    };
  });
}

export default function ConversationModal({
  smaxLog,
  open,
  onCancel,
}: ConversationModalProps) {
  const thread = parseSmaxThreadRef(smaxLog);
  const { data, isLoading, isError, isFetching } = useSmaxMessages(thread, open);

  const avatarCandidates = useMemo(() => {
    if (!thread) return [] as string[];
    return [
      thread.customerAvatar,
      ...thread.customerAvatarFallbacks,
    ].filter(Boolean);
  }, [thread]);

  const [avatarIndex, setAvatarIndex] = useState(0);

  useEffect(() => {
    setAvatarIndex(0);
  }, [open, thread?.facebookId, thread?.customerAvatar]);

  if (!thread) {
    return null;
  }

  const customerAvatar = avatarCandidates[avatarIndex];
  const messages = withThreadMeta(
    data?.messages ?? [],
    thread.customerName,
    customerAvatar
  );

  const showNameLoading = (isLoading || isFetching) && !data;

  return (
    <Modal
      width={720}
      centered
      open={open}
      onCancel={onCancel}
      maskClosable={false}
      destroyOnHidden
      footer={null}
      title={
        <div className={styles.modalHeader}>
          <PreviewableAvatar
            key={customerAvatar ?? 'no-avatar'}
            size={44}
            src={customerAvatar}
            previewSrc={customerAvatar}
            icon={<UserOutlined />}
            className={styles.headerAvatar}
            onError={() => {
              const hasNext = avatarIndex < avatarCandidates.length - 1;
              if (hasNext) {
                setAvatarIndex((current) => current + 1);
                return false;
              }
              return true;
            }}
          />
          <div className={styles.headerText}>
            <p className={styles.customerName}>
              {showNameLoading ? (
                <Skeleton.Input active size="small" style={{ width: 160 }} />
              ) : (
                thread.customerName
              )}
            </p>
            <p className={styles.pageName}>Hội thoại Facebook</p>
          </div>
        </div>
      }
      className={styles.modal}
    >
      <div className={styles.chatContainer}>
        <ConversationMessageList
          messages={messages}
          loading={isLoading || (isFetching && !data)}
          error={isError}
        />
      </div>
    </Modal>
  );
}
