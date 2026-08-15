import { useState } from 'react';
import { cn } from '../../utils/cn';

export function Tooltip({ content, children, className }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-max max-w-xs',
            'rounded-lg glass-strong px-3 py-1.5 text-xs text-mist-200 shadow-card',
            'animate-fadeUp',
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
