import { cn } from '../../utils/cn';

export function Card({ className, children, hover = false, glass = true, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        glass ? 'glass shadow-card' : 'bg-ink-850 border border-white/[0.06] shadow-soft',
        hover && 'transition-all duration-300 hover:border-primary-400/30 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('font-display font-semibold text-mist-50 text-base', className)}>{children}</h3>;
}
