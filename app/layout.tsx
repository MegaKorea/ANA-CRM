import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AppProviders } from '@/providers';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import logoAna from '@/app/assets/logo/logo-ana.png';
import { ThemeMode, ThemeStorageKey } from '@/constants/enums/theme.enum';
import './scss/index.scss';

export const metadata: Metadata = {
  title: 'ANA CRM',
  description: 'Hệ thống LMS ANA',
  icons: {
    icon: logoAna.src,
    shortcut: logoAna.src,
    apple: logoAna.src,
  },
};

// Runs before first paint so a reload in dark mode never flashes the light theme.
const themeBootScript = `try{if(localStorage.getItem('${ThemeStorageKey.MODE}')==='${ThemeMode.DARK}')document.documentElement.classList.add('${ThemeMode.DARK}')}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <AntdRegistry>
          <AppProviders>
            <ConditionalLayout>{children}</ConditionalLayout>
          </AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
