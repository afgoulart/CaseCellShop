'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  initialProducts: Product[];
}

export function ProductListClient({ initialProducts }: Props) {
  const { t, toggleLang } = useTranslation();
  const [products] = useState<Product[]>(initialProducts);
  const searchParams = useSearchParams();

  const productDetailsId = searchParams.get('productDetails');
  const qtyParam = parseInt(searchParams.get('qty') ?? '1', 10);
  const selectedProduct = productDetailsId
    ? products.find(p => p.id === parseInt(productDetailsId, 10)) ?? null
    : null;

  const displayProducts = [...products].sort((a, b) =>
    (a.stock === 0 ? 1 : 0) - (b.stock === 0 ? 1 : 0)
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="h-16 bg-slate-900 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-40">
        <button className="flex sm:hidden text-slate-400 text-xl leading-none" aria-label="Menu">☰</button>
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">CC</span>
          </div>
          <span className="text-white font-bold text-lg">{t('app.brand')}</span>
          <span className="text-slate-400 text-lg">{t('app.brandSub')}</span>
        </div>
        <span className="sm:hidden absolute left-1/2 -translate-x-1/2 text-primary-500 font-bold text-lg">
          {t('app.brand')}
        </span>
        <div className="flex items-center gap-4">
          <button
            data-cy="lang-toggle"
            onClick={toggleLang}
            className="text-xl leading-none hover:scale-110 active:scale-95 transition-transform"
            aria-label="Toggle language"
          >
            {t('lang.toggle')}
          </button>
          <Link href="/orders" className="text-white text-sm font-medium hover:text-primary-400 transition-colors hidden sm:block">
            {t('nav.myOrders')}
          </Link>
          <span className="text-white text-xl cursor-pointer">🛒</span>
        </div>
      </header>

      {/* Page heading */}
      <div className="px-6 sm:px-20 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 mb-1">{t('app.title')}</h1>
        <p className="text-slate-500 text-sm sm:text-[15px]">
          <span className="sm:hidden">{t('app.productsCount', { count: products.length })}</span>
          <span className="hidden sm:inline">{t('app.subtitle')}</span>
        </p>
      </div>

      {/* Product grid */}
      <div className="
        mx-4 mb-8 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm
        sm:mx-0 sm:bg-transparent sm:border-none sm:rounded-none sm:overflow-visible sm:shadow-none
        sm:grid sm:grid-cols-[repeat(auto-fill,minmax(232px,1fr))] sm:gap-5
        sm:px-20 sm:pb-16
      ">
        {displayProducts.map((p, i) => (
          <ProductCard key={p.id} product={p} colorIndex={i} />
        ))}
      </div>

      {/* Checkout modal (URL-driven) */}
      {selectedProduct && (
        <CheckoutModal product={selectedProduct} initialQty={isNaN(qtyParam) ? 1 : qtyParam} />
      )}
    </div>
  );
}
