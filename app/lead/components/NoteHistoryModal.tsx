'use client';

import { Modal, Timeline, Empty, Typography, Tag, theme } from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import type { NoteItem } from '@/lib/supabase/types/tables/leads';
import { ClockCircleOutlined } from '@ant-design/icons';

interface NoteHistoryModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export function NoteHistoryModal({ open, lead, onClose }: NoteHistoryModalProps) {
  const { token } = theme.useToken();
  const notes: NoteItem[] = Array.isArray(lead?.note) ? lead.note : [];

  // Sort notes by created_at descending (newest first)
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <Modal
      open={open}
      title={`Lịch sử ghi chú - ${lead?.full_name || ''}`}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      destroyOnHidden
    >
      {sortedNotes.length === 0 ? (
        <Empty description="Chưa có ghi chú nào" style={{ padding: '32px 0' }} />
      ) : (
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '16px 0' }}>
          <Timeline
            items={sortedNotes.map((note, index) => ({
              dot: <ClockCircleOutlined style={{ fontSize: 16 }} />,
              children: (
                <div key={index}>
                  <div style={{ marginBottom: 4 }}>
                    <Tag color="blue" style={{ fontSize: 12 }}>
                      {new Date(note.created_at).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Tag>
                  </div>
                  <Typography.Paragraph
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      background: token.colorFillAlter,
                      padding: '8px 12px',
                      borderRadius: token.borderRadius,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    {note.content}
                  </Typography.Paragraph>
                </div>
              ),
            }))}
          />
        </div>
      )}
    </Modal>
  );
}
