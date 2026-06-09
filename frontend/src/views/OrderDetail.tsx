'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Order, fetchOrder } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { AppShell } from '../components/AppShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  orderId: string;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-3.5 border-b border-slate-100 gap-4 last:border-0">
      <span className="text-sm text-slate-500 font-medium shrink-0">{label}</span>
      <span className="text-sm text-slate-800 font-medium text-right">{children}</span>
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
    <AppShell>
      <div className="max-w-[680px] mx-auto">
        <Breadcrumb crumbs={[
          { label: t('nav.products'), href: '/' },
          { label: t('orderList.title'), href: '/orders' },
          { label: t('orderDetail.title') },
        ]} />

        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 mb-6">{t('orderDetail.title')}</h1>

        {loading && (
          <div className="text-center py-16 text-slate-400">{t('orderList.loading')}</div>
        )}

        {error && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.push('/orders')}
              className="px-5 py-2 border border-slate-200 rounded-lg bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ← {t('orderDetail.back')}
            </button>
          </div>
        )}

        {!loading && !error && order && (
          <div className="bg-white border border-slate-200 rounded-2xl px-7 py-6 shadow-sm">
            <div className="flex justify-between items-center mb-5 pb-5 border-b-2 border-slate-100">
              <span className="font-mono font-bold text-lg text-slate-800 tracking-wide">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <StatusBadge status={order.status} />
            </div>

            <DetailRow label={t('orderDetail.product')}>{order.product_name ?? `#${order.product_id}`}</DetailRow>
            <DetailRow label={t('orderDetail.quantity')}>{order.quantity}</DetailRow>

            {order.product_price !== undefined && (
              <DetailRow label={t('orderDetail.total')}>
                <strong className="text-emerald-600">
                  {(order.product_price * order.quantity).toLocaleString(locale, { style: 'currency', currency: 'BRL' })}
                </strong>
              </DetailRow>
            )}

            {order.invoice && (
              <DetailRow label={t('orderDetail.invoice')}>
                <code className="bg-slate-100 px-2 py-0.5 rounded text-[13px] font-mono text-slate-700">
                  {order.invoice}
                </code>
              </DetailRow>
            )}

            <DetailRow label={t('orderDetail.date')}>
              {new Date(order.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
            </DetailRow>

            {order.error_message && (
              <DetailRow label={t('orderDetail.error')}>
                <span className="text-red-500">{order.error_message}</span>
              </DetailRow>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
