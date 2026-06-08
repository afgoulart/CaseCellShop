'use client';

import { useTranslation } from '../i18n/useTranslation';

interface Props {
  status: 'processing' | 'confirmed' | 'failed';
}

const styles = {
  processing: 'bg-amber-100 text-amber-800',
  confirmed:  'bg-emerald-100 text-emerald-800',
  failed:     'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: Props) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}
