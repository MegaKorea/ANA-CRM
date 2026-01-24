import { CRMLayout } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CRMLayout>{children}</CRMLayout>;
}
