import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(function Input(
  { className, icon, error, size = 'md', ...props },
  ref
) {
  const sizes = {
    md: 'h-11 text-sm px-4',
    lg: 'h-14 text-base px-5',
  };
  return (
    <div className="relative w-full">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-400">{icon}</span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl bg-white/[0.04] border border-white/10 text-mist-50 placeholder:text-mist-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400/60',
          'transition-colors duration-200',
          icon && 'pl-11',
          sizes[size],
          error && 'border-danger/60 focus:ring-danger/40',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
});
