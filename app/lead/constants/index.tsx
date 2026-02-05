import { Button, Popconfirm, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HiOutlinePencilAlt, HiOutlineTrash, HiOutlineInformationCircle } from 'react-icons/hi';
import { DateLocale, LeadSource, LeadStatus } from '@/constants/enums';
import type { Lead } from '@/lib/services/lead.service';
import type { LocationValue } from '@/components/common/LocationSelect';
import { FiGlobe, FiMail, FiPhone, FiFacebook, FiMoreHorizontal } from 'react-icons/fi';

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
  ACTION = 180,
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
  COLUMN_DATE_OF_BIRTH: 'Ngày sinh',
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
  COLUMN_ACTION: 'Thao tác',
  COLUMN_DETAIL: 'Thông tin thêm',
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
  FIELD_DATE_OF_BIRTH_LABEL: 'Ngày sinh',
  FIELD_DATE_OF_BIRTH_PLACEHOLDER: 'Chọn ngày sinh',
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
} as const;

export const LeadStatusLabel = {
  [LeadStatus.NEW]: 'Mới',
  [LeadStatus.CONTACTED]: 'Đã liên hệ',
  [LeadStatus.QUALIFIED]: 'Đã đủ điều kiện',
  [LeadStatus.CONVERTED]: 'Đã chuyển đổi',
  [LeadStatus.LOST]: 'Rớt',
} as const;

export const LeadSourceLabel = {
  [LeadSource.WEBSITE]: 'Website',
  [LeadSource.EMAIL]: 'Email',
  [LeadSource.PHONE]: 'Số điện thoại',
  [LeadSource.FACEBOOK]: 'Facebook',
  [LeadSource.OTHER]: 'Khác',
} as const;

export const LeadSourceIcon = {
  [LeadSource.WEBSITE]: <FiGlobe size={LeadSourceIconSize.DEFAULT} />,
  [LeadSource.EMAIL]: <FiMail size={LeadSourceIconSize.DEFAULT} />,
  [LeadSource.PHONE]: <FiPhone size={LeadSourceIconSize.DEFAULT} />,
  [LeadSource.FACEBOOK]: <FiFacebook size={LeadSourceIconSize.DEFAULT} />,
  [LeadSource.OTHER]: <FiMoreHorizontal size={LeadSourceIconSize.DEFAULT} />,
} as const;

export const LeadDateRangePlaceholder = [
  LeadPageText.FILTER_CREATED_AT_START,
  LeadPageText.FILTER_CREATED_AT_END,
] as const;

export type HandleOpenLeadModal = (lead?: Lead) => void;

export type HandleDeleteLead = (id: number) => void;

export type HandleOpenLeadDetailModal = (lead: Lead) => void;

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

export const getLeadTableColumns = ({
  handleOpenModal,
  handleDelete,
  handleOpenDetailModal,
}: {
  handleOpenModal: HandleOpenLeadModal;
  handleDelete: HandleDeleteLead;
  handleOpenDetailModal: HandleOpenLeadDetailModal;
}): ColumnsType<Lead> => [
  {
    title: LeadPageText.COLUMN_ID,
    dataIndex: 'id',
    key: 'id',
    width: LeadTableColumnWidth.ID,
  },
  {
    title: LeadPageText.COLUMN_FULL_NAME,
    dataIndex: 'full_name',
    key: 'full_name',
  },
  {
    title: LeadPageText.COLUMN_EMAIL,
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: LeadPageText.COLUMN_PHONE_NUMBER,
    dataIndex: 'phone_number',
    key: 'phone_number',
  },
  {
    title: LeadPageText.COLUMN_DATE_OF_BIRTH,
    dataIndex: 'date_of_birth',
    key: 'date_of_birth',
    render: (date: string | null) =>
      date ? new Date(date).toLocaleDateString(DateLocale.VIET_NAM) : null,
  },
  {
    title: LeadPageText.COLUMN_CURRENT_ADDRESS,
    dataIndex: 'current_address',
    key: 'current_address',
    render: (address: LocationValue | null | undefined) => {
      const formatted = formatLocationValue(address);
      return formatted || null;
    },
  },
  {
    title: LeadPageText.COLUMN_STATUS,
    dataIndex: 'status',
    key: 'status',
    render: (status: string | null) => {
      if (!status) {
        return null;
      }
      return LeadStatusLabel[status as keyof typeof LeadStatusLabel] ?? status;
    },
  },
  {
    title: LeadPageText.COLUMN_SOURCE,
    dataIndex: 'source',
    key: 'source',
    render: (source: string | null) => {
      if (!source) {
        return null;
      }
      const icon = LeadSourceIcon[source as keyof typeof LeadSourceIcon];
      const label = LeadSourceLabel[source as keyof typeof LeadSourceLabel] ?? source;
      return (
        <Space size={LeadPageGap.ACTIONS}>
          {icon}
          {label}
        </Space>
      );
    },
  },
  {
    title: LeadPageText.COLUMN_CREATED_AT,
    dataIndex: 'created_at',
    key: 'created_at',
    render: (date: string | null) =>
      date ? new Date(date).toLocaleDateString(DateLocale.VIET_NAM) : null,
  },
  {
    title: LeadPageText.COLUMN_DETAIL,
    key: 'detail',
    align: 'center',
    width: LeadTableColumnWidth.DETAIL,
    render: (_: unknown, record: Lead) => (
      <Button onClick={() => handleOpenDetailModal(record)}>
        <HiOutlineInformationCircle size={LeadActionIconSize.DEFAULT} />
      </Button>
    ),
  },
  {
    title: LeadPageText.COLUMN_ACTION,
    key: 'action',
    align: 'center',
    fixed: 'right',
    width: LeadTableColumnWidth.ACTION,
    render: (_: unknown, record: Lead) => (
      <Space>
        <Button onClick={() => handleOpenModal(record)}>
          <HiOutlinePencilAlt size={LeadActionIconSize.DEFAULT} />
        </Button>
        <Popconfirm
          title={LeadPageText.DELETE_TITLE}
          description={LeadPageText.DELETE_DESCRIPTION}
          onConfirm={() => handleDelete(record.id)}
          okText={LeadPageText.DELETE_OK_TEXT}
          cancelText={LeadPageText.DELETE_CANCEL_TEXT}
        >
          <Button danger>
            <HiOutlineTrash size={LeadActionIconSize.DEFAULT} />
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];


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
