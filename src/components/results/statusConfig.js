export const STATUS_CONFIG = {
  ok: { label: 'Conforme', variant: 'ok' },
  warning: { label: 'À surveiller', variant: 'warning' },
  danger: { label: 'Critique', variant: 'danger' },
  error: { label: 'Scan incomplet', variant: 'scanError' },
  unknown: { label: 'Inconnu', variant: 'unknown' },
};

export function statusOf(status) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
}
