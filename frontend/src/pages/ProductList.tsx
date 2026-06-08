import { useState, useEffect, useCallback } from 'react';
import { Product, Order, fetchProducts } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  onViewOrders?: () => void;
}

export function ProductList({ onViewOrders }: Props) {
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
        <p style={{ margin: 0, fontSize: 15, color: '#6b7280' }}>{t('app.subtitle')}</p>
      </header>

      {lastOrder && (
        <div style={{
          marginBottom: 24, padding: '14px 20px', background: '#d1fae5',
          borderRadius: 10, color: '#065f46', fontSize: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 12,
        }}>
          <span>
            ✅ {t('productList.orderConfirmed', {
              id: lastOrder.id.slice(0, 8),
              invoice: lastOrder.invoice ?? '',
            })}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {onViewOrders && (
              <button
                onClick={onViewOrders}
                style={{
                  background: '#065f46', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '5px 12px', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                {t('productList.viewOrders')}
              </button>
            )}
            <button
              onClick={() => setLastOrder(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#065f46' }}
            >
              ×
            </button>
          </div>
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
