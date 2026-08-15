import { AlertTriangle, CheckCircle2, Info, XCircle, MapPin } from 'lucide-react';
import { cn } from '../../utils/cn';

const CONFIG = {
  ok: { icon: CheckCircle2, classes: 'bg-success-soft border-success/25 text-success' },
  warning: { icon: AlertTriangle, classes: 'bg-warning-soft border-warning/25 text-warning' },
  danger: { icon: XCircle, classes: 'bg-danger-soft border-danger/25 text-danger' },
  info: { icon: Info, classes: 'bg-primary/10 border-primary-400/25 text-primary-300' },
  primary: { icon: MapPin, classes: 'bg-primary/15 border-primary-400/40 text-primary-200' },
};

export function Alert({ variant = 'info', title, children, className }) {
  const { icon: Icon, classes } = CONFIG[variant] ?? CONFIG.info;
  return (
    <div className={cn('flex gap-3 rounded-xl border p-4', classes, className)}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="text-sm leading-relaxed">
        {title && <p className="font-medium mb-0.5 text-mist-50">{title}</p>}
        <div className="text-mist-300">{children}</div>
      </div>
    </div>
  );
}
