import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary:
    'bg-primary text-white shadow-glow hover:bg-primary-hover active:bg-primary-700 border border-primary-400/30',
  secondary:
    'bg-white/[0.06] text-mist-50 border border-white/10 hover:bg-white/[0.1] hover:border-white/20',
  ghost: 'bg-transparent text-mist-200 hover:bg-white/[0.06] hover:text-mist-50',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
};

const SIZES = {
  sm: 'text-sm px-3.5 py-2 rounded-lg gap-1.5',
  md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-6 py-3.5 rounded-xl gap-2.5',
};

export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', isLoading, disabled, children, icon, iconRight, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {!isLoading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
});
