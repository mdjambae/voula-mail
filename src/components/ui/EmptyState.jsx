import { cn } from '../../utils/cn';

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      {icon && (
        <div className="mb-4 h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-mist-400">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-mist-50 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-mist-400 max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}
