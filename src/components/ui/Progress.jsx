import { cn } from '../../utils/cn';

export function Progress({ value = 0, className, label, showValue = true }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2 text-xs text-mist-300">
          {label && <span>{label}</span>}
          {showValue && <span className="font-mono text-mist-200">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
