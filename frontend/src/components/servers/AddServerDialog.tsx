import { useState } from 'react';
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
import api from '@/services/api';

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerAdded: () => void;
}

export default function AddServerDialog({ open, onOpenChange, onServerAdded }: AddServerDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    hostname: '',
    ip: '',
    os: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/servers', {
        hostname: formData.hostname,
        ip: formData.ip,
        os: formData.os || 'Unknown',
        tags: formData.tags
          ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : [],
      });

      // Reset form and close dialog
      setFormData({ hostname: '', ip: '', os: '', tags: '' });
      onServerAdded();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message || t('servers.failedToAdd'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClick={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>{t('servers.addNewServer')}</DialogTitle>
          <DialogDescription>
            {t('servers.addServerDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="hostname">{t('servers.hostnameRequired')}</Label>
            <Input
              id="hostname"
              placeholder={t('servers.hostnamePlaceholder')}
              value={formData.hostname}
              onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ip">{t('servers.ipRequired')}</Label>
            <Input
              id="ip"
              placeholder={t('servers.ipPlaceholder')}
              value={formData.ip}
              onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="os">{t('servers.osLabel')}</Label>
            <Input
              id="os"
              placeholder={t('servers.osPlaceholder')}
              value={formData.os}
              onChange={(e) => setFormData({ ...formData, os: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t('servers.tagsLabel')}</Label>
            <Input
              id="tags"
              placeholder={t('servers.tagsPlaceholder')}
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('servers.adding') : t('servers.addServer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
