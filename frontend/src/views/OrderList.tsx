'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Order, fetchOrders } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { AppShell } from '../components/AppShell';
import { Breadcrumb } from '../components/Breadcrumb';
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
    <AppShell>
      <div className="max-w-[900px] mx-auto">
        <Breadcrumb crumbs={[
          { label: t('nav.products'), href: '/' },
          { label: t('orderList.title') },
        ]} />
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 mb-8">{t('orderList.title')}</h1>

        {loading && (
          <div className="text-center py-16 text-slate-400">{t('orderList.loading')}</div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={load}
              className="px-5 py-2 border border-slate-200 rounded-lg bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t('orderList.retry')}
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            {t('orderList.empty')}
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="flex flex-col gap-3">
            {orders.map(order => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono font-bold text-[13px] text-slate-700">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <span className="text-sm text-slate-800 font-medium block">
                    {order.product_name ?? `Produto #${order.product_id}`}
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {t('orderList.qty')}: {order.quantity}
                    {order.product_price !== undefined && (
                      <> · {(order.product_price * order.quantity).toLocaleString(locale, { style: 'currency', currency: 'BRL' })}</>
                    )}
                    {' · '}{new Date(order.created_at).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-lg font-semibold text-[13px] text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  {t('orderList.viewDetail')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
