import { useState, useMemo } from 'react';
import { App, Card, Select, Button, Table, Space, Typography, Popconfirm, Form, Input } from 'antd';
import { DeleteOutlined, UserAddOutlined, SaveOutlined } from '@ant-design/icons';
import type { Class } from '@/lib/services/class.service';
import { useUsers } from '@/lib/hooks/use-users';
import { useUpdateClass, useSubjectTeachers, useAddSubjectTeacher, useRemoveSubjectTeacher } from '@/lib/hooks/use-classes';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';

const { Text, Title } = Typography;

export function TabTeachers({ classData }: { classData: Class }) {
  const { message } = App.useApp();
  const { hasPermission: isManager } = useAuthPermission(['ADMIN', 'AO']);
  const { data: teachers, isLoading: isTeachersLoading } = useUsers({ roleCode: 'TEA' });
  const teacherOptions = useMemo(() => {
    return (teachers || []).map((t) => ({
      value: t.id,
      label: `${t.full_name}${t.phone ? ` - ${t.phone}` : ''}`,
    }));
  }, [teachers]);

  const updateClassMutation = useUpdateClass();
  const [homeroomTeacherId, setHomeroomTeacherId] = useState<string | null>(classData.homeroom_teacher_id || null);

  const handleUpdateHomeroomTeacher = () => {
    if (!classData.id) return;
    updateClassMutation.mutate(
      { id: classData.id, data: { homeroom_teacher_id: homeroomTeacherId } },
      {
        onSuccess: () => message.success('Cập nhật giáo viên chủ nhiệm thành công'),
        onError: (e: any) => message.error('Lỗi khi cập nhật giáo viên chủ nhiệm: ' + e.message),
      }
    );
  };

  const { data: subjectTeachers, isLoading: isSubjectTeachersLoading } = useSubjectTeachers(classData.id);
  const addSubjectTeacherMutation = useAddSubjectTeacher(classData.id);
  const removeSubjectTeacherMutation = useRemoveSubjectTeacher(classData.id);

  const subjectTeacherOptions = useMemo(() => {
    const assignedIds = new Set((subjectTeachers || []).map((st) => st.teacher_id));
    return teacherOptions.filter((opt) => !assignedIds.has(opt.value));
  }, [teacherOptions, subjectTeachers]);

  const [form] = Form.useForm();

  const handleAddSubjectTeacher = (values: { teacher_id: string; subject: string }) => {
    addSubjectTeacherMutation.mutate(
      { classId: classData.id, teacherId: values.teacher_id, subject: values.subject },
      {
        onSuccess: () => {
          message.success('Thêm giáo viên bộ môn thành công');
          form.resetFields();
        },
        onError: (e: any) => message.error('Lỗi khi thêm giáo viên bộ môn: ' + e.message),
      }
    );
  };

  const handleRemoveSubjectTeacher = (id: string) => {
    removeSubjectTeacherMutation.mutate(id, {
      onSuccess: () => message.success('Đã xóa giáo viên bộ môn khỏi lớp'),
      onError: (e: any) => message.error('Lỗi khi xóa giáo viên bộ môn: ' + e.message),
    });
  };

  const subjectTeacherColumns = [
    {
      title: 'Giáo viên',
      dataIndex: ['users', 'full_name'],
      key: 'full_name',
      render: (text: string) => <Text strong>{text || 'N/A'}</Text>,
    },
    {
      title: 'Bộ môn',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => {
        if (!isManager) return null;
        return (
          <Popconfirm
            title="Xóa giáo viên bộ môn"
            description="Bạn có mốn xóa giáo viên này khỏi lớp không?"
            onConfirm={() => handleRemoveSubjectTeacher(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger ghost shape="circle" icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div style={{ paddingTop: 8, paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card title="Giáo viên chủ nhiệm" size="small" styles={{ body: { padding: '16px' } }}>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Text>Chọn giáo viên chủ nhiệm cho lớp học này:</Text>
          <Space.Compact style={{ width: '100%', maxWidth: 500 }}>
            <Select
              showSearch
              style={{ flex: 1 }}
              placeholder="Chọn giáo viên"
              loading={isTeachersLoading}
              value={homeroomTeacherId}
              onChange={setHomeroomTeacherId}
              optionFilterProp="label"
              options={teacherOptions}
              disabled={!isManager}
              allowClear
            />
            {isManager && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleUpdateHomeroomTeacher}
                loading={updateClassMutation.isPending}
                disabled={homeroomTeacherId === classData.homeroom_teacher_id}
              >
                Lưu
              </Button>
            )}
          </Space.Compact>
        </Space>
      </Card>

      {/* Subject Teachers Section */}
      <Card title="Giáo viên bộ môn" size="small" styles={{ body: { padding: '16px' } }}>
        {isManager && (
          <div style={{ marginBottom: 16 }}>
            <Form
              form={form}
              layout="inline"
              onFinish={handleAddSubjectTeacher}
              style={{ flexWrap: 'nowrap' }}
            >
              <Form.Item
                name="teacher_id"
                rules={[{ required: true, message: 'Vui lòng chọn giáo viên' }]}
                style={{ flex: 1 }}
              >
                <Select
                  showSearch
                  placeholder="Chọn giáo viên"
                  loading={isTeachersLoading}
                  optionFilterProp="label"
                  options={subjectTeacherOptions}
                />
              </Form.Item>
              <Form.Item
                name="subject"
                rules={[{ required: true, message: 'Vui lòng nhập môn học' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Tên bộ môn (vd: Toán, Ngữ Văn...)" />
              </Form.Item>
              <Form.Item style={{ marginRight: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<UserAddOutlined />}
                  loading={addSubjectTeacherMutation.isPending}
                >
                  Thêm
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}

        <Table
          columns={subjectTeacherColumns}
          dataSource={subjectTeachers || []}
          rowKey="id"
          loading={isSubjectTeachersLoading}
          pagination={false}
          size="middle"
          locale={{ emptyText: 'Chưa có giáo viên bộ môn nào' }}
        />
      </Card>
    </div>
  );
}
