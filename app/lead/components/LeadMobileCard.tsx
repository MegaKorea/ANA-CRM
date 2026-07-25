import { Card, Flex, Typography, Tag, Space, Tooltip, Badge, Button, Popconfirm } from 'antd';
import {
  PlusOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  CloseCircleTwoTone,
} from '@ant-design/icons';
import { HiOutlineInformationCircle, HiOutlinePencilAlt, HiOutlineTrash } from 'react-icons/hi';
import { LeadStatus, DateLocale, AttendanceStatus } from '@/constants/enums';
import type { Lead } from '@/lib/services/lead.service';
import {
  getZaloChatUrl,
  LeadPageText,
  LeadStatusLabel,
  LeadSourceIcon,
  LeadSourceLabel,
} from '@/app/lead/constants';
import { AssignTelesales } from '@/app/lead/components/AssignTelesales';
import { LeadRate } from '@/app/lead/components/LeadRate';
import { memo } from 'react';
import { SiZalo } from 'react-icons/si';

interface LeadMobileCardProps {
  lead: Lead;
  courses: any[];
  onOpenDetail: (lead: Lead) => void;
  onOpenModal: (lead: Lead) => void;
  onOpenNoteAdd: (lead: Lead) => void;
  onOpenNoteHistory: (lead: Lead) => void;
  onOpenImages: (lead: Lead) => void;
  onOpenAttendance: (lead: Lead) => void;
  onDelete: (id: number) => void;
}

