'use client';

interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function QuantitySelector({ value, min = 1, max = 99, onChange, disabled = false }: Props) {
  const btnBase =
    'flex-shrink-0 flex items-center justify-center w-9 h-9 bg-slate-100 text-slate-700 font-semibold text-base transition-colors ' +
    (disabled ? 'cursor-default' : 'hover:bg-slate-200 cursor-pointer');

  return (
    <div
      style={{ display: 'inline-flex', width: 'fit-content' }}
      className={`items-center border border-slate-300 rounded-lg overflow-hidden${disabled ? ' opacity-50' : ''}`}
    >
      <button
        type="button"
        data-cy="qty-minus"
        onClick={() => !disabled && onChange(Math.max(min, value - 1))}
        className={btnBase}
        disabled={disabled || value <= min}
        aria-label="Diminuir"
      >
        −
      </button>
      <div
        data-cy="qty-value"
        style={{ display: 'flex', width: 44, height: 36 }}
        className="items-center justify-center bg-white text-gray-900 font-semibold text-sm select-none"
      >
        {value}
      </div>
      <button
        type="button"
        data-cy="qty-plus"
        onClick={() => !disabled && onChange(Math.min(max, value + 1))}
        className={btnBase}
        disabled={disabled || value >= max}
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}
