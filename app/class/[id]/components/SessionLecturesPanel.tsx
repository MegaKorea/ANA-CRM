'use client';

import {
  Button,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Space,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useCallback, useState } from 'react';
import type { UploadProps } from 'antd';
import { AppError } from '@/errors';
import {
  HttpStatusCode,
  LectureErrorCode,
  LectureUiMessage,
  UploadImageLimit,
} from '@/constants/enums';
import type { SessionLecture, SessionLectureAttachment } from '@/lib/types/session-lecture';
import {
  useCreateSessionLecture,
  useDeleteSessionLecture,
  useSessionLectures,
  useUpdateSessionLecture,
  type SessionLectureFormValues,
} from '@/lib/hooks/use-class-sessions';
import {
  getImageUploadRejectMessage,
  getImageUploadRejectReason,
  uploadSessionImage,
} from '@/lib/utils/upload-session-image';
import { assertAllowedHttpUrl } from '@/lib/utils/assert-http-url';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import { LectureDetailModal } from './LectureDetailModal';
import styles from './tab-schedule.module.scss';

type Props = {
  classId: string;
  sessionId: string | null;
  canEdit: boolean;
  isMobile: boolean;
};

export function SessionLecturesPanel({ classId, sessionId, canEdit, isMobile }: Props) {
  const { data: lectures = [], isLoading } = useSessionLectures(sessionId);
  const createLecture = useCreateSessionLecture(classId);
  const updateLecture = useUpdateSessionLecture(classId);
  const deleteLecture = useDeleteSessionLecture(classId);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewingLecture, setViewingLecture] = useState<SessionLecture | null>(null);
  const [editing, setEditing] = useState<SessionLecture | null>(null);
  const [attachments, setAttachments] = useState<SessionLectureAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm<SessionLectureFormValues>();

  const openView = useCallback((lecture: SessionLecture) => {
    setViewingLecture(lecture);
  }, []);

  const closeView = useCallback(() => {
    setViewingLecture(null);
  }, []);

  const openCreate = useCallback(() => {
    setEditing(null);
    setAttachments([]);
    form.setFieldsValue({ title: '', html: '', links: [] });
    setModalOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (lecture: SessionLecture) => {
      setEditing(lecture);
      setAttachments(lecture.attachments ?? []);
      form.setFieldsValue({
        title: lecture.title,
        html: lecture.html,
        links: lecture.links.length ? lecture.links : [],
      });
      setModalOpen(true);
    },
    [form],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
    setAttachments([]);
    form.resetFields();
  }, [form]);

  const handleSubmit = useCallback(
    async (values: SessionLectureFormValues) => {
      if (!sessionId) return;
      const payload: SessionLectureFormValues = {
        title: values.title.trim(),
        html: values.html?.trim() ?? '',
        links: (values.links ?? [])
          .filter((l) => l?.url?.trim())
          .map((l) => ({
            label: (l.label ?? '').trim() || (l.url ?? '').trim(),
            url: (l.url ?? '').trim(),
          })),
        attachments,
      };
      try {
        if (editing) {
          await updateLecture.mutateAsync({
            sessionId,
            lectureId: editing.id,
            data: payload,
          });
          message.success(LectureUiMessage.UPDATED);
        } else {
          await createLecture.mutateAsync({ sessionId, data: payload });
          message.success(LectureUiMessage.CREATED);
        }
        closeModal();
      } catch (error: unknown) {
        message.error(getErrorMessage(error, LectureUiMessage.SAVE_FAILED));
      }
    },
    [sessionId, editing, attachments, createLecture, updateLecture, closeModal],
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

  const removeAttachment = useCallback((url: string) => {
    setAttachments((prev) => prev.filter((item) => item.url !== url));
  }, []);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file) => {
      const rejectReason = getImageUploadRejectReason(file);
      if (rejectReason) {
        message.error(getImageUploadRejectMessage(rejectReason));
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploading(true);
        const uploaded = await uploadSessionImage(file as File);
        setAttachments((prev) => [...prev, uploaded]);
        message.success(LectureUiMessage.IMAGE_ADDED);
        onSuccess?.(uploaded);
      } catch (error) {
        message.error(getErrorMessage(error, LectureUiMessage.UPLOAD_FAILED));
        onError?.(error as Error);
      } finally {
        setUploading(false);
      }
    },
  };

  if (!sessionId) return null;

  return (
    <section className={styles.lecturesPanel}>
      <div className={styles.lecturesHead}>
        <div className={styles.lecturesTitle}>
          <ReadOutlined />
          <span>Bài giảng</span>
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
        <Typography.Text type="secondary">Đang tải bài giảng…</Typography.Text>
      ) : lectures.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={canEdit ? 'Chưa có bài giảng — nhấn Thêm để tạo' : 'Chưa có bài giảng'}
        />
      ) : (
        <ul className={styles.lecturesList}>
          {lectures.map((lecture) => (
            <li key={lecture.id} className={styles.lectureItem}>
              <button
                type="button"
                className={styles.lectureItemMain}
                onClick={() => openView(lecture)}
              >
                <p className={styles.lectureItemTitle}>{lecture.title}</p>
                {lecture.html ? (
                  <p className={styles.lectureItemPreview}>
                    {lecture.html.length > 120 ? `${lecture.html.slice(0, 120)}…` : lecture.html}
                  </p>
                ) : null}
                {lecture.attachments.length > 0 ? (
                  <div className={styles.lectureImages}>
                    {lecture.attachments.slice(0, 3).map((file) => (
                      <span key={`${lecture.id}-${file.url}`} className={styles.lectureThumb}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={file.url} alt={file.name} />
                      </span>
                    ))}
                    {lecture.attachments.length > 3 ? (
                      <Typography.Text type="secondary" className={styles.lectureThumbMore}>
                        +{lecture.attachments.length - 3}
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

      <LectureDetailModal
        lecture={viewingLecture}
        open={viewingLecture !== null}
        isMobile={isMobile}
        onClose={closeView}
      />

      <Modal
        title={editing ? 'Sửa bài giảng' : 'Thêm bài giảng'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={createLecture.isPending || updateLecture.isPending || uploading}
        okText="Lưu"
        cancelText="Huỷ"
        destroyOnHidden
        width={isMobile ? '95vw' : 560}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 12 }}>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Nhập tiêu đề bài giảng' }]}
          >
            <Input placeholder="Ví dụ: Lý thuyết chăm sóc da" maxLength={200} />
          </Form.Item>
          <Form.Item name="html" label="Nội dung">
            <Input.TextArea rows={5} placeholder="Mô tả / nội dung bài giảng" />
          </Form.Item>

          <div className={styles.lectureImagesForm}>
            <div className={styles.lecturesHead}>
              <span>Ảnh</span>
              <Upload {...uploadProps}>
                <Button
                  type="link"
                  size="small"
                  icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
                  disabled={uploading}
                >
                  {uploading ? 'Đang tải…' : 'Thêm ảnh'}
                </Button>
              </Upload>
            </div>
            {attachments.length === 0 ? (
              <Typography.Text type="secondary">
                Chưa có ảnh (tối đa {UploadImageLimit.MAX_MB}MB / ảnh)
              </Typography.Text>
            ) : (
              <div className={styles.lectureImagesEdit}>
                <Image.PreviewGroup>
                  {attachments.map((file) => (
                    <div key={file.url} className={styles.lectureImageChip}>
                      <Image
                        src={file.url}
                        alt={file.name}
                        width={72}
                        height={72}
                        style={{ objectFit: 'cover', borderRadius: 6 }}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        className={styles.lectureImageRemove}
                        icon={<DeleteOutlined />}
                        onClick={() => removeAttachment(file.url)}
                      />
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
            )}
          </div>

          <Form.List name="links">
            {(fields, { add, remove }) => (
              <div className={styles.lectureLinksForm}>
                <div className={styles.lecturesHead}>
                  <span>Liên kết</span>
                  <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => add()}>
                    Thêm link
                  </Button>
                </div>
                {fields.map((field) => (
                  <Space key={field.key} align="start" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'label']}
                      style={{ marginBottom: 0, width: 140 }}
                    >
                      <Input placeholder="Nhãn" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'url']}
                      style={{ marginBottom: 0, flex: 1, minWidth: 180 }}
                      rules={[
                        {
                          validator: async (_, value) => {
                            const url = typeof value === 'string' ? value.trim() : '';
                            if (!url) return;
                            try {
                              assertAllowedHttpUrl(url);
                            } catch {
                              throw new AppError(
                                LectureErrorCode.INVALID_LINK_URL,
                                HttpStatusCode.BAD_REQUEST,
                                LectureUiMessage.INVALID_URL,
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input placeholder="https://..." />
                    </Form.Item>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                  </Space>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </section>
  );
}
