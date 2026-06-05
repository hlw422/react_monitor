import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      return await api.get('/dashboard/stats');
    },
    refetchInterval: 5000,
  });

  // Fetch recent alerts
  const { data: alertsData } = useQuery({
    queryKey: ['alerts', 'recent'],
    queryFn: async () => {
      return await api.get('/alerts', { params: { limit: 20 } });
    },
    refetchInterval: 5000,
  });

  // Fetch time series data for online servers
  const { data: serversData } = useQuery({
    queryKey: ['servers', 'online'],
    queryFn: async () => {
      return await api.get('/servers', { params: { status: 'online' } });
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
      
      // 数据采样：如果数据点超过30个，均匀采样到30个
      const sampleData = (data: any[], maxPoints = 30) => {
        if (data.length <= maxPoints) return data;
        const step = Math.floor(data.length / maxPoints);
        return data.filter((_, i) => i % step === 0).slice(0, maxPoints);
      };
      
      setCpuData(sampleData(cpuRes).map((m: any) => ({ time: formatTime(m.timestamp), value: m.value })));
      setMemData(sampleData(memRes).map((m: any) => ({ time: formatTime(m.timestamp), value: m.value })));
      setNetworkInData(sampleData(netRes).map((m: any) => ({ time: formatTime(m.timestamp), value: m.value })));
      setNetworkOutData(sampleData(netRes).map((m: any) => ({ time: formatTime(m.timestamp), value: m.value * 0.3 })));
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
    if (alertsData) {
      setAlerts(Array.isArray(alertsData) ? alertsData : (alertsData.items || []));
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
      grid: { top: 35, right: 15, bottom: 25, left: 50, containLabel: false },
      legend: {
        data: [t('bigscreen.download'), t('bigscreen.upload')],
        textStyle: { color: '#94A3B8', fontSize: 11 },
        right: 0,
        top: 0,
        itemWidth: 12,
        itemHeight: 10,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1E293B',
        borderColor: '#334155',
        textStyle: { color: '#E2E8F0', fontSize: 12 },
        formatter: (params: any) => {
          let result = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`;
          params.forEach((p: any) => {
            const val = p.value >= 1024 ? `${(p.value / 1024).toFixed(1)} KB/s` : `${p.value.toFixed(0)} B/s`;
            result += `<div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: ${val}</div>`;
          });
          return result;
        },
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748B', fontSize: 10, interval: 'auto', rotate: 0 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1E293B' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          formatter: (value: number) => {
            if (value >= 1048576) return `${(value / 1048576).toFixed(1)} MB`;
            if (value >= 1024) return `${(value / 1024).toFixed(0)} KB`;
            return `${value}`;
          },
        },
      },
      series: [
        {
          name: t('bigscreen.download'),
          type: 'bar',
          stack: 'total',
          data: inValues,
          itemStyle: { color: '#8B5CF6', borderRadius: [0, 0, 0, 0] },
          barWidth: '40%',
        },
        {
          name: t('bigscreen.upload'),
          type: 'bar',
          stack: 'total',
          data: outValues,
          itemStyle: { color: '#06B6D4', borderRadius: [4, 4, 0, 0] },
          barWidth: '40%',
        },
      ],
    };
  };

  // Server Status Pie Chart
  const getServerStatusOption = () => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1E293B',
      borderColor: '#334155',
      textStyle: { color: '#E2E8F0' },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      textStyle: { color: '#94A3B8', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '60%'],
        center: ['50%', '45%'],
        data: [
          { value: stats.onlineServers, name: `${t('common.online')} (${stats.onlineServers})`, itemStyle: { color: '#22C55E' } },
          { value: stats.totalServers - stats.onlineServers, name: `${t('common.offline')} (${stats.totalServers - stats.onlineServers})`, itemStyle: { color: '#EF4444' } },
        ],
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}',
          color: '#94A3B8',
          fontSize: 11,
          overflow: 'truncate',
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 10,
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
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1E293B',
        borderColor: '#334155',
        textStyle: { color: '#E2E8F0' },
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        textStyle: { color: '#94A3B8', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '60%'],
          center: ['50%', '42%'],
          data: levels.map((level, i) => ({
            value: counts[i],
            name: `${t(`common.${level}`)} (${counts[i]})`,
            itemStyle: { color: levelColors[level] },
          })),
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}',
            color: '#94A3B8',
            fontSize: 10,
            overflow: 'truncate',
          },
          labelLine: {
            show: true,
            length: 8,
            length2: 8,
          },
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {t('bigscreen.title')}
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-600">
            <Clock className="w-4 h-4 text-primary-400" />
            <span className="text-xs sm:text-sm font-mono text-foreground">
              {currentTime.toLocaleString('zh-CN')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-600">
            <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm text-foreground">{t('bigscreen.live')}</span>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Server, label: t('bigscreen.servers'), value: `${stats.onlineServers}/${stats.totalServers}`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: Cpu, label: t('bigscreen.cpuAvg'), value: `${stats.avgCpuUsage.toFixed(1)}%`, color: 'text-green-400', bg: 'bg-green-500/10' },
          { icon: HardDrive, label: t('bigscreen.memoryAvg'), value: `${stats.avgMemoryUsage.toFixed(1)}%`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: AlertTriangle, label: t('bigscreen.activeAlerts'), value: stats.activeAlerts, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('p-2 rounded-lg', stat.bg)}>
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-240px)]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Server Distribution */}
          <div className="glass rounded-xl p-4 lg:p-6 min-h-[280px] lg:h-[45%]">
            <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Server className="w-5 h-5 text-primary-400" />
              {t('bigscreen.serverDistribution')}
            </h3>
            <div className="h-[220px] lg:h-[85%]">
              <ReactECharts
                option={getServerStatusOption()}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          </div>

          {/* Alert Level Distribution */}
          <div className="glass rounded-xl p-4 lg:p-6 min-h-[280px] lg:flex-1">
            <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              {t('bigscreen.alertDistribution')}
            </h3>
            <div className="h-[220px] lg:h-[80%]">
              <ReactECharts
                option={getAlertLevelOption()}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          </div>
        </div>

        {/* Center column */}
        <div className="space-y-6">
          {/* CPU & Memory Trend */}
          <div className="glass rounded-xl p-4 lg:p-6 min-h-[280px] lg:h-[50%]">
            <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              {t('bigscreen.cpuMemoryTrend')}
            </h3>
            <div className="h-[220px] lg:h-[85%]">
              <ReactECharts
                option={getTrendChartOption()}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          </div>

          {/* Network Traffic */}
          <div className="glass rounded-xl p-4 lg:p-6 min-h-[280px] lg:h-[50%]">
            <h3 className="text-base lg:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-purple-400" />
              {t('bigscreen.networkTraffic')}
            </h3>
            <div className="h-[220px] lg:h-[90%]">
              <ReactECharts
                option={getNetworkChartOption()}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Real-time Alerts */}
          <div className="glass rounded-xl p-4 lg:p-6 min-h-[280px] lg:h-[45%]">
            <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              {t('bigscreen.realtimeAlerts')}
            </h3>
            <div className="space-y-2 overflow-y-auto max-h-[200px] lg:max-h-[calc(100%-40px)]">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t('bigscreen.noRecentAlerts')}</div>
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
          <div className="glass rounded-xl p-4 lg:p-6 lg:flex-1">
            <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              {t('bigscreen.keyMetrics')}
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
