import { Button, Popconfirm, Space, Tooltip, Badge, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HiOutlinePencilAlt, HiOutlineTrash, HiOutlineInformationCircle } from 'react-icons/hi';
import {
  PlusOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  MessageOutlined,
  FacebookOutlined,
  DollarOutlined,
  HistoryOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { SiZalo } from 'react-icons/si';
import { hasSmaxConversation } from '@/lib/smax/parse-smax-log';
import type { Lead } from '@/lib/services/lead.service';
import { AttendanceStatus, DateLocale } from '@/constants/enums';
import type { Course } from '@/lib/services/course.service';
import type { LocationValue } from '@/components/common/LocationSelect';
import type { LocationValueV2 } from '@/components/common/LocationSelectV2';
import type { NoteItem } from '@/lib/supabase/types/tables/leads';
import { formatNumberVi } from '@/lib/utils/numberFormat';
import { openInNewTab } from '@/lib/utils/openInNewTab';
import { AssignTelesales } from '@/app/lead/components/AssignTelesales';
import { LeadRate } from '@/app/lead/components/LeadRate';
import { SmaxThreadButton } from '@/app/lead/components/SmaxThreadButton';
import { AttendanceStatusIcon } from '@/app/lead/components/AttendanceStatusIcon';
import { LeadStatusLabel } from '@/app/lead/constants/labels';
import {
  LeadActionIconSize,
  LeadPageGap,
  LeadPageText,
  LeadSourceIcon,
  LeadSourceLabel,
  LeadTableColumnWidth,
  formatLocationValue,
  formatLocationValueV2,
  getLeadFacebookUrl,
  getSmaxTagColor,
  getSmaxTags,
  getZaloChatUrl,
} from '@/app/lead/constants/lead-helpers';

/**
 * `getLeadTableColumns` — the antd Table column factory for the lead list.
 * Split out of `index.tsx` (which stays a thin barrel) because this pulls in
 * the full lead-row action components (modals, telesales assign, etc.) that
 * plainer consumers of the constants (mobile card, filters, `/lead-form`)
 * don't need.
 */

export type HandleOpenAttendanceModal = (lead: Lead) => void;
export type HandleOpenAppointmentModal = (lead: Lead) => void;

export type HandleOpenLeadModal = (lead?: Lead) => void;

export type HandleDeleteLead = (id: number) => void;

export type HandleOpenLeadDetailModal = (lead: Lead) => void;

export type HandleOpenNoteAddModal = (lead: Lead) => void;

export type HandleOpenNoteHistoryModal = (lead: Lead) => void;

export type HandleOpenImagesModal = (lead: Lead) => void;

export type HandleOpenConversationModal = (lead: Lead) => void;

export type HandleOpenPaymentTicketModal = (lead: Lead) => void;

export type HandleOpenPaymentHistoryModal = (lead: Lead) => void;

export type PaymentCountsMap = Record<string, number>;

export const getLeadTableColumns = ({
  handleOpenModal,
  handleDelete,
  handleOpenDetailModal,
  handleOpenNoteAddModal,
  handleOpenNoteHistoryModal,
  handleOpenImagesModal,
  handleOpenAttendanceModal,
  handleOpenAppointmentModal,
  handleOpenConversationModal,
  handleOpenPaymentTicketModal,
  handleOpenPaymentHistoryModal,
  courses,
  paymentCounts,
}: {
  handleOpenModal: HandleOpenLeadModal;
  handleDelete: HandleDeleteLead;
  handleOpenDetailModal: HandleOpenLeadDetailModal;
  handleOpenNoteAddModal: HandleOpenNoteAddModal;
  handleOpenNoteHistoryModal: HandleOpenNoteHistoryModal;
  handleOpenImagesModal: HandleOpenImagesModal;
  handleOpenAttendanceModal: HandleOpenAttendanceModal;
  handleOpenAppointmentModal: HandleOpenAppointmentModal;
  handleOpenConversationModal: HandleOpenConversationModal;
  handleOpenPaymentTicketModal: HandleOpenPaymentTicketModal;
  handleOpenPaymentHistoryModal: HandleOpenPaymentHistoryModal;
  courses?: Course[] | null;
  paymentCounts?: PaymentCountsMap;
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
      render: (_: unknown, record: Lead) => (
        <Space size={4}>
          <span>{record.full_name}</span>
          <SmaxThreadButton lead={record} />
        </Space>
      ),
    },
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
      render: (_: unknown, record: Lead) => {
        const facebookUrl = getLeadFacebookUrl(record);

        return (
          <Tooltip title={facebookUrl ? 'Mở Facebook' : 'Không có link Facebook'}>
            <Button
              size="small"
              type="text"
              icon={<FacebookOutlined style={{ fontSize: 16, color: facebookUrl ? '#1877f2' : undefined }} />}
              disabled={!facebookUrl}
              onClick={() => openInNewTab(facebookUrl)}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Zalo',
      key: 'pid_zalo',
      align: 'center',
      width: 72,
      render: (_: unknown, record: Lead) => {
        const zaloChatUrl = getZaloChatUrl(record.pid_zalo);

        return (
          <Tooltip title={zaloChatUrl ? 'Mở Zalo' : 'Không có PID Zalo'}>
            <Button
              size="small"
              type="text"
              icon={<SiZalo size={16} color={zaloChatUrl ? '#0068ff' : undefined} />}
              disabled={!zaloChatUrl}
              onClick={() => openInNewTab(zaloChatUrl)}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Chat',
      key: 'conversation',
      align: 'center',
      width: 72,
      render: (_: unknown, record: Lead) => {
        const canOpenChat = hasSmaxConversation(record.smax_log);
        return (
          <Tooltip title={canOpenChat ? 'Xem hội thoại' : 'Không có hội thoại Smax'}>
            <Button
              size="small"
              type="text"
              icon={
                <MessageOutlined
                  style={{ fontSize: 16, color: canOpenChat ? '#52c41a' : undefined }}
                />
              }
              disabled={!canOpenChat}
              onClick={() => canOpenChat && handleOpenConversationModal(record)}
            />
          </Tooltip>
        );
      },
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
      title: 'Tiềm năng',
      key: 'rate',
      align: 'center',
      width: 140,
      render: (_: unknown, record: Lead) => <LeadRate lead={record} />,
    },
    {
      title: 'Thẻ Smax',
      key: 'smax_tags',
      width: 180,
      render: (_: unknown, record: Lead) => {
        const tags = getSmaxTags(record.smax_log);
        if (!tags || tags.length === 0) {
          return null;
        }
        return (
          <Space size={[0, 4]} wrap>
            {tags.map((tag, idx) => {
              const tagName = tag.name || tag.alias;
              if (!tagName) return null;
              const color = getSmaxTagColor(tagName);
              return (
                <Tag key={tag.id || idx} color={color}>
                  {tagName}
                </Tag>
              );
            })}
          </Space>
        );
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
      render: (_: unknown, record: Lead) => {
        const paidCount = paymentCounts?.[String(record.id)] ?? 0;
        return (
          <Space>
            <Tooltip title="Tạo phiếu thu">
              <Button
                size="small"
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => handleOpenPaymentTicketModal(record)}
              />
            </Tooltip>
            <Tooltip title={paidCount > 0 ? `Đã nộp ${paidCount} lần` : 'Lịch sử thanh toán'}>
              <Badge count={paidCount} size="small" offset={[-2, 0]}>
                <Button
                  size="small"
                  icon={<HistoryOutlined />}
                  onClick={() => handleOpenPaymentHistoryModal(record)}
                  style={paidCount > 0 ? { borderColor: '#52c41a', color: '#52c41a' } : undefined}
                />
              </Badge>
            </Tooltip>
          </Space>
        );
      },
    },

    {
      title: LeadPageText.COLUMN_APPOINTMENT_DATE,
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      render: (_: unknown, record: Lead) => {
        if (!record.appointment_date) {
          return (
            <span data-lead-appointment={record.id}>
              <Tooltip title="Đặt lịch hẹn">
                <Button
                  size="small"
                  type="text"
                  icon={<CalendarOutlined />}
                  onClick={() => handleOpenAppointmentModal(record)}
                />
              </Tooltip>
            </span>
          );
        }

        return (
          <span data-lead-appointment={record.id}>
            <Space>
              <span>{new Date(record.appointment_date).toLocaleString(DateLocale.VIET_NAM)}</span>
              <Tooltip title="Quản lý lịch hẹn">
                <Button
                  size="small"
                  type="text"
                  icon={<CalendarOutlined />}
                  onClick={() => handleOpenAppointmentModal(record)}
                />
              </Tooltip>
              <Tooltip title="Cập nhật trạng thái điểm danh">
                <Badge dot={record.attendance_status === AttendanceStatus.NOT_ARRIVED} offset={[-2, 2]}>
                  <Button
                    size="small"
                    type="text"
                    icon={<AttendanceStatusIcon status={record.attendance_status} />}
                    onClick={() => handleOpenAttendanceModal(record)}
                  />
                </Badge>
              </Tooltip>
            </Space>
          </span>
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
