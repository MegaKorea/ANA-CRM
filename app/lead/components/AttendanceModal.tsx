import React, { useState } from 'react';
import { App, Modal, Radio, Space } from 'antd';
import { CheckCircleTwoTone, ClockCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { AttendanceStatus } from '@/constants/enums';
import type { Lead } from '@/lib/services/lead.service';
import { useUpdateLead } from '@/lib/hooks/use-leads';
import styles from './attendanceModal.module.scss';

interface AttendanceModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export function AttendanceModal({ open, lead, onClose }: AttendanceModalProps) {
  const { message } = App.useApp();
  const [prevLeadId, setPrevLeadId] = useState<number | null>(null);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const updateLeadMutation = useUpdateLead();

  if (open && lead && lead.id !== prevLeadId) {
    setPrevLeadId(lead.id);
    setStatus(lead.attendance_status || AttendanceStatus.NOT_ARRIVED);
  }

  const handleSave = () => {
    if (!lead || !status) return;

    updateLeadMutation.mutate(
      {
        id: lead.id,
        input: { attendance_status: status },
      },
      {
        onSuccess: () => {
          message.success('Cập nhật trạng thái điểm danh thành công');
          onClose();
        },
        onError: () => {
          message.error('Có lỗi xảy ra khi cập nhật trạng thái');
        },
      },
    );
  };

  return (
    <Modal
      title="Cập nhật trạng thái điểm danh"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="Lưu lại"
      cancelText="Hủy"
      confirmLoading={updateLeadMutation.isPending}
      centered
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>Khách hàng:</span>
          <span className={styles.name}>{lead?.full_name}</span>
        </div>
        <div>
          <Radio.Group onChange={(e) => setStatus(e.target.value)} value={status}>
            <Space orientation="vertical" size="middle">
              <Radio value={AttendanceStatus.ARRIVED}>
                <Space>
                  <CheckCircleTwoTone twoToneColor="#52c41a" />
                  <span className={styles.successText}>Đã đến</span>
                </Space>
              </Radio>
              <Radio value={AttendanceStatus.NOT_ARRIVED}>
                <Space>
                  <ClockCircleTwoTone twoToneColor="#faad14" />
                  <span className={styles.warningText}>Chưa đến</span>
                </Space>
              </Radio>
              <Radio value={AttendanceStatus.NO_SHOW}>
                <Space>
                  <CloseCircleTwoTone twoToneColor="#ff4d4f" />
                  <span className={styles.dangerText}>Bom</span>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      </div>
    </Modal>
  );
}
