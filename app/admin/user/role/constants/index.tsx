import { Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Role } from '@/lib/services/role.service';
import { HiOutlinePencilAlt, HiOutlineTrash } from 'react-icons/hi';

export function createRoleColumns(
  onEdit: (role: Role) => void,
  onDelete: (id: number) => void
): ColumnsType<Role> {
  return [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mã vai trò',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => onEdit(record)}
          >
           <HiOutlinePencilAlt size={20} />
          </Button>
          <Popconfirm
            title="Xóa vai trò"
            description="Bạn có chắc chắn muốn xóa vai trò này?"
            onConfirm={() => onDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              danger   
            >
              <HiOutlineTrash size={20} />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
