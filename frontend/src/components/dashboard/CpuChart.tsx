import ReactECharts from 'echarts-for-react';

interface DataPoint {
  time: string;
  value: number;
}

interface CpuChartProps {
  data?: DataPoint[];
}

export default function CpuChart({ data = [] }: CpuChartProps) {

  const option = {
    backgroundColor: 'transparent',
    grid: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.time),
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
      min: 0,
      max: 100,
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 10,
        formatter: '{value}%',
      },
      splitLine: {
        lineStyle: {
          color: '#1e293b',
        },
      },
    },
    series: [
      {
        name: 'CPU Usage',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#3b82f6',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
          },
        },
        data: data.map(d => d.value),
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
      formatter: (params: any) => {
        const param = params[0];
        return `
          <div style="font-weight: 600; margin-bottom: 4px;">${param.axisValue}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: #3b82f6; border-radius: 50%;"></span>
            <span>CPU: ${param.value.toFixed(1)}%</span>
          </div>
        `;
      },
    },
  };

  return (
    <div className="h-[300px]">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
