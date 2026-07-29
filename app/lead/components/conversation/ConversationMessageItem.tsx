'use client';

import {
  UserOutlined,
  RobotOutlined,
  PaperClipOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import logoAna from '@/app/assets/logo/logo-ana.png';
import type { SmaxChatMessage, SmaxMessageAttachment } from '@/lib/smax/types';
import {
  MediaPreviewModal,
  type PreviewMediaKind,
} from './MediaPreviewModal';
import { PreviewableAvatar } from './PreviewableAvatar';
import styles from '../ConversationModal.module.scss';

const ANA_AVATAR_SRC = logoAna.src;

type PreviewTarget = {
  src: string;
  kind: PreviewMediaKind;
  alt?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isImageAttachment(att: SmaxMessageAttachment): boolean {
  const type = (att.type ?? '').toLowerCase();
  const mime = (att.mime_type ?? '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  if (
    type.startsWith('image') ||
    type === 'photo' ||
    type === 'sticker' ||
    type === 'gif' ||
    type === 'animated_image'
  ) {
    return true;
  }

  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(
    att.url ?? att.preview_url ?? ''
  );
}

function isVideoAttachment(att: SmaxMessageAttachment): boolean {
  const type = (att.type ?? '').toLowerCase();
  const mime = (att.mime_type ?? '').toLowerCase();
  if (mime.startsWith('video/')) return true;
  if (type.startsWith('video')) return true;

  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(att.url ?? att.preview_url ?? '');
}

function attachmentSrc(att: SmaxMessageAttachment): string | undefined {
  return att.url || att.preview_url || undefined;
}

function imageLayoutClass(count: number): string {
  if (count <= 1) return '';
  if (count === 2) return `${styles.multipleImages} ${styles.twoImages}`;
  if (count === 3) return `${styles.multipleImages} ${styles.threeImages}`;
  if (count === 4) return `${styles.multipleImages} ${styles.fourImages}`;
  return `${styles.multipleImages} ${styles.fivePlusImages}`;
}

function MessageAttachments({
  attachments,
}: {
  attachments: SmaxMessageAttachment[];
}) {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  if (attachments.length === 0) return null;

  const images = attachments.filter(isImageAttachment);
  const videos = attachments.filter(
    (att) => !isImageAttachment(att) && isVideoAttachment(att)
  );
  const files = attachments.filter(
    (att) => !isImageAttachment(att) && !isVideoAttachment(att)
  );

  const openPreview = (att: SmaxMessageAttachment, kind: PreviewMediaKind) => {
    const src = attachmentSrc(att);
    if (!src) return;
    setPreview({
      src,
      kind,
      alt: att.name || (kind === 'video' ? 'Video' : 'Ảnh'),
    });
  };

  return (
    <div>
      {images.length > 0 && (
        <div
          className={`${styles.messageImages} ${imageLayoutClass(images.length)}`}
        >
          {images.slice(0, 4).map((img, index) => {
            const src = img.preview_url || img.url;
            if (!src) return null;

            return (
              <button
                key={img.id}
                type="button"
                className={`${styles.messageImage} ${styles.mediaClickable}`}
                onClick={() => openPreview(img, 'image')}
                aria-label={img.name || 'Xem ảnh lớn'}
              >
                <img
                  src={src}
                  alt={img.name || 'Ảnh đính kèm'}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {images.length > 4 && index === 3 && (
                  <div className={styles.imageCounterOverlay}>
                    +{images.length - 4}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {videos.map((video) => {
        const src = attachmentSrc(video);
        if (!src) return null;

        return (
          <button
            key={video.id}
            type="button"
            className={`${styles.messageVideo} ${styles.mediaClickable}`}
            onClick={() => openPreview(video, 'video')}
            aria-label={video.name || 'Xem video'}
          >
            <video
              src={src}
              muted
              preload="metadata"
              playsInline
              className={styles.messageVideoThumb}
            />
            <span className={styles.messageVideoPlay}>
              <PlayCircleOutlined />
            </span>
          </button>
        );
      })}

      {files.map((file) => (
        <div key={file.id} className={styles.attachmentFile}>
          <PaperClipOutlined className={styles.attachmentFileIcon} />
          <div className={styles.attachmentFileInfo}>
            <div className={styles.attachmentFileName}>
              {file.url ? (
                <a href={file.url} target="_blank" rel="noreferrer">
                  {file.name || 'Tệp đính kèm'}
                </a>
              ) : (
                file.name || 'Tệp đính kèm'
              )}
            </div>
            {file.size != null && (
              <div className={styles.attachmentFileSize}>
                {formatFileSize(file.size)}
              </div>
            )}
          </div>
        </div>
      ))}

      <MediaPreviewModal
        open={Boolean(preview)}
        src={preview?.src}
        kind={preview?.kind}
        alt={preview?.alt}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}

interface ConversationMessageItemProps {
  message: SmaxChatMessage;
  compact?: boolean;
}

export function ConversationMessageItem({
  message,
  compact = false,
}: ConversationMessageItemProps) {
  const { isFromPage, isAi } = message;
  const time = message.createdAt ? formatTime(message.createdAt) : '';
  const hasBody = Boolean(message.text) || message.attachments.length > 0;

  if (!hasBody) return null;

  return (
    <div
      className={`${styles.messageWrapper} ${
        isFromPage ? styles.messageFromPage : styles.messageFromUser
      } ${compact ? styles.compact : ''}`}
    >
      <div className={styles.messageContainer}>
        <PreviewableAvatar
          size={32}
          src={isFromPage ? ANA_AVATAR_SRC : message.senderAvatar || undefined}
          previewSrc={
            isFromPage ? ANA_AVATAR_SRC : message.senderAvatar || undefined
          }
          icon={isAi ? <RobotOutlined /> : <UserOutlined />}
          className={`${styles.messageAvatar} ${
            isFromPage ? styles.pageAvatar : styles.userAvatar
          }`}
        />

        <div className={styles.messageContent}>
          {!compact && (
            <span className={styles.senderName}>
              {message.senderName}
              {isAi ? <span className={styles.aiBadge}>AI</span> : null}
            </span>
          )}

          <div
            className={`${styles.messageBubble} ${
              isFromPage ? styles.pageBubble : styles.userBubble
            }`}
          >
            {message.text ? (
              <div className={styles.messageText}>{message.text}</div>
            ) : null}
            <MessageAttachments attachments={message.attachments} />
          </div>

          {time ? (
            <div className={styles.messageMeta}>
              <span className={styles.messageTime}>{time}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
