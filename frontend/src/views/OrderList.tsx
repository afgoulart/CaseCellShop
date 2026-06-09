'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, fetchOrders } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { useTranslation } from '../i18n/useTranslation';

export function OrderList() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchOrders());
    } catch {
      setError(t('orderList.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <header style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ color: '#2563eb', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          ← {t('nav.products')}
        </Link>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>
          {t('orderList.title')}
        </h1>
      </header>

      {loading && (
        <div style={{ textAlign: 'center', padding: 64, color: '#9ca3af' }}>
          {t('orderList.loading')}
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>
          <button onClick={load} style={{ padding: '8px 20px', cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff' }}>
            {t('orderList.retry')}
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, color: '#9ca3af', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          {t('orderList.empty')}
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#374151', fontFamily: 'monospace' }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <span style={{ fontSize: 14, color: '#111827', display: 'block', fontWeight: 500 }}>
                  {order.product_name ?? `Produto #${order.product_id}`}
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginTop: 2 }}>
                  {t('orderList.qty')}: {order.quantity}
                  {order.product_price !== undefined && (
                    <> · {(order.product_price * order.quantity).toLocaleString(locale, { style: 'currency', currency: 'BRL' })}</>
                  )}
                  {' · '}{new Date(order.created_at).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <button
                onClick={() => router.push(`/orders/${order.id}`)}
                style={{ padding: '8px 16px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {t('orderList.viewDetail')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
