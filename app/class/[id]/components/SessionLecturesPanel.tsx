'use client';

import { Button, Popconfirm, Space, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReadOutlined } from '@ant-design/icons';
import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LectureUiMessage } from '@/constants/enums';
import type { SessionLecture } from '@/lib/types/session-lecture';
import {
  useDeleteSessionLecture,
  useSessionLectures,
} from '@/lib/hooks/use-class-sessions';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import { ScheduleLoading } from './ScheduleLoading';
import styles from './tab-schedule.module.scss';

type Props = {
  classId: string;
  sessionId: string | null;
  canEdit: boolean;
};

export function SessionLecturesPanel({ classId, sessionId, canEdit }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get('date');

  const { data: lectures = [], isLoading } = useSessionLectures(sessionId);
  const deleteLecture = useDeleteSessionLecture(classId);

  const scheduleQuery = dateQuery ? `?date=${encodeURIComponent(dateQuery)}` : '';

  const openView = useCallback(
    (lecture: SessionLecture) => {
      if (!sessionId) return;
      router.push(
        `/class/${classId}/sessions/${sessionId}/lectures/${lecture.id}${scheduleQuery}`,
      );
    },
    [router, classId, sessionId, scheduleQuery],
  );

  const openCreate = useCallback(() => {
    if (!sessionId) return;
    router.push(`/class/${classId}/sessions/${sessionId}/lectures/new${scheduleQuery}`);
  }, [router, classId, sessionId, scheduleQuery]);

  const openEdit = useCallback(
    (lecture: SessionLecture) => {
      if (!sessionId) return;
      router.push(
        `/class/${classId}/sessions/${sessionId}/lectures/${lecture.id}/edit${scheduleQuery}`,
      );
    },
    [router, classId, sessionId, scheduleQuery],
  );

  const handleDelete = useCallback(
    async (lectureId: string) => {
      if (!sessionId) return;
      try {
        await deleteLecture.mutateAsync({ sessionId, lectureId });
        message.success(LectureUiMessage.DELETED);
      } catch (error: unknown) {
        message.error(getErrorMessage(error, LectureUiMessage.DELETE_FAILED));
      }
    },
    [sessionId, deleteLecture],
  );

  return (
    <section className={styles.lecturesPanel}>
      <div className={styles.lecturesHead}>
        <div className={styles.lecturesTitle}>
          <ReadOutlined />
          <Typography.Text strong>Bài giảng</Typography.Text>
          {lectures.length > 0 ? (
            <Typography.Text type="secondary">({lectures.length})</Typography.Text>
          ) : null}
        </div>
        {canEdit ? (
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <ScheduleLoading tip="Đang tải bài giảng…" />
      ) : lectures.length === 0 ? (
        <Typography.Text type="secondary" className={styles.panelEmptyHint}>
          {canEdit ? 'Chưa có bài giảng — nhấn Thêm để tạo' : 'Chưa có bài giảng'}
        </Typography.Text>
      ) : (
        <ul className={styles.lecturesList}>
          {lectures.map((lecture) => (
            <li key={lecture.id} className={styles.lectureItem}>
              <button
                type="button"
                className={styles.lectureItemMain}
                onClick={() => openView(lecture)}
              >
                <p className={styles.lectureItemTitle}>
                  {lecture.title}
                  {canEdit && lecture.status === 'draft' ? (
                    <Typography.Text type="warning" className={styles.lectureDraftBadge}>
                      {' '}
                      · Nháp
                    </Typography.Text>
                  ) : null}
                </p>
                {lecture.html ? (
                  <p className={styles.lectureItemPreview}>
                    {lecture.html.replace(/<[^>]+>/g, '').slice(0, 120) || 'Có nội dung định dạng'}
                    {lecture.html.replace(/<[^>]+>/g, '').length > 120 ? '…' : ''}
                  </p>
                ) : null}
                {lecture.attachments.length > 0 ? (
                  <div className={styles.lectureImages}>
                    <span className={styles.lectureThumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={lecture.attachments[0].url} alt="" />
                    </span>
                    {lecture.attachments.length > 1 ? (
                      <Typography.Text type="secondary" className={styles.lectureThumbMore}>
                        +{lecture.attachments.length - 1}
                      </Typography.Text>
                    ) : null}
                  </div>
                ) : null}
                {lecture.links.length > 0 ? (
                  <Typography.Text type="secondary" className={styles.lectureLinkHint}>
                    {lecture.links.length} liên kết
                  </Typography.Text>
                ) : null}
              </button>
              {canEdit ? (
                <Space size={4} className={styles.lectureItemActions}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(lecture)}
                  />
                  <Popconfirm
                    title="Xóa bài giảng này?"
                    okText="Xóa"
                    cancelText="Huỷ"
                    onConfirm={() => handleDelete(lecture.id)}
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
