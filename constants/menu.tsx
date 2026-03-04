import type { MenuProps } from 'antd';
import { UserOutlined, TeamOutlined, SafetyOutlined, ContactsOutlined, BookOutlined } from '@ant-design/icons';

// Base Ant Design menu item type
export type MenuItem = Required<MenuProps>['items'][number];

// Our custom app menu item type with roles
export type AppMenuItem = {
  key: string;
  icon?: React.ReactNode;
  label: React.ReactNode;
  roles?: string[];
  children?: AppMenuItem[];
};

export const menuItems: AppMenuItem[] = [
  {
    key: '/admin',
    icon: <UserOutlined />,
    label: 'QUẢN TRỊ',
    roles: ['ADMIN'], // Hide menu if not admin
    children: [

      {
        key: '/admin/user',
        icon: <TeamOutlined />,
        label: 'NGƯỜI DÙNG',
      },
      {
        key: '/admin/user/role',
        icon: <SafetyOutlined />,
        label: 'VAI TRÒ',
      },
    ],
  },
  {
    key: '/lead',
    icon: <ContactsOutlined />,
    label: 'DATA',
  },
  {
    key: '/course',
    icon: <BookOutlined />,
    label: 'KHÓA HỌC',
  },
];
