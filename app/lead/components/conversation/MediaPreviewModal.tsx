'use client';

import { Modal } from 'antd';
import styles from '../ConversationModal.module.scss';

export type PreviewMediaKind = 'image' | 'video';

interface MediaPreviewModalProps {
  open: boolean;
  src?: string;
  kind?: PreviewMediaKind;
  alt?: string;
  onClose: () => void;
}

export function MediaPreviewModal({
  open,
  src,
  kind = 'image',
  alt = 'Xem media',
  onClose,
}: MediaPreviewModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width="auto"
      className={styles.mediaPreviewModal}
      destroyOnHidden
    >
      {!src ? null : kind === 'video' ? (
        <video
          key={src}
          src={src}
          controls
          autoPlay
          playsInline
          className={styles.mediaPreviewMedia}
        />
      ) : (
        <img src={src} alt={alt} className={styles.mediaPreviewMedia} />
      )}
    </Modal>
  );
}
