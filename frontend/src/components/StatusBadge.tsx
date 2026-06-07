import { useTranslation } from '../i18n/useTranslation';

interface Props {
  status: 'processing' | 'confirmed' | 'failed';
}

const colors = {
  processing: { bg: '#fef3c7', color: '#92400e' },
  confirmed:  { bg: '#d1fae5', color: '#065f46' },
  failed:     { bg: '#fee2e2', color: '#991b1b' },
};

export function StatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const { bg, color } = colors[status];
  return (
    <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 13, fontWeight: 600, background: bg, color }}>
      {t(`status.${status}`)}
    </span>
  );
}
