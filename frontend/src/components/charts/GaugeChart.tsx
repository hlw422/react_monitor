import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { cn } from '@/utils/cn';

interface GaugeChartProps {
  value: number;
  title?: string;
  color?: string;
  height?: number;
  className?: string;
  min?: number;
  max?: number;
  unit?: string;
}

export default function GaugeChart({
  value,
  title,
  color = '#3b82f6',
  height = 300,
  className,
  min = 0,
  max = 100,
  unit = '%',
}: GaugeChartProps) {
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
      series: [
        {
          type: 'gauge',
          min,
          max,
          progress: {
            show: true,
            width: 18,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color },
                  { offset: 1, color: `${color}80` },
                ],
              },
            },
          },
          axisLine: {
            lineStyle: {
              width: 18,
              color: [[1, '#1e293b']],
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
          pointer: {
            show: false,
          },
          title: {
            show: !!title,
            offsetCenter: [0, '70%'],
            fontSize: 14,
            color: '#94a3b8',
          },
          detail: {
            valueAnimation: true,
            fontSize: 32,
            fontWeight: 'bold',
            color: color,
            offsetCenter: [0, '0%'],
            formatter: `{value}${unit}`,
          },
          data: [
            {
              value: Number(value.toFixed(2)),
              name: title,
            },
          ],
        },
      ],
    };

    chartInstance.current.setOption(option);
  }, [value, title, color, min, max, unit]);

  return (
    <div
      ref={chartRef}
      className={cn('w-full', className)}
      style={{ height: `${height}px` }}
    />
  );
}
