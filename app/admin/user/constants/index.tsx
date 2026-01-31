import { Button, Popconfirm, Space, Avatar } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HiOutlinePencilAlt, HiOutlineTrash } from 'react-icons/hi';
import { UserStatusDb } from '@/constants/enums';
import type { User } from '@/lib/services/user.service';
import type { RolesTable } from '@/types/tables/roles';
import defaultAvatar from '@/app/assets/avatar/avt.webp';

type RoleRow = RolesTable['Row'];

export enum UserPagePadding {
  CONTAINER = 24,
}

export enum UserPageMargin {
  HEADER_BOTTOM = 16,
}

export enum UserPageGap {
  ACTIONS = 8,
}

export enum UserTableColumnWidth {
  ID = 80,
  ACTION = 180,
}

export enum UserActionIconSize {
  DEFAULT = 20,
}

export enum Sex {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export const UserPageText = {
  TITLE: 'Quản lý người dùng',
  BUTTON_REFRESH: 'Làm mới',
  BUTTON_CREATE: 'Thêm người dùng',
  COLUMN_ID: 'ID',
  COLUMN_FULL_NAME: 'Họ và tên',
  COLUMN_EMAIL: 'Email',
  COLUMN_PHONE: 'Số điện thoại',
  COLUMN_ROLE: 'Vai trò',
  COLUMN_STATUS: 'Trạng thái',
  COLUMN_SEX: 'Giới tính',
  COLUMN_AGE: 'Tuổi',
  COLUMN_ADDRESS: 'Địa chỉ',
  COLUMN_BIRTH_DAY: 'Ngày sinh',
  COLUMN_ACTION: 'Thao tác',
  MODAL_CREATE_TITLE: 'Thêm người dùng',
  MODAL_EDIT_TITLE: 'Chỉnh sửa người dùng',
  FIELD_FULL_NAME_LABEL: 'Họ và tên',
  FIELD_FULL_NAME_PLACEHOLDER: 'Nhập họ và tên',
  FIELD_EMAIL_LABEL: 'Email',
  FIELD_EMAIL_PLACEHOLDER: 'Nhập email',
  FIELD_PHONE_LABEL: 'Số điện thoại',
  FIELD_PHONE_PLACEHOLDER: 'Nhập số điện thoại',
  FIELD_ROLE_LABEL: 'Vai trò',
  FIELD_ROLE_PLACEHOLDER: 'Chọn vai trò',
  FIELD_PASSWORD_LABEL: 'Mật khẩu',
  FIELD_PASSWORD_PLACEHOLDER: 'Nhấn nút để sinh mật khẩu mạnh (để trống sẽ để hệ thống tự sinh)',
  FIELD_SEX_LABEL: 'Giới tính',
  FIELD_SEX_PLACEHOLDER: 'Nhập giới tính',
  FIELD_AGE_LABEL: 'Tuổi',
  FIELD_AGE_PLACEHOLDER: 'Nhập tuổi',
  FIELD_ADDRESS_LABEL: 'Địa chỉ',
  FIELD_ADDRESS_PLACEHOLDER: 'Nhập địa chỉ',
  FIELD_BIRTH_DAY_LABEL: 'Ngày sinh',
  FIELD_BIRTH_DAY_PLACEHOLDER: 'Chọn ngày sinh',
  ACTION_EDIT: 'Sửa',
  ACTION_DELETE: 'Xóa',
  DELETE_TITLE: 'Xóa người dùng',
  DELETE_DESCRIPTION: 'Bạn có chắc chắn muốn xóa người dùng này?',
  DELETE_OK_TEXT: 'Xóa',
  DELETE_CANCEL_TEXT: 'Hủy',
  SUCCESS_CREATE: 'Tạo người dùng thành công',
  SUCCESS_UPDATE: 'Cập nhật người dùng thành công',
  SUCCESS_DELETE: 'Xóa người dùng thành công',
  SUCCESS_REFRESH: 'Đã làm mới danh sách người dùng',
  ERROR_GENERIC: 'Có lỗi xảy ra',
  BUTTON_GENERATE_PASSWORD: 'Sinh mật khẩu',
} as const;

export const UserStatusLabel = {
  [UserStatusDb.ACTIVE]: 'Hoạt động',
  [UserStatusDb.BANNED]: 'Bị chặn',
  [UserStatusDb.DELETED]: 'Đã xóa',
} as const;


export const SexLabel = {
  [Sex.MALE]: 'Nam',
  [Sex.FEMALE]: 'Nữ',
  [Sex.OTHER]: 'Khác',
} as const;

export type HandleOpenUserModal = (user?: User) => void;

export type HandleDeleteUser = (id: string) => void;

export const getUserTableColumns = ({
  roles,
  handleOpenModal,
  handleDelete,
}: {
  roles: RoleRow[] | undefined;
  handleOpenModal: HandleOpenUserModal;
  handleDelete: HandleDeleteUser;
}): ColumnsType<User> => [
  {
    title: UserPageText.COLUMN_ID,
    dataIndex: 'id',
    key: 'id',
    width: UserTableColumnWidth.ID,
    render: (_, record) => record.id.slice(0, 4),
  },
  {
    title: UserPageText.COLUMN_FULL_NAME,
    dataIndex: 'full_name',
    key: 'full_name',
    render: (fullName: string, record: User) => {
      const avatarSrc: string = record.avatar || (typeof defaultAvatar === 'string' ? defaultAvatar : defaultAvatar.src);
      return (
        <Space>
          <Avatar src={avatarSrc} alt={fullName} />
          <span>{fullName}</span>
        </Space>
      );
    },
  },
  {
    title: UserPageText.COLUMN_EMAIL,
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: UserPageText.COLUMN_PHONE,
    dataIndex: 'phone',
    key: 'phone',
  },
  {
    title: UserPageText.COLUMN_ROLE,
    dataIndex: 'role_id',
    key: 'role_id',
    render: (roleId: number) => {
      const matchedRole = roles?.find((role) => role.id === roleId);
      if (!matchedRole) {
        return null;
      }
      return matchedRole.name;
    },
  },
  {
    title: UserPageText.COLUMN_STATUS,
    dataIndex: 'status',
    key: 'status',
    render: (status: string | null) => {
      if (!status) {
        return null;
      }
      return UserStatusLabel[status as keyof typeof UserStatusLabel] ?? status;
    },
  },
  {
    title: UserPageText.COLUMN_SEX,
    dataIndex: 'sex',
    key: 'sex',
    render: (sex: string | null) => {
      if (!sex) {
        return null;
      }
      return SexLabel[sex as keyof typeof SexLabel] ?? sex;
    },
  },
  {
    title: UserPageText.COLUMN_AGE,
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: UserPageText.COLUMN_ADDRESS,
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: UserPageText.COLUMN_BIRTH_DAY,
    dataIndex: 'birth_day',
    key: 'birth_day',
  },
  {
    title: UserPageText.COLUMN_ACTION,
    key: 'action',
    align: 'center',
    width: UserTableColumnWidth.ACTION,
    render: (_: unknown, record: User) => (
      <Space>
        <Button onClick={() => handleOpenModal(record)}>
          <HiOutlinePencilAlt size={UserActionIconSize.DEFAULT} />
        </Button>
        <Popconfirm
          title={UserPageText.DELETE_TITLE}
          description={UserPageText.DELETE_DESCRIPTION}
          onConfirm={() => handleDelete(record.id)}
          okText={UserPageText.DELETE_OK_TEXT}
          cancelText={UserPageText.DELETE_CANCEL_TEXT}
        >
          <Button danger>
            <HiOutlineTrash size={UserActionIconSize.DEFAULT} />
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];