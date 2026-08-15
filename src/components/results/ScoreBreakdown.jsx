import { Check, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ScoreBreakdown({ breakdown }) {
  return (
    <div className="space-y-2.5">
      {breakdown.map((b) => {
        const earned = b.earned > 0;
        return (
          <div key={b.key} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center shrink-0',
                  earned ? 'bg-success/15 text-success' : 'bg-white/[0.05] text-mist-400'
                )}
              >
                {earned ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
              <span className={earned ? 'text-mist-200' : 'text-mist-400'}>{b.label}</span>
            </div>
            <span className="font-mono text-xs text-mist-400 shrink-0">
              {b.earned}/{b.weight}
            </span>
          </div>
        );
      })}
    </div>
  );
}
