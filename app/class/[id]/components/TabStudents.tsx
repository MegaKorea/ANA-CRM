import { useCallback, useMemo, useState } from 'react';
import {
  App,
  Button,
  Table,
  Space,
  Tag,
  Popconfirm,
  Select,
  Typography,
  Badge,
  Empty,
  Pagination,
  Spin,
} from 'antd';
import {
  DeleteOutlined,
  UserAddOutlined,
  EditOutlined,
  PictureOutlined,
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
import { getErrorMessage } from '@/lib/utils/get-error-message';
import { StudentFinanceModal } from './StudentFinanceModal';
import { StudentMobileCard } from './StudentMobileCard';
import { MASKED_CONTACT, formatCurrency, isOwnStudentRow, studentStatusMeta } from './student-roster.utils';

const { Text } = Typography;

export function TabStudents({ classData }: { classData: Class }) {
  const { message } = App.useApp();
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
  const [mobilePage, setMobilePage] = useState(1);
  const safeMobilePage = Math.min(
    mobilePage,
    Math.max(1, Math.ceil((students?.length ?? 0) / 10)),
  );

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
        onError: (error: unknown) => {
          message.error(getErrorMessage(error, 'Lỗi khi thêm học viên'));
        },
      },
    );
  }, [addStudentMutation, classData.capacity, classData.id, message, selectedLeadId, students]);

  const handleRemoveStudent = useCallback(
    (studentId: string) => {
      removeStudentMutation.mutate(studentId, {
        onSuccess: () => message.success('Đã xóa học viên khỏi lớp'),
        onError: (error: unknown) => {
          message.error(getErrorMessage(error, 'Lỗi khi xóa học viên'));
        },
      });
    },
    [message, removeStudentMutation],
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
            showSearch={{ optionFilterProp: 'label' }}
            style={{ flex: 1 }}
            placeholder="Chọn học viên từ Leads"
            loading={isLeadsLoading}
            value={selectedLeadId}
            onChange={setSelectedLeadId}
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

  return (
    <div style={{ paddingTop: 8, paddingBottom: 8 }}>
      {toolbar}

      {isMobile ? (
        isLoading ? (
          <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
        ) : !students?.length ? (
          <Empty description="Chưa có học viên nào" />
        ) : (
          <>
            <div role="list">
              {students.slice((safeMobilePage - 1) * 10, safeMobilePage * 10).map((record: any) => (
                <StudentMobileCard
                  key={record.id}
                  record={record}
                  isManager={isManager}
                  resolveContact={resolveContact}
                  onOpenFinance={openFinance}
                  onRemove={handleRemoveStudent}
                />
              ))}
            </div>
            <Pagination
              current={safeMobilePage}
              pageSize={10}
              total={students.length}
              size="small"
              align="center"
              showSizeChanger={false}
              onChange={setMobilePage}
            />
          </>
        )
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
