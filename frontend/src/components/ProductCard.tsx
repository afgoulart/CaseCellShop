import { useTranslation } from '../i18n/useTranslation';
import { Product } from '../api/client';

interface Props {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: Props) {
  const { t, lang } = useTranslation();
  const outOfStock = product.stock === 0;
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US';

  return (
    <div
      style={{
        border: '1px solid #e5e7eb', borderRadius: 12, padding: 20,
        display: 'flex', flexDirection: 'column', gap: 8,
        background: '#fff', opacity: outOfStock ? 0.6 : 1,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
        {product.name}
      </h3>
      <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{product.description}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
          {product.price.toLocaleString(locale, { style: 'currency', currency: 'BRL' })}
        </span>
        <span style={{ fontSize: 13, color: outOfStock ? '#ef4444' : '#6b7280' }}>
          {outOfStock
            ? t('productCard.outOfStock')
            : t('productCard.available', { count: product.stock })}
        </span>
      </div>
      <button
        disabled={outOfStock}
        onClick={() => onSelect(product)}
        style={{
          marginTop: 8, padding: '10px 0', borderRadius: 8, border: 'none',
          background: outOfStock ? '#e5e7eb' : '#2563eb',
          color: outOfStock ? '#9ca3af' : '#fff',
          fontWeight: 600, fontSize: 15,
          cursor: outOfStock ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {outOfStock ? t('productCard.unavailable') : t('productCard.buy')}
      </button>
    </div>
  );
}
