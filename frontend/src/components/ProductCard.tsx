'use client';

import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { QuantitySelector } from './QuantitySelector';
import { Product } from '../api/client';

interface Props {
  product: Product;
  colorIndex: number;
  onSelect: (product: Product, qty: number) => void;
}

const THUMB_COLORS = [
  { bg: 'bg-indigo-50',  text: 'text-indigo-500'  },
  { bg: 'bg-orange-50',  text: 'text-orange-500'  },
  { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  { bg: 'bg-purple-50',  text: 'text-purple-500'  },
  { bg: 'bg-rose-50',    text: 'text-rose-500'    },
];

export function ProductCard({ product, colorIndex, onSelect }: Props) {
  const { t, lang } = useTranslation();
  const [qty, setQty] = useState(1);

  const outOfStock = product.stock === 0;
  const lowStock   = product.stock > 0 && product.stock <= 3;
  const locale     = lang === 'pt' ? 'pt-BR' : 'en-US';
  const price      = product.price.toLocaleString(locale, { style: 'currency', currency: 'BRL' });
  const thumb      = THUMB_COLORS[colorIndex % THUMB_COLORS.length];

  const stockBadge = outOfStock ? null : lowStock
    ? <span className="text-amber-500 text-xs">{t('productCard.lowStock', { count: product.stock })}</span>
    : <span className="text-slate-400 text-xs">{t('productCard.inStock', { count: product.stock })}</span>;

  return (
    <div data-cy="product-card">
      {/* ── Mobile row (hidden on sm+) ── */}
      <div className={`flex sm:hidden items-center gap-3 px-4 py-4 bg-white border-b border-slate-100 ${outOfStock ? 'opacity-60' : ''}`}>
        <div className={`w-14 h-14 rounded-xl ${thumb.bg} flex items-center justify-center shrink-0`}>
          <span className={`text-2xl ${thumb.text}`}>📱</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
          <p className="text-xs text-slate-500 truncate">{product.description}</p>
          <div className="mt-0.5">{stockBadge}</div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <p className="text-base font-bold text-primary-500">{price}</p>
          {outOfStock ? (
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
              {t('productCard.soldOut')}
            </span>
          ) : (
            <button
              data-cy="buy-btn"
              onClick={() => onSelect(product, qty)}
              className="px-4 py-1.5 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 active:scale-95 transition-all"
            >
              {t('productCard.buy')}
            </button>
          )}
        </div>
      </div>

      {/* ── Desktop card (hidden below sm) ── */}
      <div className={`hidden sm:flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-md h-full ${outOfStock ? 'opacity-60' : ''}`}>
        <div className="h-40 bg-slate-200 flex items-center justify-center">
          <span className="text-5xl text-slate-400">📱</span>
        </div>
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{product.name}</h3>
          <p className="text-xl font-bold text-primary-500">{price}</p>
          {outOfStock ? (
            <span className="self-start px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
              {t('productCard.soldOut')}
            </span>
          ) : (
            <>
              {stockBadge}
              <QuantitySelector value={qty} max={product.stock} onChange={setQty} />
              <button
                data-cy="buy-btn"
                onClick={() => onSelect(product, qty)}
                className="mt-auto w-full py-2.5 bg-primary-500 text-white font-semibold text-sm rounded-lg hover:bg-primary-600 active:scale-95 transition-all"
              >
                {t('productCard.buy')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
