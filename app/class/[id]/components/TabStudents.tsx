import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Table,
  Space,
  Tag,
  Popconfirm,
  message,
  Select,
  Typography,
  Badge,
  List,
  Card,
  Avatar,
  theme,
} from 'antd';
import {
  DeleteOutlined,
  UserAddOutlined,
  EditOutlined,
  PictureOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  useClassStudents,
  useAddClassStudent,
  useRemoveClassStudent,
} from '@/lib/hooks/use-classes';
import { useLeads } from '@/lib/hooks/use-leads';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import type { Class } from '@/lib/services/class.service';
import dayjs from 'dayjs';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { StudentFinanceModal } from './StudentFinanceModal';

const { Text } = Typography;

const studentStatusMeta: Record<string, { label: string; color: string }> = {
  active: { label: 'Đang học', color: 'green' },
  withdrawn: { label: 'Đã rút', color: 'red' },
  completed: { label: 'Hoàn thành', color: 'blue' },
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

// ── Avatar màu từ tên ──────────────────────────────────────────────────────
const AVATAR_COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
function nameToColor(name: string) {
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? parts[parts.length - 1][0].toUpperCase()
    : (name[0]?.toUpperCase() ?? '?');
}

const MASKED_CONTACT = '*********';

function isOwnStudentRow(
  record: { login_email?: string; leads?: { email?: string; phone_number?: string } | null },
  userEmail: string | null | undefined,
) {
  if (!userEmail) return false;
  const email = userEmail.toLowerCase();
  return (
    record.login_email?.toLowerCase() === email ||
    record.leads?.email?.toLowerCase() === email
  );
}

export function TabStudents({ classData }: { classData: Class }) {
  const { token } = theme.useToken();
  const isMobile = useIsMobile();
  const { hasPermission: isManager, user } = useAuthPermission(['ADMIN', 'AO']);
  const maskPeerContacts = user?.roleCode === 'STU';
  const { data: students, isLoading } = useClassStudents(classData.id);
  const { data: leadsData, isLoading: isLeadsLoading } = useLeads({ limit: 100, page: 1 });
  const addStudentMutation = useAddClassStudent(classData.id);
  const removeStudentMutation = useRemoveClassStudent(classData.id);

  const [selectedLeadId, setSelectedLeadId] = useState<number | undefined>(undefined);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [financeStudent, setFinanceStudent] = useState<any>(null);

  const openFinance = (record: any) => {
    setFinanceStudent(record);
    setFinanceModalOpen(true);
  };

  const handleAddStudent = useCallback(() => {
    if (!selectedLeadId) return;
    if (classData.capacity && students && students.length >= classData.capacity) {
      message.error(`Lớp đã đạt sĩ số tối đa (${classData.capacity} học viên)`);
      return;
    }
    addStudentMutation.mutate(
      { classId: classData.id, studentId: selectedLeadId },
      {
        onSuccess: () => {
          message.success('Thêm học viên vào lớp thành công');
          setSelectedLeadId(undefined);
        },
        onError: (e: any) => message.error('Lỗi khi thêm học viên: ' + e.message),
      },
    );
  }, [addStudentMutation, classData.capacity, classData.id, selectedLeadId, students]);

  const handleRemoveStudent = useCallback(
    (studentId: string) => {
      removeStudentMutation.mutate(studentId, {
        onSuccess: () => message.success('Đã xóa học viên khỏi lớp'),
        onError: (e: any) => message.error('Lỗi khi xóa học viên: ' + e.message),
      });
    },
    [removeStudentMutation],
  );

  const availableLeadOptions = useMemo(() => {
    const existingIds = new Set((students ?? []).map((s: any) => s.student_id));
    return (leadsData?.data ?? [])
      .filter((l: any) => !existingIds.has(l.id))
      .map((l: any) => ({
        value: l.id,
        label: `${l.full_name}${l.phone_number ? ` - ${l.phone_number}` : ''}`,
      }));
  }, [leadsData?.data, students]);

  const isFull = !!(classData.capacity && students && students.length >= classData.capacity);

  const resolveContact = useCallback(
    (value: string | null | undefined, record: any, emptyLabel?: string) => {
      if (maskPeerContacts && !isOwnStudentRow(record, user?.email)) {
        return value ? MASKED_CONTACT : emptyLabel ?? '';
      }
      return value || emptyLabel || '';
    },
    [maskPeerContacts, user?.email],
  );

  // ── Desktop columns ────────────────────────────────────────────────────
  const columns = useMemo(() => {
    const cols: any[] = [
      {
        title: 'Họ tên',
        dataIndex: ['leads', 'full_name'],
        key: 'full_name',
        render: (text: string) => <Text strong>{text || 'N/A'}</Text>,
      },
      {
        title: 'SĐT',
        dataIndex: ['leads', 'phone_number'],
        key: 'phone_number',
        render: (text: string, record: any) => resolveContact(text, record),
      },
      {
        title: 'Email',
        dataIndex: 'login_email',
        key: 'login_email',
        render: (text: string, record: any) => (
          <Text>{resolveContact(text, record, 'Chưa thiết lập')}</Text>
        ),
      },
      {
        title: 'Ngày tham gia',
        dataIndex: 'enrollment_date',
        key: 'enrollment_date',
        render: (t: string) => (t ? dayjs(t).format('DD/MM/YYYY') : ''),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (t: string) => {
          const meta = studentStatusMeta[t] ?? { label: t || '—', color: 'default' };
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
    ];

    if (isManager) {
      cols.push(
        {
          title: 'Đã nộp',
          dataIndex: 'paid_amount',
          key: 'paid_amount',
          render: (v: number) => <Text type="success">{formatCurrency(v || 0)}</Text>,
        },
        {
          title: 'Công nợ',
          dataIndex: 'debt_amount',
          key: 'debt_amount',
          render: (v: number) => <Text type="danger">{formatCurrency(v || 0)}</Text>,
        },
        {
          title: 'Hóa đơn',
          key: 'images',
          align: 'center',
          width: 90,
          render: (_: unknown, r: any) => (
            <Badge count={r.images?.length || 0} size="small" offset={[-2, 0]}>
              <Button size="small" icon={<PictureOutlined />} onClick={() => openFinance(r)} />
            </Badge>
          ),
        },
        {
          title: 'Hành động',
          key: 'action',
          render: (_: any, r: any) => (
            <Space>
              <Button
                type="primary"
                ghost
                shape="circle"
                icon={<EditOutlined />}
                onClick={() => openFinance(r)}
              />
              <Popconfirm
                title="Xóa khỏi lớp"
                description="Bạn có muốn xóa học viên này khỏi lớp không?"
                onConfirm={() => handleRemoveStudent(r.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button type="primary" danger ghost shape="circle" icon={<DeleteOutlined />} />
              </Popconfirm>
            </Space>
          ),
        },
      );
    }
    return cols;
  }, [handleRemoveStudent, isManager, resolveContact]);

  // ── Toolbar (dùng chung mobile + desktop) ─────────────────────────────
  const toolbar = (
    <div style={{ marginBottom: 16 }}>
      {/* Sĩ số */}
      <div style={{ marginBottom: isManager ? 12 : 0 }}>
        <Space wrap>
          <Text strong>Sĩ số hiện tại:</Text>
          <Tag color={isFull ? 'red' : 'green'} style={{ margin: 0 }}>
            {students?.length || 0}
            {classData.capacity ? ` / ${classData.capacity}` : ''}
          </Tag>
          {isFull && (
            <Text type="danger" style={{ fontSize: 13 }}>
              (Đã đầy)
            </Text>
          )}
        </Space>
      </div>

      {/* Thêm học viên — chỉ manager */}
      {isManager && (
        <Space.Compact style={{ width: '100%' }}>
          <Select
            showSearch
            style={{ flex: 1 }}
            placeholder="Chọn học viên từ Leads"
            loading={isLeadsLoading}
            value={selectedLeadId}
            onChange={setSelectedLeadId}
            optionFilterProp="label"
            options={availableLeadOptions}
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleAddStudent}
            loading={addStudentMutation.isPending}
            disabled={!selectedLeadId || isFull}
          >
            Thêm
          </Button>
        </Space.Compact>
      )}
    </div>
  );

  // ── Mobile card item ───────────────────────────────────────────────────
  const renderMobileCard = (record: any) => {
    const name = record.leads?.full_name || 'N/A';
    const phoneRaw = record.leads?.phone_number;
    const emailRaw = record.login_email;
    const phone = resolveContact(phoneRaw, record) || null;
    const email = emailRaw
      ? resolveContact(emailRaw, record)
      : null;
    const date = record.enrollment_date ? dayjs(record.enrollment_date).format('DD/MM/YYYY') : '';
    const status = studentStatusMeta[record.status] ?? {
      label: record.status || '—',
      color: 'default',
    };

    return (
      <List.Item key={record.id} style={{ padding: '0 0 12px' }}>
        <Card
          size="small"
          style={{ width: '100%', borderRadius: token.borderRadiusLG }}
          styles={{ body: { padding: '12px 14px' } }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar
              size={40}
              style={{
                background: nameToColor(name),
                flexShrink: 0,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {initials(name)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text strong style={{ fontSize: 15, display: 'block', lineHeight: '1.3' }}>
                {name}
              </Text>
              <Tag color={status.color} style={{ marginTop: 2 }}>
                {status.label}
              </Tag>
            </div>
            {isManager && (
              <Space size={6}>
                <Badge count={record.images?.length || 0} size="small" offset={[-2, 0]}>
                  <Button
                    size="small"
                    icon={<PictureOutlined />}
                    onClick={() => openFinance(record)}
                  />
                </Badge>
                <Button
                  size="small"
                  type="primary"
                  ghost
                  shape="circle"
                  icon={<EditOutlined />}
                  onClick={() => openFinance(record)}
                />
                <Popconfirm
                  title="Xóa khỏi lớp"
                  description="Xóa học viên này khỏi lớp?"
                  onConfirm={() => handleRemoveStudent(record.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger ghost shape="circle" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )}
          </div>

          {/* Thông tin liên hệ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <PhoneOutlined style={{ color: token.colorTextQuaternary, fontSize: 13 }} />
                <Text style={{ fontSize: 13 }}>{phone}</Text>
              </div>
            )}
            {email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <MailOutlined style={{ color: token.colorTextQuaternary, fontSize: 13 }} />
                <Text style={{ fontSize: 13 }} ellipsis>
                  {email}
                </Text>
              </div>
            )}
            {date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <CalendarOutlined style={{ color: token.colorTextQuaternary, fontSize: 13 }} />
                <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
                  Tham gia: {date}
                </Text>
              </div>
            )}
          </div>

          {/* Tài chính — chỉ manager */}
          {isManager && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 10,
                padding: '8px 10px',
                borderRadius: token.borderRadius,
                background: token.colorFillAlter,
              }}
            >
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 2 }}>
                  Đã nộp
                </div>
                <Text type="success" style={{ fontSize: 13, fontWeight: 600 }}>
                  {formatCurrency(record.paid_amount || 0)}
                </Text>
              </div>
              <div style={{ width: 1, background: token.colorBorderSecondary }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 2 }}>
                  Công nợ
                </div>
                <Text type="danger" style={{ fontSize: 13, fontWeight: 600 }}>
                  {formatCurrency(record.debt_amount || 0)}
                </Text>
              </div>
            </div>
          )}
        </Card>
      </List.Item>
    );
  };

  return (
    <div style={{ paddingTop: 8, paddingBottom: 8 }}>
      {toolbar}

      {isMobile ? (
        <List
          dataSource={students || []}
          loading={isLoading}
          renderItem={renderMobileCard}
          pagination={{ pageSize: 10, size: 'small', align: 'center' }}
          locale={{ emptyText: 'Chưa có học viên nào' }}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={students || []}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      )}

      <StudentFinanceModal
        open={financeModalOpen}
        onClose={() => {
          setFinanceModalOpen(false);
          setFinanceStudent(null);
        }}
        student={financeStudent}
        classId={classData.id}
        courseFee={classData.courses?.fee || 0}
      />
    </div>
  );
}
