import { Button, Popconfirm, Space, Tooltip, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HiOutlinePencilAlt, HiOutlineTrash, HiOutlineInformationCircle } from 'react-icons/hi';
import {
  PlusOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  CloseCircleTwoTone,
  MessageOutlined,
  FacebookOutlined,
  DollarOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import type { Lead } from '@/lib/services/lead.service';
import { AttendanceStatus, DateLocale, LeadSource, LeadStatus } from '@/constants/enums';
import type { Course } from '@/lib/services/course.service';
import type { LocationValue } from '@/components/common/LocationSelect';
import type { LocationValueV2 } from '@/components/common/LocationSelectV2';
import type { NoteItem } from '@/lib/supabase/types/tables/leads';
import { FiGlobe, FiMail, FiPhone, FiFacebook, FiMoreHorizontal } from 'react-icons/fi';
import { formatNumberVi } from '@/lib/utils/numberFormat';
import { AssignTelesales } from '@/app/lead/components/AssignTelesales';

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

export const LeadStatusLabel = {
  [LeadStatus.NEW]: 'MỚI',
  [LeadStatus.CONVERTED]: 'ĐÃ ĐĂNG KÍ',
  [LeadStatus.NOT_CONTACTED]: 'CHƯA TIẾP CẬN',
  [LeadStatus.REJECT]: 'TỪ CHỐI',
  [LeadStatus.INTERESTED]: 'QUAN TÂM',
  [LeadStatus.NOT_INTERESTED]: 'KHÔNG QUAN TÂM',
  [LeadStatus.OTHER]: 'KHÁC',
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

export const AttendanceStatusLabel = {
  [AttendanceStatus.ARRIVED]: 'Đã đến',
  [AttendanceStatus.NOT_ARRIVED]: 'Chưa đến',
  [AttendanceStatus.NO_SHOW]: 'Bom',
} as const;

export type HandleOpenAttendanceModal = (lead: Lead) => void;

export type HandleOpenLeadModal = (lead?: Lead) => void;

export type HandleDeleteLead = (id: number) => void;

export type HandleOpenLeadDetailModal = (lead: Lead) => void;

export type HandleOpenNoteAddModal = (lead: Lead) => void;

export type HandleOpenNoteHistoryModal = (lead: Lead) => void;

export type HandleOpenImagesModal = (lead: Lead) => void;

export type HandleOpenConversationModal = (lead: Lead) => void;

export type HandleOpenPaymentTicketModal = (lead: Lead) => void;

export type HandleOpenPaymentHistoryModal = (lead: Lead) => void;

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

/**
 * Render a location selected from the NEW provinces.open-api.vn API (LocationValueV2).
 * Falls back gracefully so existing data using the old structure still works.
 */
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

export const getLeadTableColumns = ({
  handleOpenModal,
  handleDelete,
  handleOpenDetailModal,
  handleOpenNoteAddModal,
  handleOpenNoteHistoryModal,
  handleOpenImagesModal,
  handleOpenAttendanceModal,
  handleOpenConversationModal,
  handleOpenPaymentTicketModal,
  handleOpenPaymentHistoryModal,
  courses,
}: {
  handleOpenModal: HandleOpenLeadModal;
  handleDelete: HandleDeleteLead;
  handleOpenDetailModal: HandleOpenLeadDetailModal;
  handleOpenNoteAddModal: HandleOpenNoteAddModal;
  handleOpenNoteHistoryModal: HandleOpenNoteHistoryModal;
  handleOpenImagesModal: HandleOpenImagesModal;
  handleOpenAttendanceModal: HandleOpenAttendanceModal;
  handleOpenConversationModal: HandleOpenConversationModal;
  handleOpenPaymentTicketModal: HandleOpenPaymentTicketModal;
  handleOpenPaymentHistoryModal: HandleOpenPaymentHistoryModal;
  courses?: Course[] | null;
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
    // {
    //   title: LeadPageText.COLUMN_EMAIL,
    //   dataIndex: 'email',
    //   key: 'email',
    // },
    {
      title: LeadPageText.COLUMN_PHONE_NUMBER,
      dataIndex: 'phone_number',
      key: 'phone_number',
    },
    {
      title: LeadPageText.COLUMN_NOTE,
      dataIndex: 'note',
      key: 'note',
      align: 'center',
      width: 120,
      render: (_: unknown, record: Lead) => {
        const notes: NoteItem[] = Array.isArray(record.note) ? (record.note as NoteItem[]) : [];
        const noteCount = notes.length;
        return (
          <Space>
            <Tooltip title="Thêm ghi chú">
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleOpenNoteAddModal(record)}
              />
            </Tooltip>
            <Tooltip title="Xem lịch sử ghi chú">
              <Badge count={noteCount} size="small" offset={[-2, 0]}>
                <Button
                  size="small"
                  icon={<InfoCircleOutlined />}
                  onClick={() => handleOpenNoteHistoryModal(record)}
                  disabled={noteCount === 0}
                />
              </Badge>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'Facebook',
      key: 'facebook_url',
      align: 'center',
      width: 72,
      render: (_: unknown, record: Lead) => (
        <Tooltip title={record.facebook_url ? 'Mở Facebook' : 'Không có link Facebook'}>
          <Button
            size="small"
            type="text"
            icon={<FacebookOutlined style={{ fontSize: 16, color: record.facebook_url ? '#1877f2' : undefined }} />}
            disabled={!record.facebook_url}
            onClick={() => record.facebook_url && window.open(record.facebook_url, '_blank')}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Chat',
      key: 'conversation',
      align: 'center',
      width: 72,
      render: (_: unknown, record: Lead) => (
        <Tooltip title={record.conversation ? 'Xem hội thoại' : 'Không có hội thoại'}>
          <Button
            size="small"
            type="text"
            icon={<MessageOutlined style={{ fontSize: 16, color: record.conversation ? '#52c41a' : undefined }} />}
            disabled={!record.conversation}
            onClick={() => record.conversation && handleOpenConversationModal(record)}
          />
        </Tooltip>
      ),
    },
    {
      title: LeadPageText.COLUMN_DATE_OF_BIRTH,
      dataIndex: 'date_of_birth',
      key: 'date_of_birth',
      render: (date: string | null) => (date ? date : null),
    },
    {
      title: LeadPageText.COLUMN_CURRENT_ADDRESS,
      dataIndex: 'current_address_temp',
      key: 'current_address_temp',
      render: (_: unknown, record: Lead) => {
        const newAddr = record.current_address_temp as LocationValueV2 | null | undefined;
        const oldAddr = record.current_address as LocationValue | null | undefined;
        const formatted = formatLocationValueV2(newAddr) || formatLocationValue(oldAddr);
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
      title: LeadPageText.COURSE_IDS_LABEL,
      dataIndex: 'course_ids',
      key: 'course_ids',
      render: (courseIds: string[] | null) => {
        if (!courseIds || courseIds.length === 0) {
          return null;
        }
        if (!courses) {
          return courseIds.join(', ');
        }
        const courseNames = courseIds.map((id) => {
          const course = courses.find((c) => c.id === id);
          return course ? course.name : id;
        });
        return courseNames.join(', ');
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
      title: 'Học phí',
      dataIndex: 'tuition_fee',
      key: 'tuition_fee',
      width: 140,
      render: (value: number | null) =>
        value ? formatNumberVi(value) + ' đ' : null,
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      align: 'center' as const,
      width: 120,
      render: (_: unknown, record: Lead) => (
        <Space>
          <Tooltip title="Tạo phiếu thu">
            <Button
              size="small"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => handleOpenPaymentTicketModal(record)}
            />
          </Tooltip>
          <Tooltip title="Lịch sử thanh toán">
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => handleOpenPaymentHistoryModal(record)}
            />
          </Tooltip>
        </Space>
      ),
    },

    {
      title: LeadPageText.COLUMN_APPOINTMENT_DATE,
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      render: (_: unknown, record: Lead) => {
        if (!record.appointment_date) return null;

        return (
          <Space>
            <span>{new Date(record.appointment_date).toLocaleString(DateLocale.VIET_NAM)}</span>
            <Tooltip title="Cập nhật trạng thái điểm danh">
              <Badge dot={record.attendance_status === AttendanceStatus.NOT_ARRIVED} offset={[-2, 2]}>
                <Button
                  size="small"
                  type="text"
                  icon={
                    record.attendance_status === AttendanceStatus.ARRIVED ? (
                      <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 16 }} />
                    ) : record.attendance_status === AttendanceStatus.NO_SHOW ? (
                      <CloseCircleTwoTone twoToneColor="#ff4d4f" style={{ fontSize: 16 }} />
                    ) : (
                      <ClockCircleTwoTone twoToneColor="#faad14" style={{ fontSize: 16 }} />
                    )
                  }
                  onClick={() => handleOpenAttendanceModal(record)}
                />
              </Badge>
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'Telesales',
      key: 'telesales_id',
      align: 'center',
      width: 170,
      render: (_: unknown, record: Lead) => (
        <AssignTelesales lead={record} />
      ),
    },
    {
      title: LeadPageText.COLUMN_IMAGES,
      key: 'images',
      align: 'center',
      width: 100,
      render: (_: unknown, record: Lead) => (
        <Badge count={record.images?.length || 0} size="small" offset={[-2, 0]}>
          <Button
            size="small"
            icon={<PictureOutlined />}
            onClick={() => handleOpenImagesModal(record)}
          />
        </Badge>
      ),
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
