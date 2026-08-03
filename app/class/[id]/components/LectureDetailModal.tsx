'use client';

import { Button, Image, Modal, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import type { SessionLecture } from '@/lib/types/session-lecture';
import styles from './tab-schedule.module.scss';

type Props = {
  lecture: SessionLecture | null;
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
};

export function LectureDetailModal({ lecture, open, isMobile, onClose }: Props) {
  return (
    <Modal
      title={lecture?.title ?? 'Bài giảng'}
      open={open}
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          Đóng
        </Button>
      }
      destroyOnHidden
      width={isMobile ? '95vw' : 640}
      className={styles.lectureDetailModal}
    >
      {lecture ? (
        <div className={styles.lectureDetailBody}>
          {lecture.html ? (
            <div className={styles.lectureDetailContent}>{lecture.html}</div>
          ) : (
            <Typography.Text type="secondary">Chưa có nội dung văn bản.</Typography.Text>
          )}

          {lecture.attachments.length > 0 ? (
            <div className={styles.lectureDetailSection}>
              <Typography.Text strong>Ảnh đính kèm</Typography.Text>
              <div className={styles.lectureDetailImages}>
                <Image.PreviewGroup>
                  {lecture.attachments.map((file) => (
                    <Image
                      key={file.url}
                      src={file.url}
                      alt={file.name}
                      width={120}
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            </div>
          ) : null}

          {lecture.links.length > 0 ? (
            <div className={styles.lectureDetailSection}>
              <Typography.Text strong>Liên kết</Typography.Text>
              <ul className={styles.lectureDetailLinks}>
                {lecture.links.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      <LinkOutlined /> {link.label || link.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
