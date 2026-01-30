'use client';

import { Layout } from 'antd';
import styles from './Footer.module.scss';

const { Footer: AntFooter } = Layout;

export function Footer() {
  return (
    <AntFooter className={styles.footer}>
      ANA CRM &copy; {new Date().getFullYear()} - Powered by Next.js & Ant Design
    </AntFooter>
  );
}
