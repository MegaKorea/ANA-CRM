import type { CSSProperties } from 'react';
import { Tag } from 'antd';
import { FiGlobe, FiMail, FiPhone, FiFacebook, FiMoreHorizontal } from 'react-icons/fi';
import { SmaxIcon } from '@/app/lead/components/SmaxIcon';
import { AttendanceStatus, LeadSource, LeadStatus } from '@/constants/enums';
import type { LocationValue } from '@/components/common/LocationSelect';
import type { LocationValueV2 } from '@/components/common/LocationSelectV2';
import { isSafeHttpUrl } from '@/lib/utils/openInNewTab';
import { formatSmaxTagLabel } from '@/lib/smax/tag-labels';
import type { Lead } from '@/lib/services/lead.service';

const ZALO_CHAT_URL_BASE =
  'https://smax.ai/bizs/ana-beauty-academy/chats/zlw555884932030283040';

export enum LeadPagePadding {
  CONTAINER = 24,
}

export enum LeadPageMargin {
  HEADER_BOTTOM = 16,
}

export enum LeadPageGap {
  ACTIONS = 8,
}

export enum LeadDateUnit {
  DAY = 'day',
}

export enum LeadTableColumnWidth {
  ID = 80,
  ACTION = 100,
  DETAIL = 150,
}

export enum LeadActionIconSize {
  DEFAULT = 20,
}

export enum LeadSourceIconSize {
  DEFAULT = 16,
}

