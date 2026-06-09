'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  order: Order;
}

export function OrderStatus({ order }: Props) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US';

  const orderId  = `#ORD-${order.id.slice(0, 4).toUpperCase()}`;
  const date     = new Date(order.created_at).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const qty      = order.quantity;
  const qtyLabel = lang === 'pt' ? `${qty} ${qty === 1 ? 'unidade' : 'unidades'}` : `${qty} ${qty === 1 ? 'unit' : 'units'}`;
  const total    = ((order.product_price ?? 0) * qty).toLocaleString(locale, { style: 'currency', currency: 'BRL' });

  const details = [
    [t('orderStatus.order'),    orderId],
    [t('orderStatus.product'),  order.product_name ?? '—'],
    [t('orderStatus.quantity'), qtyLabel],
    [t('orderStatus.date' in t ? 'orderStatus.date' : 'orderDetail.date'), date],
  ];

  return (
    <div data-cy="order-status" className="min-h-screen bg-slate-50">
      <header className="h-16 bg-slate-900 flex items-center px-8 sticky top-0 z-40">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-slate-400 text-sm hover:text-white transition-colors"
        >
          ← {t('orderStatus.continueShopping')}
        </button>
        <div className="flex-1 text-center">
          <span className="text-primary-500 font-bold text-xl">{t('app.brand')}</span>
        </div>
        <div className="w-24" />
      </header>

      <div className="flex items-start justify-center p-6 sm:p-10">
        <div className="w-full max-w-[560px] bg-white rounded-2xl shadow-lg px-8 sm:px-10 py-10 pb-8">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-3xl text-emerald-500">✓</div>
          </div>

          <h2 className="text-center text-[28px] font-bold text-slate-800 mb-2">{t('orderStatus.title')}</h2>
          <p className="text-center text-slate-500 text-[15px] mb-4">{t('orderStatus.subtitle')}</p>

          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium">
              ● {t('orderStatus.badge')}
            </span>
          </div>

          <hr className="border-slate-200 mb-5" />

          <div className="bg-slate-50 rounded-xl p-5 mb-5 space-y-3">
            {details.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-800 font-medium text-right max-w-[60%] truncate">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200 mt-2">
              <span className="text-slate-800">{t('orderStatus.totalPaid')}</span>
              <span className="text-primary-500">{total}</span>
            </div>
          </div>

          <hr className="border-slate-200 mb-5" />

          <button
            data-cy="continue-shopping"
            onClick={() => router.push('/')}
            className="w-full py-3.5 bg-primary-500 text-white font-semibold text-base rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-3"
          >
            ← {t('orderStatus.continueShopping')}
          </button>
          <div className="text-center">
            <Link href="/orders" className="text-primary-500 text-sm hover:underline">
              {t('nav.myOrders')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
