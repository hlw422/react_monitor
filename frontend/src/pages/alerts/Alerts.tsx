import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/services/api';
import { useAlertsSocket } from '@/hooks/useSocket';
import AddRuleDialog from '@/components/alerts/AddRuleDialog';
import type { Alert, AlertRule, AlertLevel, AlertStatus } from '@/types';

const levelColors: Record<AlertLevel, { bg: string; text: string; icon: any }> = {
  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Info },
  warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: AlertTriangle },
  error: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: AlertCircle },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertCircle },
};

const statusColors: Record<AlertStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  acknowledged: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  resolved: { bg: 'bg-green-500/10', text: 'text-green-400' },
  silenced: { bg: 'bg-gray-500/10', text: 'text-muted-foreground' },
};

export default function Alerts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { onNewAlert } = useAlertsSocket();
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('history');
  const [levelFilter, setLevelFilter] = useState<AlertLevel | ''>('');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | ''>('');
  const [addRuleDialogOpen, setAddRuleDialogOpen] = useState(false);

  // Fetch alert stats
  const { data: stats } = useQuery({
    queryKey: ['alerts', 'stats'],
    queryFn: async () => {
      return api.get<any>('/alerts/stats');
    },
  });

  // Fetch alert rules
  const { data: rulesData } = useQuery({
    queryKey: ['alerts', 'rules'],
    queryFn: async () => {
      return api.get<AlertRule[]>('/alerts/rules');
    },
    enabled: activeTab === 'rules',
  });

  // Fetch alert history
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', 'history', levelFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100' };
      if (levelFilter) params.level = levelFilter;
      if (statusFilter) params.status = statusFilter;
      return api.get<{ items: Alert[]; total: number }>('/alerts', { params });
    },
  });

  // Listen for new alerts via WebSocket
  useEffect(() => {
    const unsubscribe = onNewAlert(() => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    });
    return unsubscribe;
  }, [onNewAlert, queryClient]);

  // Toggle rule mutation
  const toggleRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      await api.patch(`/alerts/rules/${ruleId}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
    },
  });

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await api.patch(`/alerts/${alertId}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // Resolve alert mutation
  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await api.patch(`/alerts/${alertId}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // Silence alert mutation
  const silenceMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await api.patch(`/alerts/${alertId}/silence`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      await api.delete(`/alerts/rules/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
    },
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('alerts.justNow');
    if (minutes < 60) return t('alerts.minutesAgo', { minutes });
    if (hours < 24) return t('alerts.hoursAgo', { hours });
    return t('alerts.daysAgo', { days });
  };

  const rules: AlertRule[] = rulesData || [];
  const alerts: Alert[] = alertsData?.items || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('alerts.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('alerts.subtitle')}</p>
      </div>

      {/* Alert level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['info', 'warning', 'error', 'critical'] as AlertLevel[]).map((level) => {
          const config = levelColors[level];
          const Icon = config.icon;
          const count = stats?.byLevel?.[level] || 0;

          return (
            <div key={level} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded-lg', config.bg)}>
                    <Icon className={cn('w-4 h-4', config.text)} />
                  </div>
                  <span className="text-sm text-muted-foreground capitalize">{t(`alerts.${level}`)}</span>
                </div>
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  config.bg,
                  config.text
                )}>
                  {count}
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground mt-3">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['pending', 'acknowledged', 'resolved', 'silenced'] as AlertStatus[]).map((status) => {
          const config = statusColors[status];
          const count = stats?.byStatus?.[status] || 0;

          return (
            <div key={status} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground capitalize">{t(`alerts.${status}`)}</span>
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  config.bg,
                  config.text
                )}>
                  {count}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs and filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1 border border-dark-600">
          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'rules'
                ? 'bg-primary-500 text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('alerts.rules')} ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === 'history'
                ? 'bg-primary-500 text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t('alerts.history')} ({alertsData?.total || 0})
          </button>
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center gap-3">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as AlertLevel | '')}
              className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('alerts.allLevels')}</option>
              <option value="info">{t('alerts.info')}</option>
              <option value="warning">{t('alerts.warning')}</option>
              <option value="error">{t('alerts.error')}</option>
              <option value="critical">{t('alerts.critical')}</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AlertStatus | '')}
              className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('alerts.allStatus')}</option>
              <option value="pending">{t('alerts.pending')}</option>
              <option value="acknowledged">{t('alerts.acknowledged')}</option>
              <option value="resolved">{t('alerts.resolved')}</option>
              <option value="silenced">{t('alerts.silenced')}</option>
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'rules' ? (
        <div className="space-y-4">
          {/* Rules header */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {t('alerts.rulesConfigured', { count: rules.length })}
            </p>
            <button
              onClick={() => setAddRuleDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('alerts.addRule')}
            </button>
          </div>

          {/* Rules table */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('alerts.ruleName')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('alerts.condition')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('alerts.level')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.status')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('alerts.server')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600">
                  {rules.map((rule) => {
                    const levelConfig = levelColors[rule.level];
                    const LevelIcon = levelConfig.icon;

                    return (
                      <tr key={rule.id} className="hover:bg-dark-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-foreground">{rule.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-sm text-foreground bg-dark-700 px-2 py-1 rounded">
                            {rule.metricType} {rule.condition} {rule.threshold}
                          </code>
                        </td>
                          <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                            levelConfig.bg,
                            levelConfig.text
                          )}>
                            <LevelIcon className="w-3 h-3" />
                            {t(`alerts.${rule.level}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleRuleMutation.mutate(rule.id)}
                            className="flex items-center gap-2"
                          >
                            {rule.enabled ? (
                              <ToggleRight className="w-6 h-6 text-green-400" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                            )}
                            <span className={cn(
                              'text-xs font-medium',
                              rule.enabled ? 'text-green-400' : 'text-muted-foreground'
                            )}>
                              {rule.enabled ? t('alerts.enabled') : t('alerts.disabled')}
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {rule.server ? `${rule.server.hostname} (${rule.server.ip})` : t('alerts.allServers')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-1.5 rounded-lg hover:bg-dark-600 text-muted-foreground hover:text-foreground transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRuleMutation.mutate(rule.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* History header */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {t('alerts.alertsInHistory', { count: alertsData?.total || 0 })}
            </p>
          </div>

          {/* History table */}
          <div className="glass rounded-xl overflow-hidden">
            {alertsLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t('alerts.loadingAlerts')}</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('alerts.noAlertsFound')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-600">
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('alerts.level')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('alerts.server')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('alerts.message')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('common.status')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('alerts.time')}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-600">
                    {alerts.map((alert) => {
                      const levelConfig = levelColors[alert.level];
                      const LevelIcon = levelConfig.icon;
                      const statusConfig = statusColors[alert.status];

                      return (
                        <tr key={alert.id} className="hover:bg-dark-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                              levelConfig.bg,
                              levelConfig.text
                            )}>
                              <LevelIcon className="w-3 h-3" />
                              {t(`alerts.${alert.level}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-foreground">
                              {alert.server ? alert.server.hostname : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-foreground max-w-md truncate">
                              {alert.message}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                              statusConfig.bg,
                              statusConfig.text
                            )}>
                              {t(`alerts.${alert.status}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span title={formatTime(alert.createdAt)}>
                                {getRelativeTime(alert.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {alert.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => acknowledgeMutation.mutate(alert.id)}
                                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-medium transition-colors"
                                  >
                                    {t('alerts.acknowledge')}
                                  </button>
                                  <button
                                    onClick={() => silenceMutation.mutate(alert.id)}
                                    className="px-3 py-1.5 rounded-lg bg-gray-500/10 text-muted-foreground hover:bg-gray-500/20 text-xs font-medium transition-colors"
                                  >
                                    {t('alerts.silence')}
                                  </button>
                                </>
                              )}
                              {(alert.status === 'pending' || alert.status === 'acknowledged') && (
                                <button
                                  onClick={() => resolveMutation.mutate(alert.id)}
                                  className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors"
                                >
                                  {t('alerts.resolve')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <AddRuleDialog
        open={addRuleDialogOpen}
        onOpenChange={setAddRuleDialogOpen}
        onRuleAdded={() => {
          queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
        }}
      />
    </div>
  );
}
