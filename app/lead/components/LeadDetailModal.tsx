'use client';

import { Modal, Descriptions } from 'antd';
import type { Lead } from '@/lib/services/lead.service';
import { LeadPageText, formatLocationValue } from '@/app/lead/constants';
import type { LocationValue } from '@/components/common/LocationSelect';
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
          {formatLocationValue(currentAddress) || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={LeadPageText.COLUMN_CITIZEN_ID}>
          {lead.citizen_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={LeadPageText.COLUMN_NATIONALITY}>
          {lead.nationality || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={LeadPageText.COLUMN_ETHNICITY}>
          {lead.ethnicity || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={LeadPageText.COLUMN_NOTE}>
          {lead.note || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}