export const LeadPageText = {
  TITLE: 'Quản lý Data',
  BUTTON_REFRESH: 'Làm mới',
  BUTTON_CREATE: 'Thêm Data',
  COLUMN_ID: 'ID',
  COLUMN_FULL_NAME: 'Họ và tên',
  COLUMN_EMAIL: 'Email',
  COLUMN_PHONE_NUMBER: 'Số điện thoại',
  COLUMN_DATE_OF_BIRTH: 'Năm sinh',
  COLUMN_PLACE_OF_BIRTH: 'Nơi sinh',
  COLUMN_PLACE_OF_ORIGIN: 'Quê quán',
  COLUMN_CURRENT_ADDRESS: 'Địa chỉ hiện tại',
  COLUMN_CITIZEN_ID: 'CMND/CCCD',
  COLUMN_NATIONALITY: 'Quốc tịch',
  COLUMN_ETHNICITY: 'Dân tộc',
  COLUMN_SOURCE: 'Nguồn',
  COLUMN_STATUS: 'Trạng thái',
  COLUMN_NOTE: 'Ghi chú',
  COLUMN_CREATED_AT: 'Ngày tạo',

  COLUMN_APPOINTMENT_DATE: 'Lịch hẹn',
  COLUMN_ACTION: 'Thao tác',
  COLUMN_DETAIL: 'Thông tin thêm',
  COLUMN_IMAGES: 'Hình ảnh',
  FILTER_CREATED_AT_START: 'Ngày tạo từ',
  FILTER_CREATED_AT_END: 'Ngày tạo đến',
  MODAL_CREATE_TITLE: 'Thêm Data',
  MODAL_DETAIL_TITLE: 'Thông tin chi tiết',
  MODAL_EDIT_TITLE: 'Chỉnh sửa Data',
  FIELD_FULL_NAME_LABEL: 'Họ và tên',
  FIELD_FULL_NAME_PLACEHOLDER: 'Nhập họ và tên',
  FIELD_EMAIL_LABEL: 'Email',
  FIELD_EMAIL_PLACEHOLDER: 'Nhập email',
  FIELD_PHONE_NUMBER_LABEL: 'Số điện thoại',
  FIELD_PHONE_NUMBER_PLACEHOLDER: 'Nhập số điện thoại',
  FIELD_DATE_OF_BIRTH_LABEL: 'Năm sinh',
  FIELD_DATE_OF_BIRTH_PLACEHOLDER: 'Chọn năm sinh',
  FIELD_PLACE_OF_BIRTH_LABEL: 'Nơi sinh',
  FIELD_PLACE_OF_BIRTH_PLACEHOLDER: 'Nhập nơi sinh',
  FIELD_PLACE_OF_ORIGIN_LABEL: 'Quê quán',
  FIELD_PLACE_OF_ORIGIN_PLACEHOLDER: 'Nhập quê quán',
  FIELD_CURRENT_ADDRESS_LABEL: 'Địa chỉ hiện tại',
  FIELD_CURRENT_ADDRESS_PLACEHOLDER: 'Nhập địa chỉ hiện tại',
  FIELD_CITIZEN_ID_LABEL: 'CMND/CCCD',
  FIELD_CITIZEN_ID_PLACEHOLDER: 'Nhập CMND/CCCD',
  FIELD_NATIONALITY_LABEL: 'Quốc tịch',
  FIELD_NATIONALITY_PLACEHOLDER: 'Nhập quốc tịch',
  FIELD_ETHNICITY_LABEL: 'Dân tộc',
  FIELD_ETHNICITY_PLACEHOLDER: 'Nhập dân tộc',
  FIELD_SOURCE_LABEL: 'Nguồn',
  FIELD_SOURCE_PLACEHOLDER: 'Nhập nguồn',
  FIELD_STATUS_LABEL: 'Trạng thái',
  FIELD_STATUS_PLACEHOLDER: 'Chọn trạng thái',
  FIELD_NOTE_LABEL: 'Ghi chú',
  FIELD_NOTE_PLACEHOLDER: 'Nhập ghi chú',
  FIELD_COURSE_IDS_LABEL: 'Khóa học quan tâm',
  FIELD_COURSE_IDS_PLACEHOLDER: 'Chọn khóa học',
  ACTION_EDIT: 'Sửa',
  ACTION_DELETE: 'Xóa',
  DELETE_TITLE: 'Xóa Data',
  DELETE_DESCRIPTION: 'Bạn có chắc chắn muốn xóa khách hàng tiềm năng này?',
  DELETE_OK_TEXT: 'Xóa',
  DELETE_CANCEL_TEXT: 'Hủy',
  SUCCESS_CREATE: 'Tạo khách hàng tiềm năng thành công',
  SUCCESS_UPDATE: 'Cập nhật Data thành công',
  SUCCESS_DELETE: 'Xóa Data thành công',
  SUCCESS_REFRESH: 'Đã làm mới danh sách Data',
  ERROR_GENERIC: 'Có lỗi xảy ra',
  COURSE_IDS_LABEL: 'Khóa học quan tâm',
} as const;

export const LeadSourceLabel = {
  [LeadSource.WEBSITE]: 'Website',
  [LeadSource.EMAIL]: 'Email',
  [LeadSource.PHONE]: 'Số điện thoại',
  [LeadSource.FACEBOOK]: 'Facebook',
  [LeadSource.SMAX]: 'Smax',
  [LeadSource.OTHER]: 'Khác',
} as const;

export const LeadSourceIcon = {
  [LeadSource.WEBSITE]: <FiGlobe size={LeadSourceIconSize.DEFAULT} />,
  [LeadSource.EMAIL]: <FiMail size={LeadSourceIconSize.DEFAULT} />,
  [LeadSource.PHONE]: <FiPhone size={LeadSourceIconSize.DEFAULT} />,
  [LeadSource.FACEBOOK]: <FiFacebook size={LeadSourceIconSize.DEFAULT} />,
  [LeadSource.SMAX]: <SmaxIcon size={LeadSourceIconSize.DEFAULT} />,
  [LeadSource.OTHER]: <FiMoreHorizontal size={LeadSourceIconSize.DEFAULT} />,
} as const;

export const LeadDateRangePlaceholder = [
  LeadPageText.FILTER_CREATED_AT_START,
  LeadPageText.FILTER_CREATED_AT_END,
] as const;

