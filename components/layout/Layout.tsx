'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { Layout } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PageTransitionOverlay } from '@/components/common/PageTransitionOverlay';
import { useNavigation } from '@/lib/contexts/navigation.context';
import styles from './Layout.module.scss';

const { Content } = Layout;

interface CRMLayoutProps {
  children: ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { isNavigating } = useNavigation();

  const siderWidth = collapsed ? 80 : 260;

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <Layout className={styles.layout}>
      <Sidebar collapsed={collapsed} />

      <Layout
        className={styles.contentWrapper}
        style={{
          marginLeft: siderWidth,
        }}
      >
        <Header collapsed={collapsed} onToggle={handleToggle} />

        <Content className={styles.content}>
          {children}
        </Content>
      </Layout>

      <PageTransitionOverlay visible={isNavigating} />
    </Layout>
  );
}
