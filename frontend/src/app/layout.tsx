import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { I18nProvider } from '../i18n/useTranslation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CaseCellShop — Capinhas para Celular',
  description: 'Mini checkout de capinhas de celular com controle de estoque e resiliência a falhas do ERP.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
