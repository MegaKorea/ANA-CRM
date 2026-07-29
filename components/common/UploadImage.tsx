'use client';

import { useEffect, useMemo, useState } from 'react';
import { App, Button, Upload, Image } from 'antd';
import {
  InboxOutlined,
  LoadingOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { fetchJson } from '@/lib/utils/fetchJson';

const { Dragger } = Upload;

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  server?: string;
  value?: string;
  showPreview?: boolean;
  showSuccessMessage?: boolean;
}

export default function ImageUpload({
  onUpload,
  onRemove,
  label = 'Kéo thả ảnh vào đây hoặc nhấp để chọn',
  server = 'server_1',
  value,
  showPreview = true,
  showSuccessMessage = true,
}: ImageUploadProps) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(value || null);

  useEffect(() => {
    setImageUrl(value || null);
  }, [value]);

  const uploadProps: UploadProps = useMemo(() => ({
    name: 'file',
    multiple: false,
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ chấp nhận file ảnh!');
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('Ảnh phải nhỏ hơn 10MB!');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file as File);
        formData.append('server', server);

        const result = await fetchJson<{
          success: boolean;
          data: { url: string };
          error?: { message?: string };
        }>('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!result.success) {
          throw new Error(result.error?.message || 'Upload thất bại');
        }

        const url = result.data.url;
        if (showPreview) setImageUrl(url);
        onUpload(url);
        if (showSuccessMessage) message.success('Upload ảnh thành công!');
        onSuccess?.(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload thất bại';
        message.error(errorMessage);
        onError?.(error as Error);
      } finally {
        setLoading(false);
      }
    },
  }), [onUpload, server, showPreview, showSuccessMessage, message]);

  return (
    <div>
      <Dragger {...uploadProps} disabled={loading}>
        <p className="ant-upload-drag-icon">
          {loading ? (
            <LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          ) : (
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          )}
        </p>
        <p className="ant-upload-text">
          {loading ? 'Đang upload...' : label}
        </p>
        <p className="ant-upload-hint">
          Hỗ trợ upload một ảnh. Kích thước tối đa 10MB
        </p>
      </Dragger>
      {imageUrl && (
        <div
          style={{
            marginTop: 16,
            position: "relative",
            display: "inline-block",
            width: "100%",
          }}
        >
          <Image
            src={imageUrl}
            alt="Preview"
            width="100%"
            style={{
              maxHeight: 200,
              objectFit: "contain",
              borderRadius: 4,
              display: "block",
            }}
          />
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setImageUrl(null);
              onRemove?.();
            }}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 10,
            }}
          >
            Xóa
          </Button>
        </div>
      )}
    </div>
  );
}