export const LeadMobileCard = memo(function LeadMobileCard({
  lead,
  courses,
  onOpenDetail,
  onOpenModal,
  onOpenNoteAdd,
  onOpenNoteHistory,
  onOpenImages,
  onOpenAttendance,
  onDelete,
}: LeadMobileCardProps) {
  const notes = Array.isArray(lead.note) ? lead.note : [];
  const noteCount = notes.length;
  const imageCount = lead.images?.length || 0;
  const zaloChatUrl = getZaloChatUrl(lead.pid_zalo);

  return (
    <Card
      size="small"
      title={
        <Typography.Text
          strong
          style={{
            fontSize: '15px',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            color: '#1677ff',
          }}
        >
          {lead.full_name}
        </Typography.Text>
      }
      extra={
        lead.status ? (
          <Tag
            style={{ margin: 0, fontWeight: 500 }}
            color={
              lead.status === LeadStatus.NEW
                ? 'blue'
                : lead.status === LeadStatus.CONVERTED
                  ? 'green'
                  : lead.status === LeadStatus.NOT_CONTACTED ||
                      lead.status === ('lost' as LeadStatus)
                    ? 'red'
                    : 'default'
            }
          >
            {LeadStatusLabel[lead.status as keyof typeof LeadStatusLabel] ?? lead.status}
          </Tag>
        ) : null
      }
      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      bodyStyle={{ padding: '12px' }}
      actions={[
        <Tooltip key="detail" title="Chi tiết">
          <div
            onClick={() => onOpenDetail(lead)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <HiOutlineInformationCircle size={18} />
          </div>
        </Tooltip>,
        <Tooltip key="edit" title="Chỉnh sửa">
          <div
            onClick={() => onOpenModal(lead)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <HiOutlinePencilAlt size={18} />
          </div>
        </Tooltip>,
        <Popconfirm
          key="delete"
          title={LeadPageText.DELETE_TITLE}
          description={LeadPageText.DELETE_DESCRIPTION}
          onConfirm={() => onDelete(lead.id)}
          okText={LeadPageText.DELETE_OK_TEXT}
          cancelText={LeadPageText.DELETE_CANCEL_TEXT}
        >
          <Tooltip title="Xóa">
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#ff4d4f',
              }}
            >
              <HiOutlineTrash size={18} />
            </div>
          </Tooltip>
        </Popconfirm>,
      ]}
    >
      <Flex vertical gap={4}>
        <Flex justify="space-between" align="center" className="text-body-small">
          <Typography.Text type="secondary">Telesales</Typography.Text>
          <div onClick={(e) => e.stopPropagation()}>
            <AssignTelesales lead={lead} />
          </div>
        </Flex>
        <Flex justify="space-between" align="center" className="text-body-small">
          <Typography.Text type="secondary">Tiềm năng</Typography.Text>
          <div onClick={(e) => e.stopPropagation()}>
            <LeadRate lead={lead} />
          </div>
        </Flex>
        <Flex justify="space-between" align="center" className="text-body-small">
          <Typography.Text type="secondary">Số điện thoại</Typography.Text>
          <Typography.Text strong>{lead.phone_number || '—'}</Typography.Text>
        </Flex>
        <Flex justify="space-between" align="center" className="text-body-small">
          <Typography.Text type="secondary">Nguồn</Typography.Text>
          <Flex align="center" gap={4}>
            {lead.source && LeadSourceIcon[lead.source as keyof typeof LeadSourceIcon]}
            <Typography.Text>
              {lead.source
                ? (LeadSourceLabel[lead.source as keyof typeof LeadSourceLabel] ?? lead.source)
                : '—'}
            </Typography.Text>
          </Flex>
        </Flex>
        <Flex justify="space-between" align="center" className="text-body-small">
          <Typography.Text type="secondary">Zalo</Typography.Text>
          <Tooltip title={zaloChatUrl ? 'Mở Zalo' : 'Không có PID Zalo'}>
            <Button
              size="small"
              type="text"
              icon={<SiZalo size={16} color={zaloChatUrl ? '#0068ff' : undefined} />}
              disabled={!zaloChatUrl}
              onClick={() => zaloChatUrl && window.open(zaloChatUrl, '_blank')}
            />
          </Tooltip>
        </Flex>
        <Flex justify="space-between" align="center" className="text-body-small">
          <Typography.Text type="secondary">Khóa học</Typography.Text>
          <Typography.Text style={{ textAlign: 'right', marginLeft: '16px' }}>
            {lead.course_ids && lead.course_ids.length > 0
              ? lead.course_ids
                  .map((id: string) => {
                    const course = courses?.find((c: any) => c.id === id);
                    return course ? course.name : id;
                  })
                  .join(', ')
              : '—'}
          </Typography.Text>
        </Flex>

        <Flex justify="space-between" align="center" className="text-body-small">
          <Typography.Text type="secondary">Lịch hẹn</Typography.Text>
          {lead.appointment_date ? (
            <Space>
              <Typography.Text>
                {new Date(lead.appointment_date).toLocaleString(DateLocale.VIET_NAM)}
              </Typography.Text>
              <Tooltip title="Cập nhật trạng thái điểm danh">
                <Badge
                  dot={lead.attendance_status === AttendanceStatus.NOT_ARRIVED}
                  offset={[-2, 2]}
                >
                  <Button
                    size="small"
                    type="text"
                    icon={
                      lead.attendance_status === AttendanceStatus.ARRIVED ? (
                        <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 16 }} />
                      ) : lead.attendance_status === AttendanceStatus.NO_SHOW ? (
                        <CloseCircleTwoTone twoToneColor="#ff4d4f" style={{ fontSize: 16 }} />
                      ) : (
                        <ClockCircleTwoTone twoToneColor="#faad14" style={{ fontSize: 16 }} />
                      )
                    }
                    onClick={() => onOpenAttendance(lead)}
                  />
                </Badge>
              </Tooltip>
            </Space>
          ) : (
            <Typography.Text>—</Typography.Text>
          )}
        </Flex>
        <Flex justify="space-between" align="center" className="text-body-small">
          <Typography.Text type="secondary">Ghi chú & Hình ảnh</Typography.Text>
          <Space>
            <Tooltip title="Thêm ghi chú">
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => onOpenNoteAdd(lead)}
              />
            </Tooltip>
            <Tooltip title="Xem lịch sử ghi chú">
              <Badge count={noteCount} size="small" offset={[-2, 0]}>
                <Button
                  size="small"
                  icon={<InfoCircleOutlined />}
                  onClick={() => onOpenNoteHistory(lead)}
                  disabled={noteCount === 0}
                />
              </Badge>
            </Tooltip>
            <Tooltip title="Hình ảnh">
              <Badge count={imageCount} size="small" offset={[-2, 0]}>
                <Button
                  size="small"
                  icon={<PictureOutlined />}
                  onClick={() => onOpenImages(lead)}
                />
              </Badge>
            </Tooltip>
          </Space>
        </Flex>
      </Flex>
    </Card>
  );
});
