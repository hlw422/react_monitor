import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Grid, List, Plus, Server, Cpu, MemoryStick, HardDrive } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSocketEvents } from '@/hooks/useSocket';
import AddServerDialog from '@/components/servers/AddServerDialog';
import api from '@/services/api';
import type { Server as ServerType, Metric, MetricType } from '@/types';

export default function Servers() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [servers, setServers] = useState<ServerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { isConnected, on } = useSocketEvents();

  // Fetch servers from API
  const fetchServers = useCallback(async () => {
    try {
      const data = await api.get<ServerType[]>('/servers');
      setServers(data);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    // Update server metrics when received
    const unsubMetrics = on('metrics:update', (data: { serverId: string; metrics: Metric[]; timestamp: string }) => {
      setServers(prev => prev.map(server => {
        if (server.id !== data.serverId) return server;
        
        const updatedMetrics = { ...server };
        data.metrics.forEach(metric => {
          switch (metric.metricType) {
            case 'cpu': updatedMetrics.cpuUsage = metric.value; break;
            case 'memory': updatedMetrics.memoryUsage = metric.value; break;
            case 'disk': updatedMetrics.diskUsage = metric.value; break;
            case 'network': updatedMetrics.networkIn = metric.value; break;
          }
        });
        updatedMetrics.lastHeartbeat = data.timestamp;
        return updatedMetrics;
      }));
    });

    // Update server status when received
    const unsubStatus = on('server:status', (data: { serverId: string; status: 'online' | 'offline' }) => {
      setServers(prev => prev.map(server => 
        server.id === data.serverId 
          ? { ...server, status: data.status, lastHeartbeat: new Date().toISOString() }
          : server
      ));
    });

    return () => {
      unsubMetrics();
      unsubStatus();
    };
  }, [isConnected, on]);

  // Filter servers based on search query
  const filteredServers = servers.filter(
    (server) =>
      server.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.ip.includes(searchQuery) ||
      server.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('servers.loadingServers')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('servers.title')}</h2>
          <p className="text-muted-foreground mt-1">
            {t('servers.serversCount', { count: servers.length, online: servers.filter((s) => s.status === 'online').length })}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          {t('servers.addServer')}
        </Button>
      </div>

      <AddServerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onServerAdded={fetchServers}
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('servers.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            {t('common.filter')}
          </Button>

          <div className="flex items-center border rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Server list */}
      {filteredServers.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-dark-700 rounded-2xl mb-4">
            <Server className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('servers.noServersFound')}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchQuery ? t('servers.noServersMatch') : t('servers.addFirstServer')}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServers.map((server) => (
            <div
              key={server.id}
              className="glass rounded-xl p-4 hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      server.status === 'online' ? 'bg-success' : 'bg-danger'
                    )}
                  />
                  <span className="text-sm font-medium text-foreground">{server.hostname}</span>
                </div>
                <span className="text-xs text-muted-foreground">{server.ip}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Cpu className="w-3 h-3" />
                    <span>{t('servers.cpu')}</span>
                  </div>
                  <span className="text-xs text-foreground">{server.cpuUsage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      server.cpuUsage > 80
                        ? 'bg-danger'
                        : server.cpuUsage > 60
                        ? 'bg-warning'
                        : 'bg-primary-500'
                    )}
                    style={{ width: `${server.cpuUsage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MemoryStick className="w-3 h-3" />
                    <span>{t('servers.memory')}</span>
                  </div>
                  <span className="text-xs text-foreground">{server.memoryUsage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      server.memoryUsage > 80
                        ? 'bg-danger'
                        : server.memoryUsage > 60
                        ? 'bg-warning'
                        : 'bg-purple-500'
                    )}
                    style={{ width: `${server.memoryUsage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <HardDrive className="w-3 h-3" />
                    <span>{t('servers.disk')}</span>
                  </div>
                  <span className="text-xs text-foreground">{server.diskUsage.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      server.diskUsage > 80
                        ? 'bg-danger'
                        : server.diskUsage > 60
                        ? 'bg-warning'
                        : 'bg-orange-500'
                    )}
                    style={{ width: `${server.diskUsage}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {server.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-dark-600 text-muted-foreground rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('servers.server')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('servers.ip')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('servers.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('servers.cpu')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('servers.memory')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('servers.disk')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('servers.tags')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredServers.map((server) => (
                <tr
                  key={server.id}
                  className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          server.status === 'online' ? 'bg-success' : 'bg-danger'
                        )}
                      />
                      <span className="text-sm font-medium text-foreground">{server.hostname}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{server.ip}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        server.status === 'online'
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger'
                      )}
                    >
                      {server.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{server.cpuUsage.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm text-foreground">{server.memoryUsage.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm text-foreground">{server.diskUsage.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {server.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-dark-600 text-muted-foreground rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
