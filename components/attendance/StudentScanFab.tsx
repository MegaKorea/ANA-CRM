'use client';

import { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { ScanOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { useUserRoleCode } from '@/lib/hooks/use-current-user';
import { StudentScannerModal } from './StudentScannerModal';
import styles from './StudentScanFab.module.scss';

/** Students only — staff mark attendance from the session list instead. */
const STUDENT_ROLE = 'STU';

/**
 * Floating scan button so a student can mark attendance from anywhere in the
 * app, instead of digging through class → schedule tab. Mobile-only: scanning
 * needs a camera, and that is the device students actually use in class.
 */
export function StudentScanFab() {
  const roleCode = useUserRoleCode();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // The QR landing page is already the attendance flow — a scan button there
  // would just interrupt the verification in progress.
  const onAttendancePage = pathname?.startsWith('/attendance/qr') ?? false;

  if (roleCode !== STUDENT_ROLE || !isMobile || onAttendancePage) return null;

  return (
    <>
      <Tooltip title="Quét mã điểm danh" placement="left">
        <Button
          type="primary"
          shape="circle"
          size="large"
          className={styles.fab}
          icon={<ScanOutlined />}
          onClick={() => setOpen(true)}
          aria-label="Quét mã điểm danh"
        />
      </Tooltip>

      <StudentScannerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
