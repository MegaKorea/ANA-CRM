'use client';

import {
  Button,
  Checkbox,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  DeleteOutlined,
  LoadingOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useState } from 'react';
import type { FormInstance, UploadProps } from 'antd';
import { AppError } from '@/errors';
import {
  HttpStatusCode,
  QuizErrorCode,
  QuizLimit,
  QuizQuestionType,
  QuizUiMessage,
} from '@/constants/enums';
import type { Quiz, QuizCreateInput } from '@/lib/types/quiz';
import { getQuestionImageUrls } from '@/lib/types/quiz';
import {
  useCreateSessionQuiz,
  useUpdateSessionQuiz,
} from '@/lib/hooks/use-quizzes';
import {
  getImageUploadRejectMessage,
  getImageUploadRejectReason,
  uploadSessionImage,
} from '@/lib/utils/upload-session-image';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import styles from './tab-schedule.module.scss';

export type QuizOptionForm = { id: string; text: string };
export type QuizQuestionForm = {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  image_urls: string[];
  options: QuizOptionForm[];
  correct_option_ids: string[];
};

export type QuizFormValues = {
  title: string;
  duration_minutes?: number;
  passing_score?: number;
  is_published?: boolean;
  questions: QuizQuestionForm[];
};

type Props = {
  classId: string;
  sessionId: string;
  open: boolean;
  editing: Quiz | null;
  isMobile: boolean;
  onClose: () => void;
};

function newId(): string {
  return crypto.randomUUID();
}

export function createEmptyQuizQuestion(): QuizQuestionForm {
  const optionOneId = newId();
  const optionTwoId = newId();
  return {
    id: newId(),
    type: QuizQuestionType.SINGLE,
    prompt: '',
    image_urls: [],
    options: [
      { id: optionOneId, text: '' },
      { id: optionTwoId, text: '' },
    ],
    correct_option_ids: [optionOneId],
  };
}

function toPayload(values: QuizFormValues): QuizCreateInput {
  return {
    title: values.title.trim(),
    duration_minutes: values.duration_minutes ?? QuizLimit.DURATION_MIN,
    passing_score: values.passing_score ?? QuizLimit.PASSING_SCORE_DEFAULT,
    is_published: Boolean(values.is_published),
    questions: values.questions.map((question) => {
      const image_urls = (question.image_urls ?? []).filter((url) => !!url.trim());
      return {
        id: question.id || newId(),
        type:
          question.type === QuizQuestionType.MULTIPLE
            ? QuizQuestionType.MULTIPLE
            : QuizQuestionType.SINGLE,
        prompt: question.prompt.trim(),
        image_url: image_urls[0] ?? null,
        image_urls,
        options: question.options.map((option) => ({
          id: option.id || newId(),
          text: option.text.trim(),
        })),
        correct_option_ids: question.correct_option_ids ?? [],
      };
    }),
  };
}

function fillQuizForm(form: FormInstance<QuizFormValues>, quiz: Quiz | null): void {
  if (!quiz) {
    form.setFieldsValue({
      title: '',
      duration_minutes: QuizLimit.DURATION_MIN,
      passing_score: QuizLimit.PASSING_SCORE_DEFAULT,
      is_published: false,
      questions: [createEmptyQuizQuestion()],
    });
    return;
  }
  form.setFieldsValue({
    title: quiz.title,
    duration_minutes: quiz.duration_minutes,
    passing_score: quiz.passing_score,
    is_published: quiz.is_published,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      image_urls: getQuestionImageUrls(question),
      options: question.options.map((option) => ({ id: option.id, text: option.text })),
      correct_option_ids: question.correct_option_ids ?? [],
    })),
  });
}

