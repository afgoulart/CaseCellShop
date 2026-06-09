'use client';

import Link from 'next/link';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  const { t, toggleLang } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 bg-slate-900 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">CC</span>
            </div>
            <span className="text-white font-bold text-lg">{t('app.brand')}</span>
            <span className="text-slate-400 text-lg">{t('app.brandSub')}</span>
          </div>
        </Link>
        <span className="sm:hidden absolute left-1/2 -translate-x-1/2 text-primary-500 font-bold text-lg">
          {t('app.brand')}
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLang}
            className="text-xl leading-none hover:scale-110 active:scale-95 transition-transform"
            aria-label="Toggle language"
          >
            {t('lang.toggle')}
          </button>
          <Link href="/orders" className="text-white text-sm font-medium hover:text-primary-400 transition-colors hidden sm:block">
            {t('nav.myOrders')}
          </Link>
          <Link href="/" className="text-white text-xl">🛒</Link>
        </div>
      </header>

      <main className="px-4 sm:px-8 lg:px-20 py-8 sm:py-10 max-w-[1280px] mx-auto">
        {children}
      </main>
    </div>
  );
}
