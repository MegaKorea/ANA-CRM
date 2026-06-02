'use client';

import { Modal, Descriptions, Timeline, Tag, Typography, Empty } from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import {
  LeadPageText,
  formatLocationValue,
  formatLocationValueV2,
  getZaloChatUrl,
} from '@/app/lead/constants';
import type { LocationValue } from '@/components/common/LocationSelect';
import type { LocationValueV2 } from '@/components/common/LocationSelectV2';
import type { NoteItem } from '@/lib/supabase/types/tables/leads';
import { ClockCircleOutlined } from '@ant-design/icons';
import { JSX } from 'react';

interface LeadDetailModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export function LeadDetailModal({ open, lead, onClose }: LeadDetailModalProps): JSX.Element | null {
  if (!lead) {
    return null;
  }

  const placeOfBirth = lead.place_of_birth as LocationValue | null | undefined;
  const placeOfOrigin = lead.place_of_origin as LocationValue | null | undefined;
  const currentAddress = lead.current_address as LocationValue | null | undefined;
  const currentAddressTemp = lead.current_address_temp as LocationValueV2 | null | undefined;
  const notes: NoteItem[] = Array.isArray(lead.note) ? lead.note : [];
  const zaloChatUrl = getZaloChatUrl(lead.pid_zalo);
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <Modal
      open={open}
      title={LeadPageText.MODAL_DETAIL_TITLE}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label={LeadPageText.COLUMN_PLACE_OF_BIRTH}>
          {formatLocationValue(placeOfBirth) || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={LeadPageText.COLUMN_PLACE_OF_ORIGIN}>
          {formatLocationValue(placeOfOrigin) || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={LeadPageText.COLUMN_CURRENT_ADDRESS}>
          {/* Ưu tiên field mới (new API), fallback về field cũ */}
          {formatLocationValueV2(currentAddressTemp) || formatLocationValue(currentAddress) || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={LeadPageText.COLUMN_CITIZEN_ID}>
          {lead.citizen_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="PID Zalo">
          {zaloChatUrl ? (
            <Typography.Link href={zaloChatUrl} target="_blank" rel="noreferrer">
              {lead.pid_zalo}
            </Typography.Link>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label={LeadPageText.COLUMN_NATIONALITY}>
          {lead.nationality || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={LeadPageText.COLUMN_ETHNICITY}>
          {lead.ethnicity || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={LeadPageText.COLUMN_NOTE}>
          {sortedNotes.length === 0 ? (
            <Empty description="Chưa có ghi chú nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <Timeline
                items={sortedNotes.map((note, index) => ({
                  dot: <ClockCircleOutlined style={{ fontSize: 14 }} />,
                  children: (
                    <div key={index}>
                      <Tag color="blue" style={{ fontSize: 11, marginBottom: 4 }}>
                        {new Date(note.created_at).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Tag>
                      <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {note.content}
                      </Typography.Paragraph>
                    </div>
                  ),
                }))}
              />
            </div>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}