export const AttendanceStatusLabel = {
  [AttendanceStatus.ARRIVED]: 'Đã đến',
  [AttendanceStatus.NOT_ARRIVED]: 'Chưa đến',
  [AttendanceStatus.NO_SHOW]: 'Bom',
} as const;

export function formatLocationValue(location: LocationValue | null | undefined): string {
  if (!location) {
    return '';
  }
  const parts: string[] = [];
  if (location.ward?.name) {
    parts.push(location.ward.name);
  }
  if (location.district?.name) {
    parts.push(location.district.name);
  }
  if (location.province?.name) {
    parts.push(location.province.name);
  }
  return parts.join(', ') || '';
}

export function formatLocationValueV2(location: LocationValueV2 | null | undefined): string {
  if (!location) {
    return '';
  }
  const parts: string[] = [];
  if (location.ward?.name) {
    parts.push(location.ward.name);
  }
  if (location.district?.name) {
    parts.push(location.district.name);
  }
  if (location.province?.name) {
    parts.push(location.province.name);
  }
  return parts.join(', ') || '';
}

export function getZaloChatUrl(pidZalo: string | null | undefined): string | undefined {
  const trimmedPid = pidZalo?.trim();

  if (!trimmedPid) {
    return undefined;
  }

  return `${ZALO_CHAT_URL_BASE}?tid=zlw${encodeURIComponent(trimmedPid)}`;
}

export function getSmaxThreadUrl(smaxLog: unknown): string | undefined {
  if (!smaxLog || typeof smaxLog !== 'object') {
    return undefined;
  }
  const url = (smaxLog as Record<string, unknown>).thread_url;
  return typeof url === 'string' && isSafeHttpUrl(url) ? url : undefined;
}

const FACEBOOK_PROFILE_HOSTS = ['facebook.com', 'fb.com', 'm.me', 'messenger.com'];

const SMAX_SCAN_MAX_DEPTH = 3;

// Smax's `facebook.id` is a Messenger PSID (page-scoped id), not the customer's
// public profile id — it cannot be turned into a facebook.com/{id} link. Only
// `facebook.conversation_link` (a same-origin path into the page's own FB inbox)
// is a link we can actually build and trust.
function toAbsoluteFacebookUrl(path: string): string | undefined {
  const trimmed = path.trim();
  if (!trimmed) return undefined;
  const absolute = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://www.facebook.com${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  return isFacebookProfileUrl(absolute) ? absolute : undefined;
}

function isFacebookProfileUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !isSafeHttpUrl(value)) {
    return false;
  }

  let hostname: string;
  try {
    hostname = new URL(value.trim()).hostname.toLowerCase();
  } catch {
    return false;
  }

  if (hostname.startsWith('graph.')) {
    return false;
  }

  return FACEBOOK_PROFILE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export function getSmaxFacebookUrl(smaxLog: unknown): string | undefined {
  if (!smaxLog || typeof smaxLog !== 'object') {
    return undefined;
  }

  const threadUrl = getSmaxThreadUrl(smaxLog);
  const queue: { node: object; depth: number }[] = [{ node: smaxLog, depth: 0 }];

  while (queue.length > 0) {
    const { node, depth } = queue.shift() as { node: object; depth: number };

    for (const value of Object.values(node)) {
      if (isFacebookProfileUrl(value) && value.trim() !== threadUrl) {
        return value.trim();
      }

      if (value && typeof value === 'object' && depth < SMAX_SCAN_MAX_DEPTH) {
        queue.push({ node: value as object, depth: depth + 1 });
      }
    }
  }

  const facebook = (smaxLog as Record<string, unknown>).facebook;
  const conversationLink =
    facebook && typeof facebook === 'object'
      ? (facebook as Record<string, unknown>).conversation_link
      : undefined;

  return typeof conversationLink === 'string' ? toAbsoluteFacebookUrl(conversationLink) : undefined;
}

