import { I18nProvider, useTranslation } from './i18n/useTranslation';
import { ProductList } from './pages/ProductList';

function LangToggle() {
  const { t, toggleLang } = useTranslation();
  return (
    <button
      onClick={toggleLang}
      style={{
        position: 'fixed', top: 16, right: 16, zIndex: 100,
        padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db',
        background: '#fff', fontWeight: 700, fontSize: 13,
        cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {t('lang.toggle')}
    </button>
  );
}

export function App() {
  return (
    <I18nProvider>
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
        <LangToggle />
        <ProductList />
      </div>
    </I18nProvider>
  );
}
