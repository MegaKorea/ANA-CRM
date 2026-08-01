'use client';

import {
  Button,
  Checkbox,
  Form,
  Image,
  Input,
  Radio,
  Select,
  Space,
  Typography,
  Upload,
} from 'antd';
import {
  DeleteOutlined,
  LoadingOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { FormInstance, FormListFieldData, UploadProps } from 'antd';
import { AppError } from '@/errors';
import {
  HttpStatusCode,
  QuizErrorCode,
  QuizLimit,
  QuizQuestionType,
  QuizUiMessage,
} from '@/constants/enums';
import {
  newQuizEntityId,
  syncQuizCorrectIds,
  type QuizFormValues,
  type QuizQuestionForm,
} from './quiz-editor.utils';
import styles from './quiz-editor.module.scss';

type Props = {
  field: FormListFieldData;
  questionIndex: number;
  form: FormInstance<QuizFormValues>;
  uploadingQuestionIndex: number | null;
  uploadQuestionImage: (questionIndex: number) => UploadProps;
};

export function QuizQuestionEditor({
  field,
  questionIndex,
  form,
  uploadingQuestionIndex,
  uploadQuestionImage,
}: Props) {
  return (
    <>
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
            syncQuizCorrectIds(form, questionIndex, question.options, type);
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
            <div className={styles.imagesBlock}>
              <div className={styles.imagesHead}>
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
                    {uploadingQuestionIndex === questionIndex ? 'Đang tải…' : 'Thêm ảnh'}
                  </Button>
                </Upload>
              </div>
              {imageUrls.length === 0 ? (
                <Typography.Text type="secondary">{QuizUiMessage.NO_QUESTION_IMAGES}</Typography.Text>
              ) : (
                <div className={styles.imagesGrid}>
                  <Image.PreviewGroup>
                    {imageUrls.map((url) => (
                      <div key={url} className={styles.imageChip}>
                        <Image src={url} alt="" width={96} height={72} />
                        <Button
                          type="text"
                          size="small"
                          danger
                          className={styles.imageRemove}
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            const next = [...questions];
                            next[questionIndex] = {
                              ...next[questionIndex],
                              image_urls: (next[questionIndex].image_urls ?? []).filter(
                                (item) => item !== url,
                              ),
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
          <div className={styles.optionsBlock}>
            <div className={styles.optionsHead}>
              <span>Lựa chọn</span>
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => optionOperations.add({ id: newQuizEntityId(), text: '' })}
              >
                Thêm
              </Button>
            </div>
            {optionFields.map((optionField) => (
              <div key={optionField.key} className={styles.optionRow}>
                <Form.Item name={[optionField.name, 'id']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item
                  {...optionField}
                  name={[optionField.name, 'text']}
                  className={styles.optionText}
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
                      const questions = form.getFieldValue('questions') as QuizQuestionForm[];
                      const question = questions[questionIndex];
                      const options = question.options.filter(
                        (_, index) => index !== optionField.name,
                      );
                      syncQuizCorrectIds(form, questionIndex, options, question.type);
                    }}
                  />
                ) : null}
              </div>
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
              <Checkbox.Group className={styles.options}>
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
              getValueFromEvent={(event: { target: { value: string } }) => [event.target.value]}
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
              <Radio.Group className={styles.options}>
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
    </>
  );
}
