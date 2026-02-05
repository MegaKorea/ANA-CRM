import { Button, Space, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Role } from '@/lib/services/role.service';
import { HiOutlinePencilAlt, HiOutlineTrash } from 'react-icons/hi';

export enum RolePagePadding {
  CONTAINER = 24,
}

export enum RolePageMargin {
  HEADER_BOTTOM = 16,
}

export enum RolePageGap {
  ACTIONS = 8,
}

export enum RoleTableColumnWidth {
  ID = 80,
  ACTION = 150,
}

export enum RoleActionIconSize {
  DEFAULT = 20,
}

export const RolePageText = {
  TITLE: 'Quản lý vai trò',
  BUTTON_REFRESH: 'Làm mới',
  BUTTON_CREATE: 'Thêm vai trò',
  COLUMN_ID: 'ID',
  COLUMN_NAME: 'Tên vai trò',
  COLUMN_CODE: 'Mã vai trò',
  COLUMN_DESCRIPTION: 'Mô tả',
  COLUMN_ACTION: 'Thao tác',
  MODAL_CREATE_TITLE: 'Thêm vai trò',
  MODAL_EDIT_TITLE: 'Sửa vai trò',
  FIELD_NAME_LABEL: 'Tên vai trò',
  FIELD_NAME_PLACEHOLDER: 'Nhập tên vai trò',
  FIELD_CODE_LABEL: 'Mã vai trò',
  FIELD_CODE_PLACEHOLDER: 'Nhập mã vai trò',
  FIELD_DESCRIPTION_LABEL: 'Mô tả',
  FIELD_DESCRIPTION_PLACEHOLDER: 'Nhập mô tả (tùy chọn)',
  ACTION_EDIT: 'Sửa',
  ACTION_DELETE: 'Xóa',
  DELETE_TITLE: 'Xóa vai trò',
  DELETE_DESCRIPTION: 'Bạn có chắc chắn muốn xóa vai trò này?',
  DELETE_OK_TEXT: 'Xóa',
  DELETE_CANCEL_TEXT: 'Hủy',
  BUTTON_SUBMIT_CREATE: 'Tạo mới',
  BUTTON_SUBMIT_UPDATE: 'Cập nhật',
  BUTTON_CANCEL: 'Hủy',
  SUCCESS_CREATE: 'Tạo vai trò thành công',
  SUCCESS_UPDATE: 'Cập nhật vai trò thành công',
  SUCCESS_DELETE: 'Xóa vai trò thành công',
  SUCCESS_REFRESH: 'Đã làm mới danh sách vai trò',
  ERROR_GENERIC: 'Có lỗi xảy ra',
} as const;

export type HandleOpenRoleModal = (role?: Role) => void;

export type HandleDeleteRole = (id: number) => void;

export function createRoleColumns(
  handleOpenModal: HandleOpenRoleModal,
  handleDelete: HandleDeleteRole
): ColumnsType<Role> {
  return [
    {
      title: RolePageText.COLUMN_ID,
      dataIndex: 'id',
      key: 'id',
      width: RoleTableColumnWidth.ID,
    },
    {
      title: RolePageText.COLUMN_NAME,
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: RolePageText.COLUMN_CODE,
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: RolePageText.COLUMN_DESCRIPTION,
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: RolePageText.COLUMN_ACTION,
      key: 'action',
      align: 'center',
      width: RoleTableColumnWidth.ACTION,
      render: (_: unknown, record: Role) => (
        <Space>
          <Button onClick={() => handleOpenModal(record)}>
            <HiOutlinePencilAlt size={RoleActionIconSize.DEFAULT} />
          </Button>
          <Popconfirm
            title={RolePageText.DELETE_TITLE}
            description={RolePageText.DELETE_DESCRIPTION}
            onConfirm={() => handleDelete(record.id)}
            okText={RolePageText.DELETE_OK_TEXT}
            cancelText={RolePageText.DELETE_CANCEL_TEXT}
          >
            <Button danger>
              <HiOutlineTrash size={RoleActionIconSize.DEFAULT} />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
