import type { MenuProps } from 'antd';
import { UserOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons';

export type MenuItem = Required<MenuProps>['items'][number];

export const menuItems: MenuItem[] = [
  {
    key: '/admin',
    icon: <UserOutlined />,
    label: 'QUẢN TRỊ',
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
];