export function QuizEditorModal({
  classId,
  sessionId,
  open,
  editing,
  isMobile,
  onClose,
}: Props) {
  const createQuiz = useCreateSessionQuiz(classId);
  const updateQuiz = useUpdateSessionQuiz(classId);
  const [uploadingQuestionIndex, setUploadingQuestionIndex] = useState<number | null>(null);
  const [form] = Form.useForm<QuizFormValues>();

  useEffect(() => {
    if (!open) return;
    fillQuizForm(form, editing);
  }, [open, editing, form]);

  const syncCorrectIds = useCallback(
    (questionIndex: number, options: QuizOptionForm[], type: QuizQuestionType) => {
      const optionIds = options.map((option) => option.id);
      const current =
        (form.getFieldValue(['questions', questionIndex, 'correct_option_ids']) as string[]) ?? [];
      let next = current.filter((id) => optionIds.includes(id));
      if (type === QuizQuestionType.SINGLE) {
        next = next.slice(0, 1);
        if (next.length === 0 && optionIds[0]) next = [optionIds[0]];
      }
      form.setFieldValue(['questions', questionIndex, 'correct_option_ids'], next);
    },
    [form],
  );

  const uploadQuestionImage = useCallback(
    (questionIndex: number): UploadProps => ({
      name: 'file',
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
          setUploadingQuestionIndex(questionIndex);
          const uploaded = await uploadSessionImage(file as File);
          const questions = form.getFieldValue('questions') as QuizQuestionForm[];
          const current = questions[questionIndex];
          const currentUrls = current.image_urls ?? [];
          if (currentUrls.length >= QuizLimit.MAX_IMAGES_PER_QUESTION) {
            message.warning(QuizUiMessage.MAX_IMAGES);
            onSuccess?.(uploaded);
            return;
          }
          const next = [...questions];
          next[questionIndex] = {
            ...current,
            image_urls: [...currentUrls, uploaded.url],
          };
          form.setFieldsValue({ questions: next });
          message.success(QuizUiMessage.IMAGE_ADDED);
          onSuccess?.(uploaded);
        } catch (error) {
          message.error(getErrorMessage(error, QuizUiMessage.UPLOAD_FAILED));
          onError?.(error as Error);
        } finally {
          setUploadingQuestionIndex(null);
        }
      },
    }),
    [form],
  );

  const handleSubmit = useCallback(
    async (values: QuizFormValues) => {
      try {
        const payload = toPayload(values);
        if (editing) {
          await updateQuiz.mutateAsync({
            sessionId,
            quizId: editing.id,
            data: payload,
          });
          message.success(QuizUiMessage.UPDATED);
        } else {
          await createQuiz.mutateAsync({ sessionId, data: payload });
          message.success(QuizUiMessage.CREATED);
        }
        onClose();
      } catch (error: unknown) {
        message.error(getErrorMessage(error, QuizUiMessage.SAVE_FAILED));
      }
    },
    [sessionId, editing, createQuiz, updateQuiz, onClose],
  );

  return (
    <Modal
      title={editing ? 'Sửa bài tập' : 'Thêm bài tập'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={
        createQuiz.isPending || updateQuiz.isPending || uploadingQuestionIndex !== null
      }
      okText="Lưu"
      cancelText="Huỷ"
      destroyOnHidden
      width={isMobile ? '95vw' : 720}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 12 }}>
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: QuizUiMessage.TITLE_REQUIRED }]}
        >
          <Input placeholder="Ví dụ: Kiểm tra buổi 1" maxLength={200} />
        </Form.Item>

        <Space wrap size="middle" style={{ marginBottom: 8 }}>
          <Form.Item name="duration_minutes" label="Thời gian (phút)" style={{ marginBottom: 12 }}>
            <InputNumber
              min={QuizLimit.DURATION_MIN}
              max={QuizLimit.DURATION_MAX}
              style={{ width: 120 }}
            />
          </Form.Item>
          <Form.Item name="passing_score" label="Điểm đạt (%)" style={{ marginBottom: 12 }}>
            <InputNumber
              min={QuizLimit.PASSING_SCORE_MIN}
              max={QuizLimit.PASSING_SCORE_MAX}
              style={{ width: 120 }}
            />
          </Form.Item>
          <Form.Item
            name="is_published"
            label="Mở cho học viên"
            valuePropName="checked"
            style={{ marginBottom: 12 }}
          >
            <Switch />
          </Form.Item>
        </Space>

        <Form.List name="questions">
          {(fields, { add, remove }) => (
            <div className={styles.quizEditorList}>
              <div className={styles.lecturesHead}>
                <span>Câu hỏi</span>
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => add(createEmptyQuizQuestion())}
                >
                  Thêm câu
                </Button>
              </div>
              {fields.map((field, questionIndex) => (
                <div key={field.key} className={styles.quizEditorCard}>
                  <div className={styles.lecturesHead}>
                    <Typography.Text strong>Câu {questionIndex + 1}</Typography.Text>
                    {fields.length > 1 ? (
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    ) : null}
                  </div>

                  <Form.Item name={[field.name, 'id']} hidden>
                    <Input />
                  </Form.Item>

                  <Form.Item name={[field.name, 'type']} label="Loại" rules={[{ required: true }]}>
                    <Select
                      options={[
                        { value: QuizQuestionType.SINGLE, label: 'Một đáp án' },
                        { value: QuizQuestionType.MULTIPLE, label: 'Nhiều đáp án' },
                      ]}
                      onChange={(type: QuizQuestionType) => {
                        const questions = form.getFieldValue('questions') as QuizQuestionForm[];
                        const question = questions[questionIndex];
                        syncCorrectIds(questionIndex, question.options, type);
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name={[field.name, 'prompt']}
                    label="Nội dung câu hỏi"
                    rules={[{ required: true, message: QuizUiMessage.PROMPT_REQUIRED }]}
                  >
                    <Input.TextArea rows={2} placeholder="Câu hỏi…" />
                  </Form.Item>

                  <Form.Item shouldUpdate noStyle>
                    {() => {
                      const questions = form.getFieldValue('questions') as QuizQuestionForm[];
                      const imageUrls = questions?.[questionIndex]?.image_urls ?? [];
                      const canAddMore = imageUrls.length < QuizLimit.MAX_IMAGES_PER_QUESTION;
                      return (
                        <div className={styles.lectureImagesForm}>
                          <div className={styles.lecturesHead}>
                            <span>Ảnh (tuỳ chọn)</span>
                            <Upload {...uploadQuestionImage(questionIndex)}>
                              <Button
                                type="link"
                                size="small"
                                icon={
                                  uploadingQuestionIndex === questionIndex ? (
                                    <LoadingOutlined />
                                  ) : (
                                    <UploadOutlined />
                                  )
                                }
                                disabled={uploadingQuestionIndex !== null || !canAddMore}
                              >
                                {uploadingQuestionIndex === questionIndex
                                  ? 'Đang tải…'
                                  : 'Thêm ảnh'}
                              </Button>
                            </Upload>
                          </div>
                          {imageUrls.length === 0 ? (
                            <Typography.Text type="secondary">
                              {QuizUiMessage.NO_QUESTION_IMAGES}
                            </Typography.Text>
                          ) : (
                            <div className={styles.lectureImagesEdit}>
                              <Image.PreviewGroup>
                                {imageUrls.map((url) => (
                                  <div key={url} className={styles.lectureImageChip}>
                                    <Image
                                      src={url}
                                      alt=""
                                      width={96}
                                      height={72}
                                      style={{ objectFit: 'cover', borderRadius: 6 }}
                                    />
                                    <Button
                                      type="text"
                                      size="small"
                                      danger
                                      className={styles.lectureImageRemove}
                                      icon={<DeleteOutlined />}
                                      onClick={() => {
                                        const next = [...questions];
                                        next[questionIndex] = {
                                          ...next[questionIndex],
                                          image_urls: (
                                            next[questionIndex].image_urls ?? []
                                          ).filter((item) => item !== url),
                                        };
                                        form.setFieldsValue({ questions: next });
                                      }}
                                    />
                                  </div>
                                ))}
                              </Image.PreviewGroup>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  </Form.Item>

                  <Form.List name={[field.name, 'options']}>
                    {(optionFields, optionOperations) => (
                      <div className={styles.quizOptionsEditor}>
                        <div className={styles.lecturesHead}>
                          <span>Lựa chọn</span>
                          <Button
                            type="link"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              optionOperations.add({ id: newId(), text: '' });
                            }}
                          >
                            Thêm
                          </Button>
                        </div>
                        {optionFields.map((optionField) => (
                          <Space
                            key={optionField.key}
                            align="start"
                            style={{ display: 'flex', marginBottom: 8 }}
                          >
                            <Form.Item name={[optionField.name, 'id']} hidden>
                              <Input />
                            </Form.Item>
                            <Form.Item
                              {...optionField}
                              name={[optionField.name, 'text']}
                              style={{ marginBottom: 0, flex: 1, minWidth: 200 }}
                              rules={[{ required: true, message: QuizUiMessage.OPTION_REQUIRED }]}
                            >
                              <Input placeholder="Nội dung lựa chọn" />
                            </Form.Item>
                            {optionFields.length > QuizLimit.MIN_OPTIONS ? (
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  optionOperations.remove(optionField.name);
                                  const questions = form.getFieldValue(
                                    'questions',
                                  ) as QuizQuestionForm[];
                                  const question = questions[questionIndex];
                                  const options = question.options.filter(
                                    (_, index) => index !== optionField.name,
                                  );
                                  syncCorrectIds(questionIndex, options, question.type);
                                }}
                              />
                            ) : null}
                          </Space>
                        ))}
                      </div>
                    )}
                  </Form.List>

                  <Form.Item shouldUpdate noStyle>
                    {() => {
                      const questions = form.getFieldValue('questions') as QuizQuestionForm[];
                      const question = questions?.[questionIndex];
                      if (!question) return null;
                      const type =
                        question.type === QuizQuestionType.MULTIPLE
                          ? QuizQuestionType.MULTIPLE
                          : QuizQuestionType.SINGLE;
                      return type === QuizQuestionType.MULTIPLE ? (
                        <Form.Item
                          name={[field.name, 'correct_option_ids']}
                          label="Đáp án đúng"
                          rules={[
                            {
                              validator: async (_, value) => {
                                const ids = Array.isArray(value) ? value : [];
                                if (ids.length === 0) {
                                  throw new AppError(
                                    QuizErrorCode.CORRECT_ANSWER_REQUIRED,
                                    HttpStatusCode.BAD_REQUEST,
                                    QuizUiMessage.CORRECT_MULTI_REQUIRED,
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <Checkbox.Group className={styles.quizOptions}>
                            <Space direction="vertical">
                              {(question.options ?? []).map((option) => (
                                <Checkbox key={option.id} value={option.id}>
                                  {option.text || '(trống)'}
                                </Checkbox>
                              ))}
                            </Space>
                          </Checkbox.Group>
                        </Form.Item>
                      ) : (
                        <Form.Item
                          name={[field.name, 'correct_option_ids']}
                          label="Đáp án đúng"
                          getValueProps={(ids: string[] | undefined) => ({
                            value: Array.isArray(ids) ? ids[0] : undefined,
                          })}
                          getValueFromEvent={(event: { target: { value: string } }) => [
                            event.target.value,
                          ]}
                          rules={[
                            {
                              validator: async (_, value) => {
                                const ids = Array.isArray(value) ? value : [];
                                if (ids.length !== 1) {
                                  throw new AppError(
                                    QuizErrorCode.SINGLE_ONE_ANSWER,
                                    HttpStatusCode.BAD_REQUEST,
                                    QuizUiMessage.CORRECT_SINGLE_REQUIRED,
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <Radio.Group className={styles.quizOptions}>
                            <Space direction="vertical">
                              {(question.options ?? []).map((option) => (
                                <Radio key={option.id} value={option.id}>
                                  {option.text || '(trống)'}
                                </Radio>
                              ))}
                            </Space>
                          </Radio.Group>
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </div>
              ))}
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
