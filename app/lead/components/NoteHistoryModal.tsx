'use client';

import {
  App,
  Modal,
  Timeline,
  Empty,
  Typography,
  Tag,
  Input,
  Button,
  Flex,
  theme,
} from 'antd';
import { useState } from 'react';
import type { Lead } from '@/lib/services/lead.service';
import type { NoteItem } from '@/lib/supabase/types/tables/leads';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useUpdateLead } from '@/lib/hooks/use-leads';

interface NoteHistoryModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export function NoteHistoryModal({ open, lead, onClose }: NoteHistoryModalProps) {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [noteContent, setNoteContent] = useState('');
  // `lead` is a snapshot taken when the modal opened, so keep notes saved
  // from inside the modal locally to show them without closing it.
  const [savedNotes, setSavedNotes] = useState<NoteItem[] | null>(null);
  const updateLeadMutation = useUpdateLead();

  const notes: NoteItem[] = savedNotes ?? (Array.isArray(lead?.note) ? lead.note : []);
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const handleSubmit = () => {
    if (!lead || !noteContent.trim()) {
      message.warning('Vui lòng nhập nội dung ghi chú');
      return;
    }

    const updatedNotes: NoteItem[] = [
      ...notes,
      { content: noteContent.trim(), created_at: new Date().toISOString() },
    ];

    updateLeadMutation.mutate(
      { id: lead.id, input: { note: updatedNotes } },
      {
        onSuccess: () => {
          message.success('Thêm ghi chú thành công');
          setNoteContent('');
          setSavedNotes(updatedNotes);
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
          message.error(errorMessage);
        },
      },
    );
  };

  const handleClose = () => {
    setNoteContent('');
    setSavedNotes(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={`Ghi chú - ${lead?.full_name || ''}`}
      onCancel={handleClose}
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
              icon: <ClockCircleOutlined style={{ fontSize: 16 }} />,
              content: (
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

      <Flex vertical gap={8}>
        <Input.TextArea
          autoFocus
          rows={3}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Nhập nội dung ghi chú... (Enter để lưu, Shift + Enter để xuống dòng)"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Flex justify="flex-end">
          <Button
            type="primary"
            size="small"
            onClick={handleSubmit}
            loading={updateLeadMutation.isPending}
            disabled={!noteContent.trim()}
          >
            Lưu
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
}
