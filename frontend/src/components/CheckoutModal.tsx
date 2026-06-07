import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Product, Order, ApiError, checkout } from '../api/client';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  product: Product;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

type Phase = 'form' | 'loading' | 'success' | 'error';

interface ErrorState {
  type: 'validation_error' | 'insufficient_stock' | 'erp_unavailable' | 'not_found' | 'unknown';
  message: string;
  currentStock?: number;
}

export function CheckoutModal({ product, onClose, onSuccess }: Props) {
  const { t, lang } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [phase, setPhase] = useState<Phase>('form');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [idempotencyKey] = useState(() => uuidv4());

  const locale = lang === 'pt' ? 'pt-BR' : 'en-US';

  const handleSubmit = useCallback(async () => {
    if (phase === 'loading') return;
    setPhase('loading');
    setError(null);

    try {
      const result = await checkout({ product_id: product.id, quantity, idempotency_key: idempotencyKey });
      setOrder(result);
      setPhase('success');
      onSuccess(result);
    } catch (err) {
      const apiErr = err as ApiError;
      setError({
        type: (apiErr.error as ErrorState['type']) ?? 'unknown',
        message: apiErr.message ?? t('checkout.errors.unknown'),
        currentStock: apiErr.current_stock,
      });
      setPhase('error');
    }
  }, [phase, product.id, quantity, idempotencyKey, onSuccess, t]);

  const handleRetry = () => { setPhase('form'); setError(null); };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
      onClick={e => { if (e.target === e.currentTarget && phase !== 'loading') onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>{t('checkout.title')}</h2>
        <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: 14 }}>{product.name}</p>

        {phase === 'form' && (
          <>
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{t('checkout.quantity')}</span>
              <input
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{
                  display: 'block', width: '100%', marginTop: 6,
                  padding: '10px 12px', border: '1px solid #d1d5db',
                  borderRadius: 8, fontSize: 16, boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, display: 'block' }}>
                {t('checkout.available', { count: product.stock })}
              </span>
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontWeight: 600 }}>
              <span>{t('checkout.total')}</span>
              <span style={{ color: '#059669' }}>
                {(product.price * quantity).toLocaleString(locale, { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={onClose} style={secondaryBtn}>{t('checkout.cancel')}</button>
              <button onClick={handleSubmit} style={primaryBtn}>{t('checkout.confirm')}</button>
            </div>
          </>
        )}

        {phase === 'loading' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={spinner} />
            <p style={{ marginTop: 16, color: '#6b7280' }}>{t('checkout.processing')}</p>
          </div>
        )}

        {phase === 'success' && order && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <h3 style={{ margin: '12px 0 4px', color: '#065f46' }}>{t('checkout.orderConfirmed')}</h3>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 8px' }}>
              {t('checkout.invoice')} <strong>{order.invoice}</strong>
            </p>
            <StatusBadge status="confirmed" />
            <button onClick={onClose} style={{ ...primaryBtn, marginTop: 24 }}>{t('checkout.close')}</button>
          </div>
        )}

        {phase === 'error' && error && (
          <div>
            <div style={{ fontSize: 48, textAlign: 'center' }}>
              {error.type === 'insufficient_stock' ? '📦' : '⚠️'}
            </div>
            <h3 style={{ margin: '12px 0 4px', textAlign: 'center', color: '#991b1b' }}>
              {t(`checkout.errors.${error.type}`)}
            </h3>
            <p style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', margin: '0 0 20px' }}>
              {error.message}
              {error.currentStock !== undefined && (
                <> — {t('checkout.currentStock', { count: error.currentStock })}</>
              )}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={onClose} style={secondaryBtn}>{t('checkout.close')}</button>
              {error.type === 'erp_unavailable' && (
                <button onClick={handleRetry} style={primaryBtn}>{t('checkout.retry')}</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  flex: 1, padding: '11px 0', border: 'none',
  background: '#2563eb', color: '#fff', borderRadius: 8,
  fontWeight: 600, fontSize: 15, cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  flex: 1, padding: '11px 0', border: '1px solid #d1d5db',
  background: '#fff', color: '#374151', borderRadius: 8,
  fontWeight: 600, fontSize: 15, cursor: 'pointer',
};

const spinner: React.CSSProperties = {
  width: 40, height: 40, border: '3px solid #e5e7eb',
  borderTopColor: '#2563eb', borderRadius: '50%',
  margin: '0 auto', animation: 'spin 0.8s linear infinite',
};
