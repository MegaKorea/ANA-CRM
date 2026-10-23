import { Button, Space, Tooltip, Badge, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Image from 'next/image';
import { HiOutlinePencilAlt, HiOutlineInformationCircle } from 'react-icons/hi';
import {
  InfoCircleOutlined,
  PictureOutlined,
  CalendarOutlined,
  AudioOutlined,
} from '@ant-design/icons';
import { MessengerIcon } from '@/components/common/MessengerIcon';
import { hasSmaxConversation } from '@/lib/smax/parse-smax-log';
import type { Lead } from '@/lib/services/lead.service';
import { AttendanceStatus, DateLocale } from '@/constants/enums';
import type { Course } from '@/lib/services/course.service';
import type { LocationValue } from '@/components/common/LocationSelect';
import type { LocationValueV2 } from '@/components/common/LocationSelectV2';
import type { NoteItem, NoteSummarizeItem } from '@/lib/supabase/types/tables/leads';
import { formatNumberVi } from '@/lib/utils/numberFormat';
import { openInNewTab } from '@/lib/utils/openInNewTab';
import { toSentenceCase } from '@/lib/utils/text-case';
import { AssignTelesales } from '@/app/lead/components/AssignTelesales';
import { LeadRate } from '@/app/lead/components/LeadRate';
import { SmaxThreadLink } from '@/app/lead/components/SmaxThreadLink';
import { AttendanceStatusIcon } from '@/app/lead/components/AttendanceStatusIcon';
import { LeadStatusLabel } from '@/app/lead/constants/labels';
import { getCareMilestone } from '@/app/lead/constants/care-milestones';
import {
  LeadActionIconSize,
  LeadPageText,
  LeadSourceIcon,
  LeadSourceLabel,
  LeadTableColumnWidth,
  formatLocationValue,
  formatLocationValueV2,
  getLeadFacebookUrl,
  getLeadStatusColor,
  getZaloChatUrl,
} from '@/app/lead/constants/lead-helpers';


const CHANNEL_BADGE_SIZE = 18;

function ChannelBadgeIcon({
  active,
  imgSrc,
  alt,
}: {
  active: boolean;
  imgSrc: string;
  alt: string;
}) {
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: CHANNEL_BADGE_SIZE,
        height: CHANNEL_BADGE_SIZE,
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#fff',
        filter: active ? undefined : 'grayscale(1) opacity(0.4)',
      }}
    >
      <Image src={imgSrc} alt={alt} fill sizes={`${CHANNEL_BADGE_SIZE}px`} style={{ objectFit: 'cover' }} />
    </span>
  );
}

export type HandleOpenAttendanceModal = (lead: Lead) => void;
export type HandleOpenAppointmentModal = (lead: Lead) => void;

export type HandleOpenLeadModal = (lead?: Lead) => void;

export type HandleOpenLeadDetailModal = (lead: Lead) => void;

export type HandleOpenNoteHistoryModal = (lead: Lead) => void;

export type HandleOpenNoteSummarizeModal = (lead: Lead) => void;

export type HandleOpenImagesModal = (lead: Lead) => void;

export type HandleOpenConversationModal = (lead: Lead) => void;

// Columns kept in code but hidden from the table to keep it compact; their
// data is shown in LeadDetailModal ("Thông tin thêm") instead.
const HIDDEN_COLUMN_KEYS = new Set([
  'note_summarize',
  'facebook_url',
  'date_of_birth',
  'current_address_temp',
  'images',
  'tuition_fee',
]);

