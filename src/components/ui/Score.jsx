import { cn } from '../../utils/cn';
import { scoreLabel } from '../../lib/audit/scoring';

const COLOR_MAP = {
  success: '#22C55E',
  primary: '#6366F1',
  warning: '#F5A524',
  danger: '#F1445C',
};

export function ScoreRing({ score = 0, size = 180, strokeWidth = 12, className }) {
  const { label, color } = scoreLabel(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const stroke = COLOR_MAP[color];

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 8px ${stroke}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold text-mist-50">{score}</span>
        <span className="text-xs font-medium text-mist-400 mt-1">{label}</span>
      </div>
    </div>
  );
}
