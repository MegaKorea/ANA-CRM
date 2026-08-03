import { AppError } from '@/errors';
import {
  HttpStatusCode,
  UploadErrorCode,
  UploadImageLimit,
  UploadImageRejectMessage,
  UploadImageRejectReason,
} from '@/constants/enums';
import { fetchJson } from '@/lib/utils/fetchJson';

export type UploadedImage = {
  name: string;
  url: string;
  mime_type: string;
  size: number | null;
};

export function getImageUploadRejectReason(file: File): UploadImageRejectReason | null {
  if (!file.type.startsWith('image/')) {
    return UploadImageRejectReason.TYPE_INVALID;
  }
  if (file.size >= UploadImageLimit.MAX_MB * UploadImageLimit.BYTES_PER_MB) {
    return UploadImageRejectReason.SIZE_EXCEEDED;
  }
  return null;
}

export function getImageUploadRejectMessage(reason: UploadImageRejectReason): string {
  if (reason === UploadImageRejectReason.TYPE_INVALID) {
    return UploadImageRejectMessage.TYPE_INVALID;
  }
  return UploadImageRejectMessage.SIZE_EXCEEDED;
}

export async function uploadSessionImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('server', 'server_1');

  const result = await fetchJson<{
    success: boolean;
    data: { url: string };
    error?: { message?: string };
  }>('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!result.success || !result.data?.url) {
    throw new AppError(
      UploadErrorCode.FAILED,
      HttpStatusCode.BAD_REQUEST,
      result.error?.message || UploadErrorCode.FAILED,
    );
  }

  return {
    name: file.name || 'image',
    url: result.data.url,
    mime_type: file.type || 'image/*',
    size: file.size ?? null,
  };
}