export function getLeadFacebookUrl(lead: Lead): string | undefined {
  if (isSafeHttpUrl(lead.facebook_url)) {
    return lead.facebook_url.trim();
  }
  return getSmaxFacebookUrl(lead.smax_log);
}

export interface SmaxTag {
  id?: string;
  name?: string;
  time?: string;
  alias?: string;
}

export function getSmaxTags(smaxLog: unknown): SmaxTag[] {
  if (!smaxLog || typeof smaxLog !== 'object') {
    return [];
  }
  const tags = (smaxLog as Record<string, unknown>).tags;
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter((item): item is SmaxTag => {
    if (!item || typeof item !== 'object') return false;
    const tag = item as SmaxTag;
    const hasName = typeof tag.name === 'string' && tag.name.trim().length > 0;
    const hasAlias = typeof tag.alias === 'string' && tag.alias.trim().length > 0;
    const hasId = typeof tag.id === 'string' && tag.id.trim().length > 0;
    return hasName || hasAlias || hasId;
  });
}

const SMAX_TAG_PRESET_COLORS = [
  'blue',
  'green',
  'gold',
  'purple',
  'magenta',
  'cyan',
  'orange',
  'volcano',
  'geekblue',
  'lime',
] as const;

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'default',
  [LeadStatus.NOT_CONTACTED]: 'purple',
  [LeadStatus.INTERESTED]: 'magenta',
  [LeadStatus.NOT_INTERESTED]: 'volcano',
  [LeadStatus.NURTURING]: 'orange',
  [LeadStatus.CONVERTED]: 'green',
  [LeadStatus.REJECT]: 'red',
  [LeadStatus.LOW_INTERACTION]: 'gold',
  [LeadStatus.OTHER]: 'default',
};

export function getLeadStatusColor(status: string | null | undefined): string {
  if (!status) return 'default';
  return LEAD_STATUS_COLORS[status as LeadStatus] ?? 'default';
}

export function getSmaxTagColor(tagName: string): string {
  if (!tagName) return 'default';
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SMAX_TAG_PRESET_COLORS.length;
  return SMAX_TAG_PRESET_COLORS[index];
}

export function renderSmaxTagList(tags: SmaxTag[], tagStyle?: CSSProperties) {
  return tags.map((tag, idx) => {
    const rawName = tag.name || tag.alias;
    if (!rawName) return null;
    const label = formatSmaxTagLabel(rawName);
    return (
      <Tag key={tag.id || idx} color={getSmaxTagColor(label)} variant="solid" style={tagStyle}>
        {label}
      </Tag>
    );
  });
}

export const Ethnicity = [
  'Kinh',
  'Tày',
  'Thái',
  'Hoa',
  'Khmer',
  'Mường',
  'Nùng',
  "H'Mông",
  'Dao',
  'Gia Rai',
  'Ê Đê',
  'Ba Na',
  'Sán Chay',
  'Chăm',
  'Cơ Ho',
  'Xơ Đăng',
  'Sán Dìu',
  'Hrê',
  'Ra Glai',
  'Mnông',
  'Thổ',
  'Xtiêng',
  'Khơ Mú',
  'Bru - Vân Kiều',
  'Cơ Tu',
  'Giáy',
  'Tà Ôi',
  'Mạ',
  'Giẻ Triêng',
  'Co',
  'Chơ Ro',
  'Xinh Mun',
  'Hà Nhì',
  'Chu Ru',
  'Lào',
  'La Chí',
  'La Ha',
  'Phù Lá',
  'La Hủ',
  'Lự',
  'Lô Lô',
  'Chứt',
  'Mảng',
  'Pà Thẻn',
  'Co Lao',
  'Cống',
  'Bố Y',
  'Si La',
  'Pu Péo',
  'Rơ Măm',
  'Brâu',
  'Ơ Đu',
] as const;
