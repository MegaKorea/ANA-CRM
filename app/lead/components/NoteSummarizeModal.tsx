'use client';

import { useState } from 'react';
import { App, Modal, Upload, Empty, Typography, Space, Tag, Collapse } from 'antd';
import { InboxOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import type { NoteSummarizeItem } from '@/lib/supabase/types/tables/leads';
import { fetchJson } from '@/lib/utils/fetchJson';
import { useAddLeadNoteSummarize } from '@/lib/hooks/use-leads';

const { Dragger } = Upload;

interface NoteSummarizeModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export function NoteSummarizeModal({ open, lead, onClose }: NoteSummarizeModalProps) {
  const { message } = App.useApp();
  const [uploading, setUploading] = useState(false);
  const [prevLeadId, setPrevLeadId] = useState<number | null>(null);
  const [localRecords, setLocalRecords] = useState<NoteSummarizeItem[]>([]);
  const addNoteSummarizeMutation = useAddLeadNoteSummarize();

  if (open && lead && lead.id !== prevLeadId) {
    setPrevLeadId(lead.id);
    setLocalRecords(Array.isArray(lead.note_summarize) ? lead.note_summarize : []);
  }

  const sortedRecords = [...localRecords].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: 'audio/*',
    showUploadList: false,
    beforeUpload: (file) => {
      if (!file.type.startsWith('audio/')) {
        message.error('Chỉ chấp nhận file ghi âm!');
        return Upload.LIST_IGNORE;
      }
      const isLt200M = file.size / 1024 / 1024 < 200;
      if (!isLt200M) {
        message.error('File phải nhỏ hơn 200MB!');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      if (!lead) return;
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file as File);

        const uploadResult = await fetchJson<{
          success: boolean;
          data: { url: string };
          error?: { message?: string };
        }>('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.error?.message || 'Upload thất bại');
        }

        message.loading({ content: 'Đang tóm tắt...', key: 'summarize' });
        const updatedLead = await addNoteSummarizeMutation.mutateAsync({
          id: lead.id,
          url: uploadResult.data.url,
          mime_type: (file as File).type,
        });

        setLocalRecords(Array.isArray(updatedLead.note_summarize) ? updatedLead.note_summarize : []);
        message.success({ content: 'Tóm tắt thành công!', key: 'summarize' });
        onSuccess?.({});
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
        message.error({ content: errorMessage, key: 'summarize' });
        onError?.(error as Error);
      } finally {
        setUploading(false);
      }
    },
  };

  return (
    <Modal
      open={open}
      title={
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Ghi chú ghi âm <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>- {lead?.full_name || ''}</span>
        </div>
      }
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
      width={700}
    >
      <Dragger {...uploadProps} disabled={uploading} style={{ marginBottom: 24 }}>
        <p className="ant-upload-drag-icon">
          {uploading ? (
            <LoadingOutlined style={{ fontSize: 40, color: '#1890ff' }} />
          ) : (
            <InboxOutlined style={{ fontSize: 40, color: '#1890ff' }} />
          )}
        </p>
        <p className="ant-upload-text">
          {uploading ? 'Đang xử lý...' : 'Kéo thả file ghi âm vào đây hoặc nhấp để chọn'}
        </p>
        <p className="ant-upload-hint">Sẽ tự động được tóm tắt sau khi tải lên. Tối đa 200MB.</p>
      </Dragger>

      {sortedRecords.length === 0 ? (
        <Empty description="Chưa có ghi chú video/ghi âm nào" />
      ) : (
        <div style={{ maxHeight: 420, overflowY: 'auto', display: 'grid', gap: 12 }}>
          {sortedRecords.map((item) => (
            <div key={item.url} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Tag color="blue">{new Date(item.created_at).toLocaleString('vi-VN')}</Tag>
                <audio src={item.url} controls style={{ width: '100%' }} />
                {item.result && (
                  <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    <strong>Tóm tắt: </strong>
                    {typeof item.result.summary === 'string'
                      ? item.result.summary
                      : JSON.stringify(item.result, null, 2)}
                  </Typography.Paragraph>
                )}
                {item.transcript && (
                  <Collapse
                    ghost
                    size="small"
                    items={[
                      {
                        key: 'transcript',
                        label: 'Xem transcript',
                        children: (
                          <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {item.transcript}
                          </Typography.Paragraph>
                        ),
                      },
                    ]}
                  />
                )}
              </Space>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
