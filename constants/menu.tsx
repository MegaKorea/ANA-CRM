import type { MenuProps } from 'antd';
import { UserOutlined, TeamOutlined, SafetyOutlined, ContactsOutlined, BookOutlined, ReadOutlined } from '@ant-design/icons';


export type MenuItem = Required<MenuProps>['items'][number];


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
    roles: ['ADMIN'],
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
    roles: ['ADMIN', 'SALE', 'MKT', 'TEA', 'AO'],
  },
  {
    key: '/lms',
    icon: <ReadOutlined />,
    label: 'LMS',
    children: [
      {
        key: '/course',
        icon: <BookOutlined />,
        label: 'KHÓA HỌC',
        roles: ['ADMIN', 'SALE', 'MKT', 'TEA', 'AO'],
      },
      {
        key: '/class',
        icon: <TeamOutlined />,
        label: 'LỚP HỌC',
      },
    ],
  },
];
