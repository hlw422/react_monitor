import { useState, useEffect } from 'react';
import { Activity, Cpu, MemoryStick, HardDrive, Network } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LineChart, BarChart, PieChart, GaugeChart, RadarChart } from '@/components/charts';
import { useTranslation } from 'react-i18next';

type MetricTab = 'cpu' | 'memory' | 'disk' | 'network';

// Mock data generators
const generateTimeSeriesData = (count: number, min: number, max: number) => {
  const now = new Date();
  const timestamps = [];
  const values = [];
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    timestamps.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    values.push(Math.random() * (max - min) + min);
  }
  
  return { timestamps, values };
};

export default function Metrics() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<MetricTab>('cpu');
  const [timeRange, setTimeRange] = useState('1h');

  const tabs = [
    { id: 'cpu' as MetricTab, label: t('metrics.cpu'), icon: Cpu },
    { id: 'memory' as MetricTab, label: t('metrics.memory'), icon: MemoryStick },
    { id: 'disk' as MetricTab, label: t('metrics.disk'), icon: HardDrive },
    { id: 'network' as MetricTab, label: t('metrics.network'), icon: Network },
  ];

  const timeRanges = [
    { value: '1m', label: t('metrics.last1m') },
    { value: '5m', label: t('metrics.last5m') },
    { value: '30m', label: t('metrics.last30m') },
    { value: '24h', label: t('metrics.last24h') },
    { value: '7d', label: t('metrics.last7d') },
  ];
  const [cpuData, setCpuData] = useState(generateTimeSeriesData(60, 20, 80));
  const [memoryData, setMemoryData] = useState(generateTimeSeriesData(60, 40, 90));
  const [diskData, setDiskData] = useState(generateTimeSeriesData(60, 30, 70));
  const [networkData, setNetworkData] = useState(generateTimeSeriesData(60, 10, 60));

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      setCpuData(prev => ({
        timestamps: [...prev.timestamps.slice(1), newTime],
        values: [...prev.values.slice(1), Math.random() * 60 + 20],
      }));
      
      setMemoryData(prev => ({
        timestamps: [...prev.timestamps.slice(1), newTime],
        values: [...prev.values.slice(1), Math.random() * 50 + 40],
      }));
      
      setDiskData(prev => ({
        timestamps: [...prev.timestamps.slice(1), newTime],
        values: [...prev.values.slice(1), Math.random() * 40 + 30],
      }));
      
      setNetworkData(prev => ({
        timestamps: [...prev.timestamps.slice(1), newTime],
        values: [...prev.values.slice(1), Math.random() * 50 + 10],
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cpu':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('metrics.cpuUsageTrend')}</h3>
              <LineChart data={cpuData} height={300} color="#3b82f6" />
            </div>
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('metrics.cpuUsage')}</h3>
              <GaugeChart
                value={cpuData.values[cpuData.values.length - 1]}
                title={t('metrics.currentCpu')}
                color="#3b82f6"
                height={300}
              />
            </div>
          </div>
        );
      case 'memory':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('metrics.memoryUsageTrend')}</h3>
              <LineChart data={memoryData} height={300} color="#8b5cf6" showArea={true} />
            </div>
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('metrics.memoryDistribution')}</h3>
              <PieChart
                data={[
                  { name: t('metrics.used'), value: 62.8, color: '#8b5cf6' },
                  { name: t('metrics.cached'), value: 15.2, color: '#3b82f6' },
                  { name: t('metrics.free'), value: 22, color: '#1e293b' },
                ]}
                height={300}
                donut={true}
              />
            </div>
          </div>
        );
      case 'disk':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('metrics.diskIO')}</h3>
              <BarChart
                data={{
                  categories: [t('metrics.read'), t('metrics.write'), t('metrics.total')],
                  values: [120, 85, 205],
                }}
                height={300}
                color="#f59e0b"
              />
            </div>
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('metrics.diskUsage')}</h3>
              <GaugeChart
                value={58.3}
                title={t('metrics.diskUsage')}
                color="#f59e0b"
                height={300}
              />
            </div>
          </div>
        );
      case 'network':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('metrics.networkTraffic')}</h3>
              <LineChart data={networkData} height={300} color="#22c55e" />
            </div>
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">{t('metrics.networkStats')}</h3>
              <RadarChart
                data={{
                  indicators: [
                    { name: t('metrics.bandwidth'), max: 100 },
                    { name: t('metrics.latency'), max: 100 },
                    { name: t('metrics.packets'), max: 100 },
                    { name: t('metrics.errors'), max: 100 },
                    { name: t('metrics.connections'), max: 100 },
                  ],
                  values: [85, 72, 90, 15, 78],
                }}
                height={300}
                color="#22c55e"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('metrics.title')}</h2>
          <p className="text-muted-foreground mt-1">{t('metrics.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 bg-dark-800 rounded-lg p-1 border border-dark-600">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                timeRange === range.value
                  ? 'bg-primary-500 text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {range.value}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1 border border-dark-600 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary-500 text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Metrics content */}
      {renderTabContent()}
    </div>
  );
}
