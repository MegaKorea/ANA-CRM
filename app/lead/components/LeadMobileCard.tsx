import { Card, Flex, Typography, Tag, Space, Tooltip, Badge, Button, Popconfirm } from 'antd';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { HiOutlineInformationCircle, HiOutlinePencilAlt, HiOutlineTrash } from 'react-icons/hi';
import { formatNumberVi } from '@/lib/utils/numberFormat';
import { LeadStatus, DateLocale } from '@/constants/enums';
import type { Lead } from '@/lib/services/lead.service';
import { LeadPageText, LeadStatusLabel, LeadSourceIcon, LeadSourceLabel } from '@/app/lead/constants';
import { memo } from 'react';

interface LeadMobileCardProps {
    lead: Lead;
    courses: any[];
    onOpenDetail: (lead: Lead) => void;
    onOpenModal: (lead: Lead) => void;
    onOpenNoteAdd: (lead: Lead) => void;
    onOpenNoteHistory: (lead: Lead) => void;
    onDelete: (id: number) => void;
}

export const LeadMobileCard = memo(function LeadMobileCard({
    lead,
    courses,
    onOpenDetail,
    onOpenModal,
    onOpenNoteAdd,
    onOpenNoteHistory,
    onDelete,
}: LeadMobileCardProps) {
    const notes = Array.isArray(lead.note) ? lead.note : [];
    const noteCount = notes.length;

    return (
        <Card
            size="small"
            title={<Typography.Text strong style={{ fontSize: '15px', whiteSpace: 'normal', wordBreak: 'break-word', color: '#1677ff' }}>{lead.full_name}</Typography.Text>}
            extra={
                lead.status ? <Tag style={{ margin: 0, fontWeight: 500 }} color={lead.status === LeadStatus.NEW ? 'blue' : lead.status === LeadStatus.CONVERTED ? 'green' : (lead.status === LeadStatus.NOT_CONTACTED || lead.status === ('lost' as LeadStatus)) ? 'red' : 'default'}>{LeadStatusLabel[lead.status as keyof typeof LeadStatusLabel] ?? lead.status}</Tag> : null
            }
            style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: '12px' }}
            actions={[
                <Tooltip key="detail" title="Chi tiết">
                    <div onClick={() => onOpenDetail(lead)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <HiOutlineInformationCircle size={18} />
                    </div>
                </Tooltip>,
                <Tooltip key="edit" title="Chỉnh sửa">
                    <div onClick={() => onOpenModal(lead)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ff4d4f' }}>
                            <HiOutlineTrash size={18} />
                        </div>
                    </Tooltip>
                </Popconfirm>
            ]}
        >
            <Flex vertical gap={4}>
                <Flex justify="space-between" align="center" className="text-body-small">
                    <Typography.Text type="secondary">Số điện thoại</Typography.Text>
                    <Typography.Text strong>{lead.phone_number || '—'}</Typography.Text>
                </Flex>
                <Flex justify="space-between" align="center" className="text-body-small">
                    <Typography.Text type="secondary">Nguồn</Typography.Text>
                    <Flex align="center" gap={4}>
                        {lead.source && LeadSourceIcon[lead.source as keyof typeof LeadSourceIcon]}
                        <Typography.Text>{lead.source ? (LeadSourceLabel[lead.source as keyof typeof LeadSourceLabel] ?? lead.source) : '—'}</Typography.Text>
                    </Flex>
                </Flex>
                <Flex justify="space-between" align="center" className="text-body-small">
                    <Typography.Text type="secondary">Khóa học</Typography.Text>
                    <Typography.Text style={{ textAlign: 'right', marginLeft: '16px' }}>
                        {lead.course_ids && lead.course_ids.length > 0 ? lead.course_ids.map((id: string) => {
                            const course = courses?.find((c: any) => c.id === id);
                            return course ? course.name : id;
                        }).join(', ') : '—'}
                    </Typography.Text>
                </Flex>
                <Flex justify="space-between" align="center" className="text-body-small">
                    <Typography.Text type="secondary">Doanh thu</Typography.Text>
                    <Typography.Text>{lead.sales_amount ? formatNumberVi(lead.sales_amount) : '—'}</Typography.Text>
                </Flex>
                <Flex justify="space-between" align="center" className="text-body-small">
                    <Typography.Text type="secondary">Lịch hẹn</Typography.Text>
                    <Typography.Text>{lead.appointment_date ? new Date(lead.appointment_date).toLocaleString(DateLocale.VIET_NAM) : '—'}</Typography.Text>
                </Flex>
                <Flex justify="space-between" align="center" className="text-body-small">
                    <Typography.Text type="secondary">Ghi chú</Typography.Text>
                    <Space>
                        <Tooltip title="Thêm ghi chú">
                            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => onOpenNoteAdd(lead)} />
                        </Tooltip>
                        <Tooltip title="Xem lịch sử ghi chú">
                            <Badge count={noteCount} size="small" offset={[-2, 0]}>
                                <Button size="small" icon={<InfoCircleOutlined />} onClick={() => onOpenNoteHistory(lead)} disabled={noteCount === 0} />
                            </Badge>
                        </Tooltip>
                    </Space>
                </Flex>
            </Flex>
        </Card>
    );
});
