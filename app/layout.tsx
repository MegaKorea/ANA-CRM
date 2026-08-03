import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import { AppProviders } from '@/providers';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import logoAna from '@/app/assets/logo/logo-ana.png';
import './scss/index.scss';

const lexend = Lexend({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ANA CRM',
  description: 'Hệ thống LMS ANA',
  icons: {
    icon: logoAna.src,
    shortcut: logoAna.src,
    apple: logoAna.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={lexend.variable}>
        <AppProviders>
          <ConditionalLayout>{children}</ConditionalLayout>
        </AppProviders>
      </body>
    </html>
  );
}
