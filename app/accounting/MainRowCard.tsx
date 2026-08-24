'use client';

import { Button, Card, Col, Popconfirm, Row, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, DollarOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Enrollment } from '@/lib/services/enrollment.service';
import type { Lead } from '@/lib/services/lead.service';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';
import { getLatestNoteContent } from '@/lib/utils/notes';
import { ENROLLMENT_CATEGORY_COLOR, ENROLLMENT_CATEGORY_LABEL } from './columns';

export type MainRow = ({ rowType: 'enrollment' } & Enrollment) | ({ rowType: 'lead' } & Lead);

interface MainRowCardProps {
  record: MainRow;
  courseName: (courseId: string | null) => string | null;
  className: (classId: string | null) => string | null;
  onPay: (record: MainRow) => void;
  onEdit: (record: MainRow) => void;
  onDelete: (record: MainRow) => void;
  canDelete: boolean;
}

export function MainRowCard({ record, courseName, className, onPay, onEdit, onDelete, canDelete }: MainRowCardProps) {
  const name = record.rowType === 'lead' ? record.full_name : record.lead_full_name || `Lead #${record.lead_id}`;
  const phone = record.rowType === 'lead' ? record.phone_number : record.lead_phone_number;
  const leadCourseId = record.rowType === 'lead' ? record.course_ids?.[0] : undefined;
  const category = record.rowType === 'lead' ? 'khóa học' : record.category;
  const isCourseCategory = category === 'khóa học';
  const course =
    record.rowType === 'lead'
      ? leadCourseId
        ? courseName(leadCourseId)
        : null
      : isCourseCategory
        ? courseName(record.course_id)
        : null;
  const cls = record.rowType === 'enrollment' && isCourseCategory ? className(record.class_id) : null;
  const fee = record.tuition_fee ?? 0;
  const paid = record.rowType === 'enrollment' ? record.paid_amount : 0;
  const debt = record.rowType === 'enrollment' ? record.debt_amount : (record.tuition_fee ?? 0);
  const date = record.rowType === 'enrollment' ? record.enrollment_date : record.created_at;
  const advisor = record.rowType === 'enrollment' ? record.created_by_name : null;
  const note = record.rowType === 'lead' ? getLatestNoteContent(record.note) : record.note;

  return (
    <Card size="small" style={{ borderRadius: 12, marginBottom: 10 }} styles={{ body: { padding: 14 } }}>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Row justify="space-between" align="top" wrap={false}>
          <Col style={{ minWidth: 0 }}>
            <Typography.Text strong style={{ fontSize: 14, display: 'block' }} ellipsis>
              {name}
            </Typography.Text>
            {phone && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {phone}
              </Typography.Text>
            )}
          </Col>
          <Space style={{ marginLeft: 8, flexShrink: 0 }}>
            <Tag color={ENROLLMENT_CATEGORY_COLOR[category]}>{ENROLLMENT_CATEGORY_LABEL[category]}</Tag>
            {record.rowType === 'lead' && <Tag color="geekblue">Chờ tạo đăng ký</Tag>}
          </Space>
        </Row>

        {record.rowType === 'enrollment' && !isCourseCategory ? (
          record.item_name && (
            <Space size={4} wrap>
              <Typography.Text style={{ fontSize: 12 }}>{record.item_name}</Typography.Text>
            </Space>
          )
        ) : (
          course && (
            <Space size={4} wrap>
              <Typography.Text style={{ fontSize: 12 }}>{course}</Typography.Text>
              {cls && cls !== course && <Tag style={{ fontSize: 11 }}>{cls}</Tag>}
            </Space>
          )
        )}

        <Row gutter={8}>
          <Col span={8}>
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              Học phí
            </Typography.Text>
            <Typography.Text strong style={{ fontSize: 13, color: '#1890ff' }}>
              {formatCurrencyVnd(fee)}
            </Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              Đã đóng
            </Typography.Text>
            <Typography.Text style={{ fontSize: 13 }}>{formatCurrencyVnd(paid)}</Typography.Text>
          </Col>
          <Col span={8}>
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              Còn nợ
            </Typography.Text>
            <Typography.Text style={{ fontSize: 13, color: debt > 0 ? '#cf1322' : undefined }}>
              {formatCurrencyVnd(debt)}
            </Typography.Text>
          </Col>
        </Row>

        <Space size={6} wrap>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {date ? dayjs(date).format('DD/MM/YYYY') : ''}
          </Typography.Text>
          {advisor && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              · {advisor}
            </Typography.Text>
          )}
        </Space>

        {note && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: note }}>
            {note}
          </Typography.Text>
        )}

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button size="small" type="primary" icon={<DollarOutlined />} onClick={() => onPay(record)}>
            Thu tiền
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          {canDelete && (
            <Popconfirm title="Xóa đăng ký này?" okText="Xóa" cancelText="Hủy" onConfirm={() => onDelete(record)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      </Space>
    </Card>
  );
}
