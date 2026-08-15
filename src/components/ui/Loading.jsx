import { cn } from '../../utils/cn';

export function Spinner({ size = 20, className }) {
  return (
    <span
      className={cn('inline-block rounded-full border-2 border-white/15 border-t-primary-400 animate-spin', className)}
      style={{ width: size, height: size }}
    />
  );
}

export function LoadingDots({ className }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulseGlow"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
