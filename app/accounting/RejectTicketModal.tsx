import { Input, Modal, Typography } from 'antd';

type Props = {
  open: boolean;
  reason: string;
  confirmLoading: boolean;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onOk: () => void;
};

export function RejectTicketModal({ open, reason, confirmLoading, onReasonChange, onCancel, onOk }: Props) {
  return (
    <Modal
      open={open}
      title="Từ chối phiếu thu"
      onCancel={onCancel}
      onOk={onOk}
      okText="Từ chối"
      okButtonProps={{ danger: true }}
      cancelText="Hủy"
      confirmLoading={confirmLoading}
    >
      <Typography.Paragraph>
        Vui lòng nhập lý do từ chối:
      </Typography.Paragraph>
      <Input.TextArea
        rows={3}
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Nhập lý do từ chối..."
      />
    </Modal>
  );
}
