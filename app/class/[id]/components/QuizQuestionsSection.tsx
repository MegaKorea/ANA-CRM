'use client';

import { Button, Collapse, Form } from 'antd';
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
  uploadingQuestionIndex: number | null;
  uploadQuestionImage: (questionIndex: number) => UploadProps;
};

export function QuizQuestionsSection({
  form,
  activeKeys,
  onActiveKeysChange,
  saving,
  uploadingQuestionIndex,
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
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={saving}
                      onClick={(event) => {
                        event.stopPropagation();
                        remove(field.name);
                        const removed = String(questionIndex);
                        const filtered = activeKeys.filter((key) => key !== removed);
                        if (filtered.length > 0) {
                          onActiveKeysChange(filtered);
                          return;
                        }
                        onActiveKeysChange([String(Math.max(0, fields.length - 2))]);
                      }}
                    />
                  ) : null}
                </div>
              ),
              children: (
                <QuizQuestionEditor
                  field={field}
                  questionIndex={questionIndex}
                  form={form}
                  uploadingQuestionIndex={uploadingQuestionIndex}
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
