import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { cn } from '@/utils/cn';

interface RadarChartProps {
  data: {
    indicators: { name: string; max: number }[];
    values: number[];
  };
  title?: string;
  color?: string;
  height?: number;
  className?: string;
}

export default function RadarChart({
  data,
  title,
  color = '#3b82f6',
  height = 300,
  className,
}: RadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current) return;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: title
        ? {
            text: title,
            textStyle: {
              color: '#f8fafc',
              fontSize: 14,
              fontWeight: 600,
            },
          }
        : undefined,
      radar: {
        indicator: data.indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: '#94a3b8',
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: '#1e293b',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['transparent'],
          },
        },
        axisLine: {
          lineStyle: {
            color: '#334155',
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: data.values,
              name: title || 'Metrics',
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: {
                color,
                width: 2,
              },
              areaStyle: {
                color: `${color}33`,
              },
              itemStyle: {
                color,
              },
            },
          ],
        },
      ],
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        textStyle: {
          color: '#f8fafc',
          fontSize: 12,
        },
      },
    };

    chartInstance.current.setOption(option);
  }, [data, title, color]);

  return (
    <div
      ref={chartRef}
      className={cn('w-full', className)}
      style={{ height: `${height}px` }}
    />
  );
}
