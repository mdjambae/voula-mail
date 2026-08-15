import { cn } from '../../utils/cn';

const VARIANTS = {
  ok: 'bg-success-soft text-success border-success/30',
  warning: 'bg-warning-soft text-warning border-warning/30',
  danger: 'bg-danger-soft text-danger border-danger/30',
  neutral: 'bg-white/[0.06] text-mist-300 border-white/10',
  primary: 'bg-primary/10 text-primary-300 border-primary-400/30',
  scanError: 'bg-slate-500/10 text-slate-300 border-slate-400/30',
  unknown: 'bg-white/[0.06] text-mist-400 border-white/10',
};

export function Badge({ className, variant = 'neutral', children, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        VARIANTS[variant] ?? VARIANTS.neutral,
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', {
        'bg-success': variant === 'ok',
        'bg-warning': variant === 'warning',
        'bg-danger': variant === 'danger',
        'bg-slate-400': variant === 'scanError',
        'bg-mist-400': variant === 'neutral' || variant === 'unknown',
        'bg-primary-400': variant === 'primary',
      })} />}
      {children}
    </span>
  );
}
