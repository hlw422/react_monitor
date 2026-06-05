import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useMetricsSocket } from './useSocket';
import type { Metric } from '@/types';

interface UseMetricsOptions {
  serverId: string;
  metricType?: string;
  timeRange?: number; // in minutes
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export function useMetrics({
  serverId,
  metricType = 'cpu',
  timeRange = 60,
  autoRefresh = true,
  refreshInterval = 5000,
}: UseMetricsOptions) {
  const queryClient = useQueryClient();
  const { isConnected, onMetricsUpdate } = useMetricsSocket(serverId);
  const latestDataRef = useRef<Metric[]>([]);

  // Fetch latest metrics
  const { data: latestMetrics, isLoading: latestLoading } = useQuery({
    queryKey: ['metrics', 'latest', serverId],
    queryFn: async () => {
      const response = await api.get(`/metrics/latest/${serverId}`);
      return response.data;
    },
    enabled: !!serverId,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch time series data
  const { data: timeSeriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ['metrics', 'timeseries', serverId, metricType, timeRange],
    queryFn: async () => {
      const response = await api.get(`/metrics/timeseries/${serverId}/${metricType}`, {
        params: { minutes: timeRange },
      });
      return response.data as TimeSeriesData[];
    },
    enabled: !!serverId && !!metricType,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Listen for real-time updates via WebSocket
  useEffect(() => {
    const unsubscribe = onMetricsUpdate((data) => {
      if (data.serverId === serverId) {
        // Update the latest metrics cache
        queryClient.setQueryData(['metrics', 'latest', serverId], data.metrics);

        // Invalidate time series to trigger refetch
        queryClient.invalidateQueries({
          queryKey: ['metrics', 'timeseries', serverId],
        });
      }
    });

    return unsubscribe;
  }, [serverId, onMetricsUpdate, queryClient]);

  // Get specific metric value
  const getMetricValue = useCallback(
    (type: string) => {
      if (!latestMetrics) return 0;
      const metric = latestMetrics.find((m: Metric) => m.metricType === type);
      return metric?.value || 0;
    },
    [latestMetrics]
  );

  // Format time series for charts
  const formatChartData = useCallback(
    (data: TimeSeriesData[] | undefined) => {
      if (!data) return { timestamps: [], values: [] };
      return {
        timestamps: data.map((d) => new Date(d.timestamp).toLocaleTimeString()),
        values: data.map((d) => d.value),
      };
    },
    []
  );

  return {
    latestMetrics,
    timeSeriesData,
    isLoading: latestLoading || seriesLoading,
    isConnected,
    getMetricValue,
    formatChartData,
  };
}

export function useAllMetrics(serverId: string) {
  const cpuMetrics = useMetrics({ serverId, metricType: 'cpu' });
  const memoryMetrics = useMetrics({ serverId, metricType: 'memory' });
  const diskMetrics = useMetrics({ serverId, metricType: 'disk' });
  const networkMetrics = useMetrics({ serverId, metricType: 'network' });

  return {
    cpu: cpuMetrics,
    memory: memoryMetrics,
    disk: diskMetrics,
    network: networkMetrics,
  };
}
