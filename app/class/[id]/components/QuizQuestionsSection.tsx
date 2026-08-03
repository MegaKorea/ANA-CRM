'use client';

import { Button, Collapse, Form, Popconfirm } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance, UploadProps } from 'antd';
import { QuizQuestionEditor } from './QuizQuestionEditor';
import { createEmptyQuizQuestion, type QuizFormValues } from './quiz-editor.utils';
import styles from './quiz-editor.module.scss';

type Props = {
  form: FormInstance<QuizFormValues>;
  activeKeys: string[];
  onActiveKeysChange: (keys: string[]) => void;
  saving: boolean;
  uploadingQuestionId: string | null;
  uploadQuestionImage: (questionId: string) => UploadProps;
};

export function QuizQuestionsSection({
  form,
  activeKeys,
  onActiveKeysChange,
  saving,
  uploadingQuestionId,
  uploadQuestionImage,
}: Props) {
  return (
    <Form.List name="questions">
      {(fields, { add, remove }) => (
        <div className={styles.list}>
          <div className={styles.listHead}>
            <span>Câu hỏi ({fields.length})</span>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              disabled={saving}
              onClick={() => {
                add(createEmptyQuizQuestion());
                onActiveKeysChange([String(fields.length)]);
              }}
            >
              Thêm câu
            </Button>
          </div>

          <Collapse
            accordion
            activeKey={activeKeys}
            onChange={(keys) => {
              const next = Array.isArray(keys) ? keys : keys ? [keys] : [];
              onActiveKeysChange(next.map(String));
            }}
            className={styles.collapse}
            items={fields.map((field, questionIndex) => ({
              key: String(questionIndex),
              label: (
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>Câu {questionIndex + 1}</span>
                  {fields.length > 1 ? (
                    <span onClick={(event) => event.stopPropagation()}>
                      <Popconfirm
                        title="Xóa câu hỏi này?"
                        description="Nội dung câu hỏi sẽ mất, không thể hoàn tác."
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => {
                          remove(field.name);
                          const removed = String(questionIndex);
                          const filtered = activeKeys.filter((key) => key !== removed);
                          if (filtered.length > 0) {
                            onActiveKeysChange(filtered);
                            return;
                          }
                          onActiveKeysChange([String(Math.max(0, fields.length - 2))]);
                        }}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={saving}
                        />
                      </Popconfirm>
                    </span>
                  ) : null}
                </div>
              ),
              children: (
                <QuizQuestionEditor
                  field={field}
                  questionIndex={questionIndex}
                  form={form}
                  uploadingQuestionId={uploadingQuestionId}
                  uploadQuestionImage={uploadQuestionImage}
                />
              ),
            }))}
          />
        </div>
      )}
    </Form.List>
  );
}
