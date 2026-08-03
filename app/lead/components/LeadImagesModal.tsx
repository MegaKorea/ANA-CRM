import { useState } from 'react';
import { App, Empty, Modal, Image, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { Lead } from '@/lib/services/lead.service';
import UploadImage from '@/components/common/UploadImage';
import { useUpdateLead } from '@/lib/hooks/use-leads';

interface LeadImagesModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export function LeadImagesModal({ open, lead, onClose }: LeadImagesModalProps) {
  const { message } = App.useApp();
  const updateLeadMutation = useUpdateLead();
  const [prevLeadId, setPrevLeadId] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState<string[]>([]);

  if (open && lead && lead.id !== prevLeadId) {
    setPrevLeadId(lead.id);
    setLocalImages(lead.images || []);
  }

  const handleUpload = (url: string) => {
    if (!lead) return;
    const newImages = [...localImages, url];
    setLocalImages(newImages);

    updateLeadMutation.mutate(
      {
        id: lead.id,
        input: { images: newImages },
      },
      {
        onSuccess: () => {
          message.success('Thêm ảnh thành công!');
        },
        onError: (error) => {
          message.error(error instanceof Error ? error.message : 'Lỗi khi thêm ảnh');
        },
      },
    );
  };

  const handleRemove = (urlToRemove: string) => {
    if (!lead) return;
    const newImages = localImages.filter((url) => url !== urlToRemove);
    setLocalImages(newImages);

    updateLeadMutation.mutate(
      {
        id: lead.id,
        input: { images: newImages },
      },
      {
        onSuccess: () => {
          message.success('Xóa ảnh thành công!');
        },
        onError: (error) => {
          message.error(error instanceof Error ? error.message : 'Lỗi khi xóa ảnh');
        },
      },
    );
  };

  return (
    <Modal
      title="Hình ảnh"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={600}
    >
      <div style={{ marginBottom: 24 }}>
        <UploadImage
          onUpload={handleUpload}
          label="Tải ảnh lên (có thể tải nhiều lần)"
          server="server_1"
          showPreview={false}
          showSuccessMessage={false}
        />
      </div>

      {localImages.length === 0 ? (
        <Empty description="Chưa có hình ảnh" />
      ) : (
        <div
          role="list"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
        >
          {localImages.map((url) => (
          <div role="listitem" key={url}>
            <div style={{ position: 'relative' }}>
              <Image
                src={url}
                alt="Lead Image"
                style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }}
              />
              <Popconfirm
                title="Xóa ảnh"
                description="Bạn có chắc chắn muốn xóa ảnh này?"
                onConfirm={() => handleRemove(url)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  size="small"
                  style={{ position: 'absolute', top: 8, right: 8 }}
                />
              </Popconfirm>
            </div>
          </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
