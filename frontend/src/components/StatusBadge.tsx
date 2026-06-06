interface Props {
  status: 'processing' | 'confirmed' | 'failed';
}

const config = {
  processing: { label: 'Processando...', bg: '#fef3c7', color: '#92400e' },
  confirmed: { label: 'Confirmado', bg: '#d1fae5', color: '#065f46' },
  failed: { label: 'Falhou', bg: '#fee2e2', color: '#991b1b' },
};

export function StatusBadge({ status }: Props) {
  const { label, bg, color } = config[status];
  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}
