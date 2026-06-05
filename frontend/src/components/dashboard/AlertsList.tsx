import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Alert } from '@/types';

interface AlertsListProps {
  alerts: Alert[];
}

const levelConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  error: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
};

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  acknowledged: {
    label: 'Acknowledged',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  silenced: {
    label: 'Silenced',
    color: 'text-muted-foreground',
    bg: 'bg-gray-500/10',
  },
};

export default function AlertsList({ alerts }: AlertsListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
      {alerts.map((alert) => {
        const level = levelConfig[alert.level];
        const status = statusConfig[alert.status];
        const Icon = level.icon;

        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-dark-700/50',
              level.border
            )}
          >
            <div className={cn('p-1.5 rounded-lg', level.bg)}>
              <Icon className={cn('w-4 h-4', level.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{alert.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{formatTime(alert.createdAt)}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{alert.serverId}</span>
              </div>
            </div>

            <span
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                status.bg,
                status.color
              )}
            >
              {status.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
