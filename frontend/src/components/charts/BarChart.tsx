import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { cn } from '@/utils/cn';

interface BarChartProps {
  data: {
    categories: string[];
    values: number[];
  };
  title?: string;
  color?: string;
  height?: number;
  className?: string;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  title,
  color = '#3b82f6',
  height = 300,
  className,
  horizontal = false,
}: BarChartProps) {
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
      grid: {
        top: title ? 40 : 20,
        right: 20,
        bottom: 30,
        left: 50,
      },
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
      xAxis: horizontal
        ? {
            type: 'value',
            axisLine: {
              lineStyle: {
                color: '#334155',
              },
            },
            axisLabel: {
              color: '#94a3b8',
              fontSize: 10,
            },
            splitLine: {
              lineStyle: {
                color: '#1e293b',
              },
            },
          }
        : {
            type: 'category',
            data: data.categories,
            axisLine: {
              lineStyle: {
                color: '#334155',
              },
            },
            axisLabel: {
              color: '#94a3b8',
              fontSize: 10,
            },
            splitLine: {
              show: false,
            },
          },
      yAxis: horizontal
        ? {
            type: 'category',
            data: data.categories,
            axisLine: {
              lineStyle: {
                color: '#334155',
              },
            },
            axisLabel: {
              color: '#94a3b8',
              fontSize: 10,
            },
            splitLine: {
              show: false,
            },
          }
        : {
            type: 'value',
            axisLine: {
              show: false,
            },
            axisLabel: {
              color: '#94a3b8',
              fontSize: 10,
            },
            splitLine: {
              lineStyle: {
                color: '#1e293b',
              },
            },
          },
      series: [
        {
          type: 'bar',
          data: data.values,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: horizontal ? 1 : 0,
              y2: horizontal ? 0 : 1,
              colorStops: [
                { offset: 0, color },
                { offset: 1, color: `${color}80` },
              ],
            },
            borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        textStyle: {
          color: '#f8fafc',
          fontSize: 12,
        },
      },
    };

    chartInstance.current.setOption(option);
  }, [data, title, color, horizontal]);

  return (
    <div
      ref={chartRef}
      className={cn('w-full', className)}
      style={{ height: `${height}px` }}
    />
  );
}
