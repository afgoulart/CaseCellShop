'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Order, fetchOrder } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  orderId: string;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '13px 0', borderBottom: '1px solid #f3f4f6', gap: 16 }}>
      <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#111827', fontWeight: 500, textAlign: 'right' }}>{children}</span>
    </div>
  );
}

export function OrderDetail({ orderId }: Props) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrder(await fetchOrder(orderId));
    } catch {
      setError(t('orderDetail.notFound'));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>
      <button
        onClick={() => router.push('/orders')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontWeight: 600, fontSize: 14, padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        ← {t('orderDetail.back')}
      </button>

      <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 800, color: '#111827' }}>
        {t('orderDetail.title')}
      </h1>

      {loading && <div style={{ textAlign: 'center', padding: 64, color: '#9ca3af' }}>{t('orderList.loading')}</div>}

      {error && (
        <div style={{ textAlign: 'center', padding: 48, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>
          <button onClick={() => router.push('/orders')} style={{ padding: '8px 20px', cursor: 'pointer', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff' }}>
            ← {t('orderDetail.back')}
          </button>
        </div>
      )}

      {!loading && !error && order && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '2px solid #f3f4f6' }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#111827', fontFamily: 'monospace', letterSpacing: 1 }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            <StatusBadge status={order.status} />
          </div>

          <DetailRow label={t('orderDetail.product')}>{order.product_name ?? `#${order.product_id}`}</DetailRow>
          <DetailRow label={t('orderDetail.quantity')}>{order.quantity}</DetailRow>

          {order.product_price !== undefined && (
            <DetailRow label={t('orderDetail.total')}>
              <strong style={{ color: '#059669' }}>
                {(order.product_price * order.quantity).toLocaleString(locale, { style: 'currency', currency: 'BRL' })}
              </strong>
            </DetailRow>
          )}

          {order.invoice && (
            <DetailRow label={t('orderDetail.invoice')}>
              <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace', color: '#374151' }}>
                {order.invoice}
              </code>
            </DetailRow>
          )}

          <DetailRow label={t('orderDetail.date')}>
            {new Date(order.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
          </DetailRow>

          {order.error_message && (
            <DetailRow label={t('orderDetail.error')}>
              <span style={{ color: '#dc2626' }}>{order.error_message}</span>
            </DetailRow>
          )}
        </div>
      )}
    </div>
  );
}
