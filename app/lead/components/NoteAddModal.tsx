'use client';

import { Modal, Input, message } from 'antd';
import { useState } from 'react';
import type { Lead } from '@/lib/services/lead.service';
import type { NoteItem } from '@/lib/supabase/types/tables/leads';
import { useUpdateLead } from '@/lib/hooks/use-leads';

interface NoteAddModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export function NoteAddModal({ open, lead, onClose }: NoteAddModalProps) {
  const [noteContent, setNoteContent] = useState('');
  const updateLeadMutation = useUpdateLead();

  const handleSubmit = () => {
    if (!lead || !noteContent.trim()) {
      message.warning('Vui lòng nhập nội dung ghi chú');
      return;
    }

    const existingNotes: NoteItem[] = Array.isArray(lead.note) ? lead.note : [];
    const newNote: NoteItem = {
      content: noteContent.trim(),
      created_at: new Date().toISOString(),
    };

    const updatedNotes = [...existingNotes, newNote];

    updateLeadMutation.mutate(
      {
        id: lead.id,
        input: { note: updatedNotes },
      },
      {
        onSuccess: () => {
          message.success('Thêm ghi chú thành công');
          setNoteContent('');
          onClose();
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
    onClose();
  };

  return (
    <Modal
      open={open}
      title={`Thêm ghi chú - ${lead?.full_name || ''}`}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={updateLeadMutation.isPending}
      centered
      destroyOnClose
    >
      <Input.TextArea
        rows={4}
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Nhập nội dung ghi chú... (Enter để lưu, Shift+Enter để xuống dòng)"
        style={{ marginTop: 16 }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
    </Modal>
  );
}
