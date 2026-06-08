'use client';

import { useState } from 'react';
import { Product, Order } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { OrderStatus } from './OrderStatus';
import { useTranslation } from '../i18n/useTranslation';

type Selected = { product: Product; qty: number };

interface Props {
  initialProducts: Product[];
}

export function ProductListClient({ initialProducts }: Props) {
  const { t, toggleLang } = useTranslation();
  const [products, setProducts]             = useState<Product[]>(initialProducts);
  const [selected, setSelected]             = useState<Selected | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const handleSuccess = (order: Order) => {
    setSelected(null);
    setConfirmedOrder(order);
    setProducts(prev =>
      prev.map(p =>
        p.id === order.product_id
          ? { ...p, stock: Math.max(0, p.stock - order.quantity) }
          : p
      )
    );
  };

  if (confirmedOrder) {
    return <OrderStatus order={confirmedOrder} onBack={() => setConfirmedOrder(null)} />;
  }

  // Out-of-stock always goes to the bottom
  const displayProducts = [...products].sort((a, b) =>
    (a.stock === 0 ? 1 : 0) - (b.stock === 0 ? 1 : 0)
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className="h-16 bg-slate-900 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-40">

        {/* Mobile: hamburger */}
        <button className="flex sm:hidden text-slate-400 text-xl leading-none" aria-label="Menu">☰</button>

        {/* Desktop: logo + brand */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">CC</span>
          </div>
          <span className="text-white font-bold text-lg">{t('app.brand')}</span>
          <span className="text-slate-400 text-lg">{t('app.brandSub')}</span>
        </div>

        {/* Mobile: centered brand */}
        <span className="sm:hidden absolute left-1/2 -translate-x-1/2 text-primary-500 font-bold text-lg">
          {t('app.brand')}
        </span>

        {/* Right: lang toggle + cart */}
        <div className="flex items-center gap-4">
          <button
            data-cy="lang-toggle"
            onClick={toggleLang}
            className="text-xl leading-none hover:scale-110 active:scale-95 transition-transform"
            aria-label="Toggle language"
          >
            {t('lang.toggle')}
          </button>
          <span className="text-white text-xl cursor-pointer">🛒</span>
        </div>
      </header>

      {/* ── Page heading ── */}
      <div className="px-6 sm:px-20 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 mb-1">{t('app.title')}</h1>
        <p className="text-slate-500 text-sm sm:text-[15px]">
          <span className="sm:hidden">
            {t('app.productsCount', { count: products.length })}
          </span>
          <span className="hidden sm:inline">{t('app.subtitle')}</span>
        </p>
      </div>

      {/* ── Product grid / list ── */}
      <div className="
        mx-4 mb-8 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm
        sm:mx-0 sm:bg-transparent sm:border-none sm:rounded-none sm:overflow-visible sm:shadow-none
        sm:grid sm:grid-cols-[repeat(auto-fill,minmax(232px,1fr))] sm:gap-5
        sm:px-20 sm:pb-16
      ">
        {displayProducts.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            colorIndex={i}
            onSelect={(prod, qty) => setSelected({ product: prod, qty })}
          />
        ))}
      </div>

      {/* ── Checkout modal / bottom sheet ── */}
      {selected && (
        <CheckoutModal
          product={selected.product}
          initialQty={selected.qty}
          onClose={() => setSelected(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
