import ReactECharts from 'echarts-for-react';

interface ServerStatusChartProps {
  online: number;
  offline: number;
}

export default function ServerStatusChart({ online, offline }: ServerStatusChartProps) {
  const total = online + offline;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: {
        color: '#f8fafc',
        fontSize: 12,
      },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'middle',
      textStyle: {
        color: '#94a3b8',
        fontSize: 12,
      },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 16,
    },
    series: [
      {
        name: 'Server Status',
        type: 'pie',
        radius: ['45%', '65%'],
        center: ['35%', '50%'], // 饼图圆心
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0f172a',
          borderWidth: 3,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#f8fafc',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          {
            value: online,
            name: 'Online',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#22c55e' },
                  { offset: 1, color: '#16a34a' },
                ],
              },
            },
          },
          {
            value: offline,
            name: 'Offline',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#ef4444' },
                  { offset: 1, color: '#dc2626' },
                ],
              },
            },
          },
        ],
      },
    ],
    graphic: [
      {
        type: 'text',
        // 与饼图 center 保持一致，文字就完美居中
        left: '35%', 
        top: '40%',
        style: {
          text: total.toString(),
          textAlign: 'center',
          fill: '#f8fafc',
          fontSize: 24,
          fontWeight: 'bold',
        },
      },
      {
        type: 'text',
        left: '35%',
        top: '54%',
        style: {
          text: 'Total',
          textAlign: 'center',
          fill: '#94a3b8',
          fontSize: 11,
        },
      },
    ],
  };

  return (
    <div className="h-[250px] w-full">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}