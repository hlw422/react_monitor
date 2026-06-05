import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import {
  Maximize,
  Minimize,
  Clock,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/services/api';
import { useSocketEvents } from '@/hooks/useSocket';
import type { Alert, DashboardStats } from '@/types';

const levelColors: Record<string, string> = {
  info: '#3B82F6',
  warning: '#F59E0B',
  error: '#EF4444',
  critical: '#DC2626',
};

export default function BigScreen() {
  const { on } = useSocketEvents();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalServers: 0,
    onlineServers: 0,
    avgCpuUsage: 0,
    avgMemoryUsage: 0,
    avgDiskUsage: 0,
    totalNetworkIn: 0,
    totalNetworkOut: 0,
    activeAlerts: 0,
  });
  const [cpuData, setCpuData] = useState<{ time: string; value: number }[]>([]);
  const [memData, setMemData] = useState<{ time: string; value: number }[]>([]);
  const [networkInData, setNetworkInData] = useState<{ time: string; value: number }[]>([]);
  const [networkOutData, setNetworkOutData] = useState<{ time: string; value: number }[]>([]);

  // Fetch dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 5000,
  });

  // Fetch recent alerts
  const { data: alertsData } = useQuery({
    queryKey: ['alerts', 'recent'],
    queryFn: async () => {
      const response = await api.get('/alerts', { params: { limit: 20 } });
      return response.data;
    },
    refetchInterval: 5000,
  });

  // Fetch time series data for online servers
  const { data: serversData } = useQuery({
    queryKey: ['servers', 'online'],
    queryFn: async () => {
      const response = await api.get('/servers', { params: { status: 'online' } });
      return response.data;
    },
    refetchInterval: 10000,
  });

  // Fetch time series metrics for charts
  useQuery({
    queryKey: ['metrics', 'timeseries', serversData],
    queryFn: async () => {
      if (!serversData || serversData.length === 0) return null;
      const serverId = serversData[0].id;
      const [cpuRes, memRes, netRes] = await Promise.all([
        api.get(`/metrics/timeseries/${serverId}/cpu`, { params: { minutes: 30 } }),
        api.get(`/metrics/timeseries/${serverId}/memory`, { params: { minutes: 30 } }),
        api.get(`/metrics/timeseries/${serverId}/network`, { params: { minutes: 30 } }),
      ]);
      const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      setCpuData(cpuRes.data.map((m: any) => ({ time: formatTime(m.timestamp), value: m.value })));
      setMemData(memRes.data.map((m: any) => ({ time: formatTime(m.timestamp), value: m.value })));
      setNetworkInData(netRes.data.map((m: any) => ({ time: formatTime(m.timestamp), value: m.value })));
      setNetworkOutData(netRes.data.map((m: any) => ({ time: formatTime(m.timestamp), value: m.value * 0.3 })));
      return true;
    },
    enabled: !!serversData && serversData.length > 0,
    refetchInterval: 5000,
  });

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for real-time alerts
  useEffect(() => {
    const unsubscribe = on('alert:new', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 20));
    });
    return unsubscribe;
  }, [on]);

  // Update stats when data changes
  useEffect(() => {
    if (dashboardData) {
      setStats(dashboardData);
    }
  }, [dashboardData]);

  useEffect(() => {
    if (alertsData?.items) {
      setAlerts(alertsData.items);
    }
  }, [alertsData]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // CPU & Memory Trend Chart (using real data)
  const getTrendChartOption = () => {
    const times = cpuData.length > 0
      ? cpuData.map(d => d.time)
      : Array.from({ length: 20 }, (_, i) => {
          const d = new Date();
          d.setMinutes(d.getMinutes() - (19 - i));
          return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        });

    const cpuValues = cpuData.length > 0 ? cpuData.map(d => d.value) : Array.from({ length: 20 }, () => 0);
    const memValues = memData.length > 0 ? memData.map(d => d.value) : Array.from({ length: 20 }, () => 0);

    return {
      backgroundColor: 'transparent',
      grid: { top: 40, right: 20, bottom: 30, left: 50 },
      legend: {
        data: ['CPU', 'Memory'],
        textStyle: { color: '#94A3B8' },
        right: 0,
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1E293B' } },
        axisLabel: { color: '#64748B', fontSize: 10, formatter: '{value}%' },
      },
      series: [
        {
          name: 'CPU',
          type: 'line',
          data: cpuValues,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#3B82F6', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0)' },
              ],
            },
          },
        },
        {
          name: 'Memory',
          type: 'line',
          data: memValues,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#22C55E', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
                { offset: 1, color: 'rgba(34, 197, 94, 0)' },
              ],
            },
          },
        },
      ],
    };
  };

  // Network Traffic Chart (using real data)
  const getNetworkChartOption = () => {
    const times = networkInData.length > 0
      ? networkInData.map(d => d.time)
      : Array.from({ length: 20 }, (_, i) => {
          const d = new Date();
          d.setMinutes(d.getMinutes() - (19 - i));
          return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        });

    const inValues = networkInData.length > 0 ? networkInData.map(d => d.value) : Array.from({ length: 20 }, () => 0);
    const outValues = networkOutData.length > 0 ? networkOutData.map(d => d.value) : Array.from({ length: 20 }, () => 0);

    return {
      backgroundColor: 'transparent',
      grid: { top: 40, right: 20, bottom: 30, left: 60 },
      legend: {
        data: ['Download', 'Upload'],
        textStyle: { color: '#94A3B8' },
        right: 0,
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1E293B' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          formatter: (value: number) => `${(value / 1024).toFixed(1)} KB/s`,
        },
      },
      series: [
        {
          name: 'Download',
          type: 'bar',
          data: inValues,
          itemStyle: { color: '#8B5CF6', borderRadius: [4, 4, 0, 0] },
          barWidth: '30%',
        },
        {
          name: 'Upload',
          type: 'bar',
          data: outValues,
          itemStyle: { color: '#06B6D4', borderRadius: [4, 4, 0, 0] },
          barWidth: '30%',
        },
      ],
    };
  };

  // Server Status Pie Chart
  const getServerStatusOption = () => ({
    backgroundColor: 'transparent',
    series: [
      {
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['50%', '50%'],
        data: [
          { value: stats.onlineServers, name: 'Online', itemStyle: { color: '#22C55E' } },
          { value: stats.totalServers - stats.onlineServers, name: 'Offline', itemStyle: { color: '#EF4444' } },
        ],
        label: {
          show: true,
          position: 'center',
          formatter: `{a|${stats.onlineServers}}\n{b|Online}`,
          rich: {
            a: { fontSize: 28, fontWeight: 'bold', color: '#F8FAFC', lineHeight: 36 },
            b: { fontSize: 12, color: '#94A3B8', lineHeight: 20 },
          },
        },
        emphasis: { disabled: true },
      },
    ],
  });

  // Alert Level Distribution
  const getAlertLevelOption = () => {
    const levels = ['info', 'warning', 'error', 'critical'];
    const counts = levels.map(level =>
      alerts.filter(a => a.level === level).length
    );

    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'pie',
          radius: ['50%', '70%'],
          center: ['50%', '50%'],
          data: levels.map((level, i) => ({
            value: counts[i],
            name: level.charAt(0).toUpperCase() + level.slice(1),
            itemStyle: { color: levelColors[level] },
          })),
          label: { show: false },
          emphasis: { disabled: true },
        },
      ],
    };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-dark-900 -m-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            运维监控中心
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-600">
            <Clock className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-mono text-foreground">
              {currentTime.toLocaleString('zh-CN')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-600">
            <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm text-foreground">Live</span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-dark-800 border border-dark-600 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: Server, label: 'Servers', value: stats.onlineServers, total: stats.totalServers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: Cpu, label: 'CPU Avg', value: `${stats.avgCpuUsage.toFixed(1)}%`, color: 'text-green-400', bg: 'bg-green-500/10' },
          { icon: HardDrive, label: 'Memory Avg', value: `${stats.avgMemoryUsage.toFixed(1)}%`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: AlertTriangle, label: 'Active Alerts', value: stats.activeAlerts, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('p-2 rounded-lg', stat.bg)}>
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            {stat.total && (
              <p className="text-xs text-muted-foreground mt-1">of {stat.total} total</p>
            )}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-240px)]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Server Distribution */}
          <div className="glass rounded-xl p-6 h-[45%]">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-primary-400" />
              Server Distribution
            </h3>
            <ReactECharts
              option={getServerStatusOption()}
              style={{ height: '85%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>

          {/* Alert Level Distribution */}
          <div className="glass rounded-xl p-6 flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Alert Distribution
            </h3>
            <ReactECharts
              option={getAlertLevelOption()}
              style={{ height: '80%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </div>

        {/* Center column */}
        <div className="space-y-6">
          {/* CPU & Memory Trend */}
          <div className="glass rounded-xl p-6 h-[50%]">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              CPU & Memory Trend
            </h3>
            <ReactECharts
              option={getTrendChartOption()}
              style={{ height: '85%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>

          {/* Network Traffic */}
          <div className="glass rounded-xl p-6 flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-purple-400" />
              Network Traffic
            </h3>
            <ReactECharts
              option={getNetworkChartOption()}
              style={{ height: '85%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Real-time Alerts */}
          <div className="glass rounded-xl p-6 h-[45%]">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Real-time Alerts
            </h3>
            <div className="space-y-2 overflow-y-auto max-h-[calc(100%-40px)]">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent alerts</div>
              ) : (
                alerts.slice(0, 10).map((alert, i) => (
                  <div
                    key={alert.id || i}
                    className="flex items-start gap-3 p-3 bg-dark-800 rounded-lg animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: levelColors[alert.level] || '#64748B' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTime(alert.createdAt)}</p>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${levelColors[alert.level]}20`,
                        color: levelColors[alert.level],
                      }}
                    >
                      {alert.level}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="glass rounded-xl p-6 flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Key Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'CPU', value: stats.avgCpuUsage, color: '#3B82F6' },
                { label: 'Memory', value: stats.avgMemoryUsage, color: '#22C55E' },
                { label: 'Disk', value: stats.avgDiskUsage, color: '#F59E0B' },
                { label: 'Network', value: Math.min(100, (stats.totalNetworkIn / 1000000) * 10), color: '#8B5CF6' },
              ].map((metric, i) => (
                <div key={i} className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="#1E293B"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke={metric.color}
                        strokeWidth="8"
                        strokeDasharray={`${metric.value * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-foreground">
                        {metric.value.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
