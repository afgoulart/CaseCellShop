'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Order, fetchOrder } from '../../../api/client';
import { OrderStatus } from '../../../views/OrderStatus';
import { useTranslation } from '../../../i18n/useTranslation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
  return <OrderStatus order={order} />;
}

export default function CheckoutSuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