export const getLeadTableColumns = ({
  handleOpenModal,
  handleOpenDetailModal,
  handleOpenNoteHistoryModal,
  handleOpenNoteSummarizeModal,
  handleOpenImagesModal,
  handleOpenAttendanceModal,
  handleOpenAppointmentModal,
  handleOpenConversationModal,
  courses,
}: {
  handleOpenModal: HandleOpenLeadModal;
  handleOpenDetailModal: HandleOpenLeadDetailModal;
  handleOpenNoteHistoryModal: HandleOpenNoteHistoryModal;
  handleOpenNoteSummarizeModal: HandleOpenNoteSummarizeModal;
  handleOpenImagesModal: HandleOpenImagesModal;
  handleOpenAttendanceModal: HandleOpenAttendanceModal;
  handleOpenAppointmentModal: HandleOpenAppointmentModal;
  handleOpenConversationModal: HandleOpenConversationModal;
  courses?: Course[] | null;
}): ColumnsType<Lead> => [
    {
      title: LeadPageText.COLUMN_CREATED_AT,
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string | null) => {
        if (!date) {
          return null;
        }
        const label = new Date(date).toLocaleDateString(DateLocale.VIET_NAM, {
          day: '2-digit',
          month: '2-digit',
        });
        const milestone = getCareMilestone(date);
        if (!milestone) {
          return label;
        }
        return (
          <Tooltip title={`Chăm khách: ${milestone.label}`}>
            <Tag color={milestone.color} style={{ marginInlineEnd: 0 }}>
              {label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: LeadPageText.COLUMN_FULL_NAME,
      dataIndex: 'full_name',
      key: 'full_name',
      render: (_: unknown, record: Lead) => <SmaxThreadLink lead={record} />,
    },
    {
      title: LeadPageText.COLUMN_PHONE_NUMBER,
      dataIndex: 'phone_number',
      key: 'phone_number',
      align: 'center' as const,
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
        const latestNote = notes.reduce<NoteItem | null>(
          (latest, note) =>
            !latest || new Date(note.created_at) > new Date(latest.created_at) ? note : latest,
          null,
        );
        return (
          <Tooltip
            title={latestNote?.content || 'Ghi chú'}
            styles={{ container: { whiteSpace: 'pre-wrap' } }}
          >
            <Badge count={noteCount} size="small" offset={[-2, 0]}>
              <Button
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => handleOpenNoteHistoryModal(record)}
              />
            </Badge>
          </Tooltip>
        );
      },
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>Ghi âm</span>,
      key: 'note_summarize',
      align: 'center',
      width: 100,
      render: (_: unknown, record: Lead) => {
        const noteSummarizeCount = Array.isArray(record.note_summarize)
          ? (record.note_summarize as NoteSummarizeItem[]).length
          : 0;
        return (
          <Tooltip title="Ghi chú ghi âm">
            <Badge count={noteSummarizeCount} size="small" offset={[-2, 0]}>
              <Button
                size="small"
                icon={<AudioOutlined />}
                onClick={() => handleOpenNoteSummarizeModal(record)}
              />
            </Badge>
          </Tooltip>
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
              disabled={!facebookUrl}
              onClick={() => openInNewTab(facebookUrl)}
              icon={<ChannelBadgeIcon imgSrc="/fb.png" alt="Facebook" active={!!facebookUrl} />}
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
              disabled={!zaloChatUrl}
              onClick={() => openInNewTab(zaloChatUrl)}
              icon={<ChannelBadgeIcon imgSrc="/zalo.jpg" alt="Zalo" active={!!zaloChatUrl} />}
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
              disabled={!canOpenChat}
              onClick={() => canOpenChat && handleOpenConversationModal(record)}
              // Disabled text buttons grey out currentColor, so no extra inactive styling.
              icon={<MessengerIcon size={CHANNEL_BADGE_SIZE} />}
            />
          </Tooltip>
        );
      },
    },
    {
      title: LeadPageText.COLUMN_DATE_OF_BIRTH,
      dataIndex: 'date_of_birth',
      key: 'date_of_birth',
      align: 'center' as const,
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
      align: 'center' as const,
      render: (status: string | null) => {
        if (!status) {
          return null;
        }
        return (
          <div style={{ textAlign: 'left' }}>
            <Tag color={getLeadStatusColor(status)} style={{ marginInlineEnd: 0 }}>
              {toSentenceCase(LeadStatusLabel[status as keyof typeof LeadStatusLabel] ?? status)}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Tiềm năng',
      key: 'rate',
      align: 'center',
      width: 140,
      render: (_: unknown, record: Lead) => <LeadRate lead={record} />,
    },
    // tạm ẩn cột "Thẻ Smax"
    // {
    //   title: 'Thẻ Smax',
    //   key: 'smax_tags',
    //   width: 180,
    //   render: (_: unknown, record: Lead) => {
    //     const tags = getSmaxTags(record.smax_log);
    //     if (!tags || tags.length === 0) {
    //       return null;
    //     }
    //     return (
    //       <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 4, overflowX: 'auto' }}>
    //         {renderSmaxTagList(tags, { margin: 0, flexShrink: 0 })}
    //       </div>
    //     );
    //   },
    // },
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
          return course ? toSentenceCase(course.name) : id;
        });
        return courseNames.join(', ');
      },
    },
    {
      title: LeadPageText.COLUMN_SOURCE,
      dataIndex: 'source',
      key: 'source',
      align: 'center' as const,
      render: (source: string | null) => {
        if (!source) {
          return null;
        }
        const icon = LeadSourceIcon[source as keyof typeof LeadSourceIcon];
        const label = LeadSourceLabel[source as keyof typeof LeadSourceLabel] ?? source;
        // Unknown sources have no icon, so fall back to the raw label.
        if (!icon) {
          return label;
        }
        return (
          <Tooltip title={label}>
            <span style={{ display: 'inline-flex' }} aria-label={label}>
              {icon}
            </span>
          </Tooltip>
        );
      },
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
        <Button type="text" onClick={() => handleOpenModal(record)}>
          <HiOutlinePencilAlt size={LeadActionIconSize.DEFAULT} />
        </Button>
      ),
    },
  ]
    .filter((col) => !HIDDEN_COLUMN_KEYS.has(col.key as string))
    // Left-align every column (header and cells) for a consistent table.
    .map((col) => ({ ...col, align: 'left' })) as ColumnsType<Lead>;
