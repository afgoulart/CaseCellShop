'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Product, ApiError } from '../api/client';
import { checkoutAction } from '../actions/checkout';
import type { CheckoutError } from '../actions/checkout';
import { useTranslation } from '../i18n/useTranslation';
import { QuantitySelector } from './QuantitySelector';

interface Props {
  product: Product;
  initialQty?: number;
}

type Phase = 'form' | 'loading' | 'stock_error' | 'erp_error';
interface ErrorState { message: string; currentStock?: number; }

export function CheckoutModal({ product, initialQty = 1 }: Props) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [quantity, setQuantity] = useState(Math.min(initialQty, product.stock || 1));
  const [phase, setPhase]       = useState<Phase>('form');
  const [error, setError]       = useState<ErrorState | null>(null);
  const [idempotencyKey]        = useState(() => uuidv4());

  const locale     = lang === 'pt' ? 'pt-BR' : 'en-US';
  const isLoading  = phase === 'loading';
  const unitPrice  = product.price.toLocaleString(locale, { style: 'currency', currency: 'BRL' });
  const totalPrice = (product.price * quantity).toLocaleString(locale, { style: 'currency', currency: 'BRL' });
  const stockColor = phase === 'stock_error' || product.stock <= 3 ? 'text-amber-500' : 'text-emerald-500';
  const stockCount = phase === 'stock_error' && error?.currentStock !== undefined ? error.currentStock : product.stock;
  const stockText  = (product.stock <= 3 && product.stock > 0)
    ? t('checkout.stockLow', { count: stockCount })
    : t('checkout.stockAvailable', { count: stockCount });

  const handleClose = () => { if (!isLoading) router.push('/'); };

  const handleSubmit = useCallback(async () => {
    if (isLoading) return;
    setPhase('loading');
    setError(null);
    try {
      const result = await checkoutAction({ product_id: product.id, quantity, idempotency_key: idempotencyKey });
      router.push(`/checkout/success?order=${result.id}`);
    } catch (err) {
      const apiErr = err as CheckoutError;
      if (apiErr.error === 'insufficient_stock') {
        setError({ message: apiErr.message ?? '', currentStock: apiErr.current_stock });
        setPhase('stock_error');
      } else if (apiErr.error === 'erp_unavailable' && apiErr.order?.id) {
        router.push(`/checkout/failed?order=${apiErr.order.id}`);
      } else if (apiErr.error === 'erp_unavailable') {
        router.push('/checkout/error');
      } else {
        setError({ message: apiErr.message ?? '' });
        setPhase('erp_error');
      }
    }
  }, [isLoading, product.id, quantity, idempotencyKey, router]);

  const handleAdjustQty = () => {
    if (error?.currentStock !== undefined) setQuantity(Math.min(quantity, error.currentStock));
    setPhase('form');
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-cy="checkout-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-slate-900/60"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full sm:max-w-[480px] bg-white rounded-t-2xl sm:rounded-2xl sm:shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex sm:hidden justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center h-16 px-6 border-b border-slate-200">
          <span className="flex-1 text-lg font-bold text-slate-800">{t('checkout.title')}</span>
          <button data-cy="modal-close" onClick={handleClose} disabled={isLoading}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm hover:bg-slate-200 transition-colors disabled:opacity-40">
            ✕
          </button>
        </div>

        <div className={`flex items-center gap-4 p-6 ${isLoading ? 'opacity-70' : ''}`}>
          <div className="w-20 h-20 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 text-3xl">📱</div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-slate-800 mb-1 leading-snug">{product.name}</p>
            <p className="text-[22px] font-bold text-primary-500 mb-1">{unitPrice}</p>
            <p className={`text-xs ${stockColor}`}>{stockText}</p>
          </div>
        </div>

        <div className="h-px bg-slate-200" />

        {(phase === 'form' || isLoading) && (
          <>
            <div className={`flex items-center px-6 py-4 ${isLoading ? 'opacity-50' : ''}`}>
              <span className="flex-1 text-sm font-medium text-slate-700">{t('checkout.quantity')}</span>
              <QuantitySelector value={quantity} max={product.stock} onChange={setQuantity} disabled={isLoading} />
            </div>
            <div className="h-px bg-slate-200" />
          </>
        )}

        {phase === 'stock_error' && (
          <>
            <div className="flex items-center px-6 py-4">
              <span className="flex-1 text-sm font-medium text-slate-700">{t('checkout.qtyRequested')}</span>
              <span className="px-2.5 py-1.5 bg-red-50 text-red-500 text-sm font-semibold rounded-md">
                {t('checkout.qtyBadge', { count: quantity })}
              </span>
            </div>
            <div className="flex items-start gap-2.5 px-6 py-3 bg-red-50">
              <span className="text-red-500 text-base mt-0.5">⚠</span>
              <div>
                <p className="text-sm font-semibold text-red-500">{t('checkout.errors.insufficient_stock')}</p>
                <p className="text-xs text-red-700 mt-0.5">
                  {t('checkout.errors.insufficient_stock_detail', { count: error?.currentStock ?? 0 })}
                </p>
              </div>
            </div>
            <div className="h-px bg-slate-200" />
          </>
        )}

        {phase === 'erp_error' && (
          <>
            <div className="flex flex-col items-center gap-2.5 px-6 py-5 bg-amber-50 text-center">
              <span className="text-3xl">⚡</span>
              <p className="text-[15px] font-bold text-amber-900">{t('checkout.errors.erp_unavailable')}</p>
              <p className="text-xs text-amber-800 max-w-xs">{t('checkout.errors.erp_detail')}</p>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[11px] rounded-md">
                {t('checkout.errors.erp_code')}
              </span>
            </div>
            <div className="h-px bg-slate-200" />
          </>
        )}

        <div className={`px-6 py-5 bg-slate-50 ${isLoading ? 'opacity-50' : ''}`}>
          {phase !== 'erp_error' && (
            <>
              <div className="flex justify-between text-sm text-slate-500 mb-2.5">
                <span>{t('checkout.unitPrice')}</span>
                <span className="text-slate-600">{unitPrice}</span>
              </div>
              {phase !== 'stock_error' && (
                <div className="flex justify-between text-sm text-slate-500 mb-2.5">
                  <span>{t('checkout.shipping')}</span>
                  <span className="text-emerald-500">{t('checkout.free')}</span>
                </div>
              )}
              <div className="h-px bg-slate-200 mb-2.5" />
            </>
          )}
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-slate-800">{t('checkout.total')}</span>
            <span className={`text-xl font-bold ${phase === 'erp_error' ? 'text-slate-400' : 'text-primary-500'}`}>
              {totalPrice}
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2.5 py-2 px-6">
            <div className="w-5 h-5 rounded-full border-[3px] border-slate-200 border-t-primary-500 animate-spin-fast" />
            <span className="text-sm text-slate-500">{t('checkout.processing')}</span>
          </div>
        )}

        <div className="px-6 pt-4 pb-6 flex flex-col gap-2 border-t border-slate-200">
          {phase === 'form' && (
            <>
              <button data-cy="confirm-btn" onClick={handleSubmit}
                className="w-full py-3.5 bg-primary-500 text-white font-semibold text-base rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                🛒 {t('checkout.confirm')}
              </button>
              <button data-cy="cancel-btn" onClick={handleClose}
                className="w-full py-2.5 text-slate-400 text-sm hover:text-slate-600 transition-colors">
                {t('checkout.cancel')}
              </button>
            </>
          )}
          {isLoading && (
            <>
              <button disabled className="w-full py-3.5 bg-primary-200 text-white font-semibold text-base rounded-xl cursor-not-allowed">
                {t('checkout.waiting')}
              </button>
              <button disabled className="w-full py-2.5 text-slate-300 text-sm cursor-not-allowed">
                {t('checkout.cancel')}
              </button>
            </>
          )}
          {phase === 'stock_error' && (
            <>
              <button data-cy="adjust-qty-btn" onClick={handleAdjustQty}
                className="w-full py-3.5 bg-primary-500 text-white font-semibold text-base rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all">
                ✏ {t('checkout.adjustQty')}
              </button>
              <button onClick={handleClose}
                className="w-full py-2.5 text-slate-400 text-sm hover:text-slate-600 transition-colors">
                {t('checkout.cancel')}
              </button>
            </>
          )}
          {phase === 'erp_error' && (
            <>
              <button data-cy="retry-btn" onClick={() => { setPhase('form'); setError(null); }}
                className="w-full py-3.5 bg-amber-500 text-white font-semibold text-base rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all">
                ↻ {t('checkout.retry')}
              </button>
              <button onClick={handleClose}
                className="w-full py-2.5 text-slate-400 text-sm hover:text-slate-600 transition-colors">
                {t('checkout.cancel')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
