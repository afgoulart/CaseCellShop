import { useState, useEffect, useCallback } from 'react';
import { Product, Order, fetchProducts } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { useTranslation } from '../i18n/useTranslation';

export function ProductList() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchProducts());
    } catch {
      setError(t('productList.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleSuccess = useCallback((order: Order) => {
    setLastOrder(order);
    setSelected(null);
    setProducts(prev =>
      prev.map(p =>
        p.id === order.product_id ? { ...p, stock: Math.max(0, p.stock - order.quantity) } : p
      )
    );
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <header style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#111827' }}>
          🛡️ {t('app.title')}
        </h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280' }}>{t('app.subtitle')}</p>
      </header>

      {lastOrder && (
        <div style={{
          marginBottom: 24, padding: '14px 20px', background: '#d1fae5',
          borderRadius: 10, color: '#065f46', fontSize: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>
            ✅ {t('productList.orderConfirmed', {
              id: lastOrder.id.slice(0, 8),
              invoice: lastOrder.invoice ?? '',
            })}
          </span>
          <button
            onClick={() => setLastOrder(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#065f46' }}
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 64, color: '#9ca3af' }}>
          {t('productList.loading')}
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button onClick={load} style={{ padding: '8px 20px', cursor: 'pointer' }}>
            {t('productList.retry')}
          </button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {products.map(p => (
            <ProductCard key={p.id} product={p} onSelect={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <CheckoutModal product={selected} onClose={() => setSelected(null)} onSuccess={handleSuccess} />
      )}
    </div>
  );
}
