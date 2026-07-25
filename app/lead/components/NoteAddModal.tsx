'use client';

import { App, Modal, Input } from 'antd';
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
  const { message } = App.useApp();
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
      title={
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
          Thêm ghi chú <span style={{ color: '#6b7280', fontWeight: 400 }}>- {lead?.full_name || ''}</span>
        </div>
      }
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={updateLeadMutation.isPending}
      centered
      destroyOnHidden
      width={600}
      styles={{
        body: { padding: '24px' },
        header: { marginBottom: '16px' }
      }}
    >
      <Input.TextArea
        rows={5}
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Nhập nội dung ghi chú... (Nhấn phím Enter để lưu, Shift + Enter để xuống dòng)"
        style={{
          marginTop: 8,
          padding: '16px',
          borderRadius: '12px',
          fontSize: '15px',
          color: '#374151',
          lineHeight: 1.6,
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}
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
