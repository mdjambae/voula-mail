import { ChevronRight } from 'lucide-react';
import { Card, Badge } from '../ui';
import { statusOf } from './statusConfig';
import { cn } from '../../utils/cn';

export function ModuleCard({ result, onOpen, active }) {
  if (!result) return null;
  const { label, variant } = statusOf(result.status);

  return (
    <button
      onClick={() => onOpen(result.id)}
      className={cn(
        'w-full text-left rounded-2xl p-5 glass transition-all duration-200 group',
        'hover:border-primary-400/30 hover:-translate-y-0.5',
        active && 'border-primary-400/50 ring-1 ring-primary-400/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-mist-50">{result.label}</h3>
          <p className="text-xs text-mist-400 mt-0.5">{result.fullName}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-mist-400 mt-1 group-hover:translate-x-0.5 transition-transform" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Badge variant={variant} dot>{label}</Badge>
        {result.issues?.length > 0 && (
          <span className="text-xs text-mist-400">
            {result.issues.length} {result.issues.length > 1 ? 'anomalies' : 'anomalie'}
          </span>
        )}
      </div>
    </button>
  );
}
