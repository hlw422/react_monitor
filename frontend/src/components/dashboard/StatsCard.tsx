import { memo } from 'react';
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  progress?: number;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    progress: 'from-blue-500 to-cyan-500',
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    progress: 'from-green-500 to-emerald-500',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    progress: 'from-yellow-500 to-orange-500',
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    progress: 'from-red-500 to-pink-500',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    progress: 'from-purple-500 to-violet-500',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    progress: 'from-orange-500 to-amber-500',
  },
};

const StatsCard = memo(function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
  progress,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className="glass rounded-xl p-4 hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.text)} />
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend.isUp ? 'text-success' : 'text-danger'
            )}
          >
            {trend.isUp ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{title}</p>
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full bg-gradient-to-r rounded-full', colors.progress)}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default StatsCard;
