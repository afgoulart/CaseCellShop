'use client';

import { useState } from 'react';
import { I18nProvider, useTranslation } from './i18n/useTranslation';
import { ProductList } from './views/ProductList';
import { OrderList } from './views/OrderList';
import { OrderDetail } from './views/OrderDetail';

type View =
  | { page: 'products' }
  | { page: 'orders' }
  | { page: 'order-detail'; orderId: string };

function NavBar({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  const { t, toggleLang } = useTranslation();

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    border: 'none',
    background: 'none',
    fontWeight: active ? 700 : 500,
    fontSize: 14,
    cursor: 'pointer',
    color: active ? '#2563eb' : '#374151',
    borderBottom: `2px solid ${active ? '#2563eb' : 'transparent'}`,
    transition: 'color 0.15s, border-color 0.15s',
  });

  const ordersActive = view.page === 'orders' || view.page === 'order-detail';

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#111827', userSelect: 'none' }}>
            🛡️ {t('app.title')}
          </span>
          <div style={{ display: 'flex', height: 56, alignItems: 'flex-end' }}>
            <button
              style={tabStyle(view.page === 'products')}
              onClick={() => onNavigate({ page: 'products' })}
            >
              {t('nav.products')}
            </button>
            <button
              style={tabStyle(ordersActive)}
              onClick={() => onNavigate({ page: 'orders' })}
            >
              {t('nav.myOrders')}
            </button>
          </div>
        </div>
        <button
          onClick={toggleLang}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {t('lang.toggle')}
        </button>
      </div>
    </nav>
  );
}

function AppContent() {
  const [view, setView] = useState<View>({ page: 'products' });

  return (
    <>
      <NavBar view={view} onNavigate={setView} />
      <div style={{ minHeight: 'calc(100vh - 56px)', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        {view.page === 'products' && (
          <ProductList onViewOrders={() => setView({ page: 'orders' })} />
        )}
        {view.page === 'orders' && (
          <OrderList
            onViewDetail={(id) => setView({ page: 'order-detail', orderId: id })}
          />
        )}
        {view.page === 'order-detail' && (
          <OrderDetail
            orderId={view.orderId}
            onBack={() => setView({ page: 'orders' })}
          />
        )}
      </div>
    </>
  );
}

export function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
