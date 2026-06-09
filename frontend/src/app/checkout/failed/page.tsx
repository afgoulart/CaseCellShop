'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order, fetchOrder } from '../../../api/client';
import { StatusBadge } from '../../../components/StatusBadge';
import { useTranslation } from '../../../i18n/useTranslation';

function FailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US';

  useEffect(() => {
    if (!orderId) { router.replace('/'); return; }
    fetchOrder(orderId)
      .then(setOrder)
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false));
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-slate-400">{t('checkout.processing')}</span>
      </div>
    );
  }

  if (!order) return null;

  const total = order.product_price
    ? (order.product_price * order.quantity).toLocaleString(locale, { style: 'currency', currency: 'BRL' })
    : '—';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 bg-slate-900 flex items-center px-8 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-white transition-colors">
          ← {t('orderStatus.continueShopping')}
        </Link>
        <div className="flex-1 text-center">
          <span className="text-primary-500 font-bold text-xl">{t('app.brand')}</span>
        </div>
        <div className="w-24" />
      </header>
      <div className="flex items-start justify-center p-6 sm:p-10">
        <div className="w-full max-w-[560px] bg-white rounded-2xl shadow-lg px-8 sm:px-10 py-10 pb-8">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-3xl text-red-500">✕</div>
          </div>
          <h2 className="text-center text-[28px] font-bold text-slate-800 mb-2">
            {t('checkout.errors.erp_unavailable')}
          </h2>
          <p className="text-center text-slate-500 text-[15px] mb-4">{t('checkout.errors.erp_detail')}</p>
          <div className="flex justify-center mb-5"><StatusBadge status="failed" /></div>
          <hr className="border-slate-200 mb-5" />
          <div className="bg-slate-50 rounded-xl p-5 mb-5 space-y-3">
            {[
              [t('orderStatus.order'), `#ORD-${order.id.slice(0, 4).toUpperCase()}`],
              [t('orderStatus.product'), order.product_name ?? '—'],
              [t('orderStatus.quantity'), String(order.quantity)],
              [t('orderStatus.totalPaid'), total],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-800 font-medium">{value}</span>
              </div>
            ))}
            {order.error_message && (
              <div className="pt-2 border-t border-slate-200 text-xs text-red-500">{order.error_message}</div>
            )}
          </div>
          <hr className="border-slate-200 mb-5" />
          <Link
            href={`/?productDetails=${order.product_id}`}
            className="w-full py-3.5 bg-primary-500 text-white font-semibold text-base rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-3"
          >
            ↻ {t('checkout.retry')}
          </Link>
          <Link href="/" className="w-full py-2.5 text-slate-400 text-sm hover:text-slate-600 transition-colors flex items-center justify-center">
            {t('orderStatus.continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailedPage() {
  return <Suspense><FailedContent /></Suspense>;
}
