import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { REPORTS_ACCESS_ROLES } from '@/constants/reports';
import { AppError } from '@/errors';
import type { CurrentUser } from '@/lib/services/auth.service';
import { getCurrentUser } from '@/lib/services/auth.service';
import { isIsoDate } from '@/lib/utils/vn-date';

const ALLOWED_ROLES = new Set<string>(REPORTS_ACCESS_ROLES);

export async function requireReportsAccess(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user.roleCode || !ALLOWED_ROLES.has(user.roleCode)) {
    throw new AppError(
      'FORBIDDEN',
      HttpStatusCode.FORBIDDEN,
      'Không có quyền xem báo cáo',
    );
  }
  return user;
}

export function parseReportsDateRange(requestUrl: URL): {
  startDate: string;
  endDate: string;
} {
  const startDate = requestUrl.searchParams.get('startDate')?.trim() ?? '';
  const endDate = requestUrl.searchParams.get('endDate')?.trim() ?? '';

  if (!startDate || !endDate) {
    throw new AppError(
      LeadErrorCode.BAD_REQUEST,
      HttpStatusCode.BAD_REQUEST,
      'Thiếu startDate hoặc endDate',
    );
  }

  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    throw new AppError(
      LeadErrorCode.BAD_REQUEST,
      HttpStatusCode.BAD_REQUEST,
      'Ngày phải dạng YYYY-MM-DD',
    );
  }

  if (startDate > endDate) {
    throw new AppError(
      LeadErrorCode.BAD_REQUEST,
      HttpStatusCode.BAD_REQUEST,
      'startDate phải nhỏ hơn hoặc bằng endDate',
    );
  }

  return { startDate, endDate };
}
