import { memo, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { cn } from '@/utils/cn';

interface LineChartProps {
  data: {
    timestamps: string[];
    values: number[];
  };
  title?: string;
  color?: string;
  height?: number;
  className?: string;
  showArea?: boolean;
  smooth?: boolean;
}

const LineChart = memo(function LineChart({
  data,
  title,
  color = '#3b82f6',
  height = 300,
  className,
  showArea = true,
  smooth = true,
}: LineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    chartInstance.current = echarts.init(chartRef.current);

    // Handle resize
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
      xAxis: {
        type: 'category',
        data: data.timestamps,
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
      yAxis: {
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
          type: 'line',
          smooth,
          symbol: 'none',
          lineStyle: {
            color,
            width: 2,
          },
          areaStyle: showArea
            ? {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: `${color}33` },
                    { offset: 1, color: `${color}00` },
                  ],
                },
              }
            : undefined,
          data: data.values,
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
  }, [data, title, color, showArea, smooth]);

  return (
    <div
      ref={chartRef}
      className={cn('w-full', className)}
      style={{ height: `${height}px` }}
    />
  );
});

export default LineChart;
