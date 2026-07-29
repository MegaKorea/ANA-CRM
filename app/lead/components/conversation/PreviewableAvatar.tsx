'use client';

import { Avatar } from 'antd';
import type { AvatarProps } from 'antd';
import { useState } from 'react';
import { MediaPreviewModal } from './MediaPreviewModal';
import styles from '../ConversationModal.module.scss';

type PreviewableAvatarProps = AvatarProps & {
  previewSrc?: string;
  previewAlt?: string;
};

function resolveImageSrc(
  previewSrc: PreviewableAvatarProps['previewSrc'],
  src: AvatarProps['src']
): string | undefined {
  if (typeof previewSrc === 'string' && previewSrc) return previewSrc;
  if (typeof src === 'string' && src) return src;
  return undefined;
}

export function PreviewableAvatar({
  previewSrc,
  previewAlt = 'Ảnh đại diện',
  src,
  className,
  onClick,
  ...rest
}: PreviewableAvatarProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const imageSrc = resolveImageSrc(previewSrc, src);
  const canPreview = Boolean(imageSrc);

  return (
    <>
      <Avatar
        {...rest}
        src={src}
        className={[className, canPreview ? styles.mediaClickable : '']
          .filter(Boolean)
          .join(' ')}
        onClick={(event) => {
          onClick?.(event);
          if (canPreview) setPreviewOpen(true);
        }}
      />
      <MediaPreviewModal
        open={previewOpen}
        src={imageSrc}
        alt={previewAlt}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
