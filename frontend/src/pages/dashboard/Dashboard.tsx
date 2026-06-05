import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Bell,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import CpuChart from '@/components/dashboard/CpuChart';
import MemoryChart from '@/components/dashboard/MemoryChart';
import AlertsList from '@/components/dashboard/AlertsList';
import ServerStatusChart from '@/components/dashboard/ServerStatusChart';
import { useSocketEvents } from '@/hooks/useSocket';
import api from '@/services/api';
import type { DashboardStats, Alert, Metric, MetricType, Server as ServerType } from '@/types';

interface CpuDataPoint {
  time: string;
  value: number;
}

// Initial default stats
const defaultStats: DashboardStats = {
  totalServers: 0,
  onlineServers: 0,
  avgCpuUsage: 0,
  avgMemoryUsage: 0,
  avgDiskUsage: 0,
  totalNetworkIn: 0,
  totalNetworkOut: 0,
  activeAlerts: 0,
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { isConnected, on } = useSocketEvents();

  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cpuHistory, setCpuHistory] = useState<CpuDataPoint[]>([]);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const serverMetricsRef = useRef<Map<string, Map<MetricType, number>>>(new Map());
  const serverStatusRef = useRef<Map<string, 'online' | 'offline'>>(new Map());

  // Fetch servers from API on mount
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const servers = await api.get<ServerType[]>('/servers');
        servers.forEach(server => {
          serverStatusRef.current.set(server.id, server.status);
        });
        updateTotalCount();
      } catch (error) {
        console.error('Failed to fetch servers:', error);
      }
    };
    fetchServers();
  }, []);

  // Update total server count
  const updateTotalCount = useCallback(() => {
    const totalServers = serverStatusRef.current.size;
    const onlineServers = Array.from(serverStatusRef.current.values()).filter(s => s === 'online').length;
    setStats(prev => ({
      ...prev,
      totalServers,
      onlineServers,
    }));
  }, []);

  // Compute averages from all server metrics
  const computeAverages = useCallback(() => {
    const metrics = serverMetricsRef.current;
    if (metrics.size === 0) return;

    let totalCpu = 0, totalMemory = 0, totalDisk = 0, totalNetwork = 0;
    let cpuCount = 0, memoryCount = 0, diskCount = 0, networkCount = 0;

    metrics.forEach((serverMetrics) => {
      const cpu = serverMetrics.get('cpu');
      const mem = serverMetrics.get('memory');
      const disk = serverMetrics.get('disk');
      const net = serverMetrics.get('network');

      if (cpu !== undefined) { totalCpu += cpu; cpuCount++; }
      if (mem !== undefined) { totalMemory += mem; memoryCount++; }
      if (disk !== undefined) { totalDisk += disk; diskCount++; }
      if (net !== undefined) { totalNetwork += net; networkCount++; }
    });

    const avgCpu = cpuCount > 0 ? totalCpu / cpuCount : 0;
    const avgMemory = memoryCount > 0 ? totalMemory / memoryCount : 0;
    const avgDisk = diskCount > 0 ? totalDisk / diskCount : 0;

    setStats(prev => ({
      ...prev,
      avgCpuUsage: avgCpu,
      avgMemoryUsage: avgMemory,
      avgDiskUsage: avgDisk,
      totalNetworkIn: networkCount > 0 ? totalNetwork / networkCount : 0,
    }));

    setMemoryUsage(avgMemory);

    // Append to CPU history (sliding window of 60 points)
    setCpuHistory(prev => {
      const now = new Date();
      const newPoint: CpuDataPoint = {
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        value: avgCpu,
      };
      const updated = [...prev, newPoint];
      return updated.length > 60 ? updated.slice(-60) : updated;
    });
  }, []);

  // Listen for WebSocket events
  useEffect(() => {
    if (!isConnected) return;

    // Handle metrics:update — update per-server metrics map
    const unsubMetrics = on('metrics:update', (data: { serverId: string; metrics: Metric[]; timestamp: string }) => {
      const { serverId, metrics } = data;

      if (!serverMetricsRef.current.has(serverId)) {
        serverMetricsRef.current.set(serverId, new Map());
      }
      const serverMap = serverMetricsRef.current.get(serverId)!;

      metrics.forEach((metric) => {
        serverMap.set(metric.metricType, metric.value);
      });

      computeAverages();
    });

    // Handle alert:new — prepend to alerts list
    const unsubAlert = on('alert:new', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep latest 50
      setStats(prev => ({ ...prev, activeAlerts: prev.activeAlerts + 1 }));
    });

    // Handle server:status — update server status map
    const unsubStatus = on('server:status', (data: { serverId: string; status: 'online' | 'offline' }) => {
      serverStatusRef.current.set(data.serverId, data.status);
      
      if (data.status === 'offline') {
        serverMetricsRef.current.delete(data.serverId);
        computeAverages();
      }
      
      updateTotalCount();
    });

    return () => {
      unsubMetrics();
      unsubAlert();
      unsubStatus();
    };
  }, [isConnected, on, computeAverages, updateTotalCount]);

  const handleRefresh = async () => {
    // Re-fetch server list via REST API
    try {
      const servers = await api.get<ServerType[]>('/servers');
      serverStatusRef.current.clear();
      servers.forEach(server => {
        serverStatusRef.current.set(server.id, server.status);
      });
      updateTotalCount();
    } catch (error) {
      console.error('Failed to refresh servers:', error);
    }
    
    serverMetricsRef.current.clear();
    setCpuHistory([]);
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h2>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* WebSocket connection status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
            isConnected
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? t('dashboard.live', 'Live') : t('dashboard.disconnected', 'Disconnected')}
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-dark-800 border border-dark-600 text-muted-foreground hover:text-foreground hover:bg-dark-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title={t('dashboard.totalServers')}
          value={stats.totalServers}
          icon={Server}
          trend={{ value: 2, isUp: true }}
          color="blue"
        />
        <StatsCard
          title={t('dashboard.onlineServers')}
          value={stats.onlineServers}
          subtitle={`of ${stats.totalServers}`}
          icon={Server}
          trend={{ value: 1, isUp: true }}
          color="green"
        />
        <StatsCard
          title={t('dashboard.avgCpu')}
          value={`${stats.avgCpuUsage.toFixed(1)}%`}
          icon={Cpu}
          trend={{ value: stats.avgCpuUsage > 50 ? 5 : -3, isUp: stats.avgCpuUsage > 50 }}
          color={stats.avgCpuUsage > 80 ? 'red' : stats.avgCpuUsage > 60 ? 'yellow' : 'blue'}
          progress={stats.avgCpuUsage}
        />
        <StatsCard
          title={t('dashboard.avgMemory')}
          value={`${stats.avgMemoryUsage.toFixed(1)}%`}
          icon={MemoryStick}
          trend={{ value: 2, isUp: true }}
          color={stats.avgMemoryUsage > 80 ? 'red' : stats.avgMemoryUsage > 60 ? 'yellow' : 'purple'}
          progress={stats.avgMemoryUsage}
        />
        <StatsCard
          title={t('dashboard.avgDisk')}
          value={`${stats.avgDiskUsage.toFixed(1)}%`}
          icon={HardDrive}
          trend={{ value: 1, isUp: false }}
          color={stats.avgDiskUsage > 80 ? 'red' : stats.avgDiskUsage > 60 ? 'yellow' : 'orange'}
          progress={stats.avgDiskUsage}
        />
        <StatsCard
          title={t('dashboard.activeAlerts')}
          value={stats.activeAlerts}
          icon={Bell}
          trend={{ value: 2, isUp: true }}
          color={stats.activeAlerts > 5 ? 'red' : stats.activeAlerts > 2 ? 'yellow' : 'green'}
        />
      </div>

      {/* Network stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.networkTraffic')}</p>
                <p className="text-2xl font-bold text-foreground">{formatBytes(stats.totalNetworkIn)}</p>
              </div>
            </div>
            <span className="text-sm text-success">+12.5%</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '65%' }} />
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.networkTraffic')}</p>
                <p className="text-2xl font-bold text-foreground">{formatBytes(stats.totalNetworkOut)}</p>
              </div>
            </div>
            <span className="text-sm text-danger">-8.3%</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '45%' }} />
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('dashboard.avgCpu')}</h3>
          <CpuChart data={cpuHistory} />
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('dashboard.avgMemory')}</h3>
          <MemoryChart used={memoryUsage} />
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server status chart */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('servers.title')}</h3>
          <ServerStatusChart online={stats.onlineServers} offline={stats.totalServers - stats.onlineServers} />
        </div>

        {/* Recent alerts */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">{t('alerts.title')}</h3>
            <button className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
              {t('common.viewAll', 'View All')}
            </button>
          </div>
          <AlertsList alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
