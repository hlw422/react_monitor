import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { api } from '@/services/api';
import type { Server, MetricType, AlertLevel } from '@/types';

interface AddRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRuleAdded: () => void;
}

export default function AddRuleDialog({ open, onOpenChange, onRuleAdded }: AddRuleDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    metricType: 'cpu' as MetricType,
    condition: '>' as '>' | '<' | '=' | '>=' | '<=',
    threshold: '',
    level: 'warning' as AlertLevel,
    serverId: '',
  });
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      api.get<Server[]>('/servers').then(setServers).catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/alerts/rules', {
        name: formData.name,
        metricType: formData.metricType,
        condition: formData.condition,
        threshold: parseFloat(formData.threshold),
        level: formData.level,
        serverId: formData.serverId || undefined,
      });

      setFormData({ name: '', metricType: 'cpu', condition: '>', threshold: '', level: 'warning', serverId: '' });
      onRuleAdded();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message || t('alerts.failedToAddRule'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClick={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>{t('alerts.addNewRule')}</DialogTitle>
          <DialogDescription>
            {t('alerts.addRuleDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t('alerts.ruleNameRequired')}</Label>
            <Input
              id="name"
              placeholder={t('alerts.ruleNamePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metricType">{t('alerts.metricType')}</Label>
              <select
                id="metricType"
                value={formData.metricType}
                onChange={(e) => setFormData({ ...formData, metricType: e.target.value as MetricType })}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="cpu">CPU</option>
                <option value="memory">{t('servers.memory')}</option>
                <option value="disk">{t('servers.disk')}</option>
                <option value="network">{t('servers.network')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">{t('alerts.conditionRequired')}</Label>
              <select
                id="condition"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="=">=</option>
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">{t('alerts.thresholdRequired')}</Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              placeholder={t('alerts.thresholdPlaceholder')}
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">{t('alerts.alertLevel')}</Label>
              <select
                id="level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as AlertLevel })}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="info">{t('alerts.info')}</option>
                <option value="warning">{t('alerts.warning')}</option>
                <option value="error">{t('alerts.error')}</option>
                <option value="critical">{t('alerts.critical')}</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serverId">{t('alerts.targetServer')}</Label>
              <select
                id="serverId"
                value={formData.serverId}
                onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('alerts.allServersOption')}</option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.hostname} ({server.ip})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('alerts.addingRule') : t('alerts.addRule')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
