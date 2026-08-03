import { AppError } from '@/errors';
import { AllowedUrlProtocol, HttpStatusCode, LectureErrorCode } from '@/constants/enums';

export function assertAllowedHttpUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AppError(LectureErrorCode.INVALID_LINK_URL, HttpStatusCode.BAD_REQUEST);
  }
  if (
    parsed.protocol !== AllowedUrlProtocol.HTTP &&
    parsed.protocol !== AllowedUrlProtocol.HTTPS
  ) {
    throw new AppError(LectureErrorCode.INVALID_LINK_URL, HttpStatusCode.BAD_REQUEST);
  }
  return parsed;
}

export function isAllowedHttpUrl(url: string): boolean {
  try {
    assertAllowedHttpUrl(url);
    return true;
  } catch {
    return false;
  }
}
