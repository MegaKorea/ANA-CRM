'use client';

import { useState, type ReactNode } from 'react';
import { Layout } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import styles from './Layout.module.scss';

const { Content } = Layout;

interface CRMLayoutProps {
  children: ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const siderWidth = collapsed ? 80 : 260;

  return (
    <Layout className={styles.layout}>
      <Sidebar collapsed={collapsed} />

      <Layout
        className={styles.contentWrapper}
        style={{
          marginLeft: siderWidth,
        }}
      >
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

        <Content className={styles.content}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
