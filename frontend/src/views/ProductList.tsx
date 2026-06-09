'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { AppShell } from '../components/AppShell';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  initialProducts: Product[];
}

export function ProductListClient({ initialProducts }: Props) {
  const { t } = useTranslation();
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
    <AppShell>
      {/* Page heading */}
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 mb-1">{t('app.title')}</h1>
        <p className="text-slate-500 text-sm sm:text-[15px]">
          <span className="sm:hidden">{t('app.productsCount', { count: products.length })}</span>
          <span className="hidden sm:inline">{t('app.subtitle')}</span>
        </p>
      </div>

      {/* Product grid */}
      <div className="
        -mx-4 sm:mx-0
        bg-white sm:bg-transparent
        border-y sm:border-none border-slate-200
        overflow-hidden sm:overflow-visible
        sm:grid sm:grid-cols-[repeat(auto-fill,minmax(232px,1fr))] sm:gap-5
      ">
        {displayProducts.map((p, i) => (
          <ProductCard key={p.id} product={p} colorIndex={i} />
        ))}
      </div>

      {/* Checkout modal (URL-driven) */}
      {selectedProduct && (
        <CheckoutModal product={selectedProduct} initialQty={isNaN(qtyParam) ? 1 : qtyParam} />
      )}
    </AppShell>
  );
}
