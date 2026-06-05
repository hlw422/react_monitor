import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as si from 'systeminformation';
import { Server } from '../../database/entities/server.entity';
import { MetricService } from './metric.service';
import { AlertService } from '../alert/alert.service';

@Injectable()
export class MetricCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricCollectorService.name);
  private isCollecting = false;
  
  // 配置：是否使用真实数据（true）或模拟数据（false）
  private useRealData = true;

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    private metricService: MetricService,
    private alertService: AlertService,
  ) {}

  onModuleInit() {
    this.logger.log('MetricCollectorService initialized');
    this.isCollecting = true;
  }

  onModuleDestroy() {
    this.isCollecting = false;
    this.logger.log('MetricCollectorService destroyed');
  }

  // 公共方法：切换数据模式
  setUseRealData(useReal: boolean) {
    this.useRealData = useReal;
    this.logger.log(`Data collection mode set to: ${useReal ? 'Real' : 'Simulated'}`);
  }

  // 公共方法：获取当前数据模式
  isUsingRealData(): boolean {
    return this.useRealData;
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async collectMetrics() {
    if (!this.isCollecting) return;

    try {
      const servers = await this.serverRepository.find({
        where: { status: 'online' },
      });

      if (servers.length === 0) {
        this.logger.debug('No online servers found for metric collection');
        return;
      }

      for (const server of servers) {
        await this.collectServerMetrics(server);
      }

      this.logger.debug(`Collected metrics for ${servers.length} servers`);
    } catch (error) {
      this.logger.error('Error collecting metrics:', error);
    }
  }

  private async collectServerMetrics(server: Server) {
    const metricTypes = ['cpu', 'memory', 'disk', 'network'] as const;

    for (const metricType of metricTypes) {
      let value: number;

      if (this.useRealData) {
        // 使用真实数据
        value = await this.getRealMetricValue(metricType);
      } else {
        // 使用模拟数据
        value = this.getSimulatedMetricValue(metricType, server);
      }

      await this.metricService.create({
        serverId: server.id,
        metricType,
        value,
        metadata: {
          source: this.useRealData ? 'real' : 'simulator',
          hostname: server.hostname,
        },
      });

      // Check alerts for this metric
      await this.alertService.checkMetricAgainstRules(server.id, metricType, value);
    }

    // Update server's latest metrics
    await this.serverRepository.update(server.id, {
      cpuUsage: await this.getLatestMetricValue(server.id, 'cpu'),
      memoryUsage: await this.getLatestMetricValue(server.id, 'memory'),
      diskUsage: await this.getLatestMetricValue(server.id, 'disk'),
      networkIn: await this.getLatestMetricValue(server.id, 'network'),
      lastHeartbeat: new Date(),
    });
  }

  private async getLatestMetricValue(serverId: string, metricType: string): Promise<number> {
    const metrics = await this.metricService.getLatestMetrics(serverId);
    const metric = metrics.find(m => m.metricType === metricType);
    return metric?.value || 0;
  }

  // 真实数据采集方法
  private async getRealMetricValue(metricType: string): Promise<number> {
    try {
      switch (metricType) {
        case 'cpu':
          return await this.getRealCpuUsage();
        case 'memory':
          return await this.getRealMemoryUsage();
        case 'disk':
          return await this.getRealDiskUsage();
        case 'network':
          return await this.getRealNetworkTraffic();
        default:
          return 0;
      }
    } catch (error) {
      this.logger.error(`Error getting real metric for ${metricType}:`, error);
      // 如果真实数据采集失败，回退到模拟数据
      return this.getSimulatedMetricValue(metricType, null);
    }
  }

  private async getRealCpuUsage(): Promise<number> {
    const cpuLoad = await si.currentLoad();
    return cpuLoad.currentLoad;
  }

  private async getRealMemoryUsage(): Promise<number> {
    const mem = await si.mem();
    return (mem.used / mem.total) * 100;
  }

  private async getRealDiskUsage(): Promise<number> {
    const fsSize = await si.fsSize();
    if (fsSize.length > 0) {
      // 使用第一个磁盘分区
      const disk = fsSize[0];
      return (disk.used / disk.size) * 100;
    }
    return 0;
  }

  private async getRealNetworkTraffic(): Promise<number> {
    const networkStats = await si.networkStats();
    if (networkStats.length > 0) {
      // 返回接收的字节数/秒
      return networkStats[0].rx_sec;
    }
    return 0;
  }

  // 模拟数据方法封装
  private getSimulatedMetricValue(metricType: string, server: Server | null): number {
    switch (metricType) {
      case 'cpu':
        return this.simulateCpuUsage(server?.cpuUsage || 50);
      case 'memory':
        return this.simulateMemoryUsage(server?.memoryUsage || 60);
      case 'disk':
        return this.simulateDiskUsage(server?.diskUsage || 40);
      case 'network':
        return this.simulateNetworkTraffic();
      default:
        return 0;
    }
  }

  private simulateCpuUsage(current: number): number {
    // Simulate realistic CPU usage with some variance
    const variance = (Math.random() - 0.5) * 20;
    const newValue = current + variance;
    return Math.max(5, Math.min(95, newValue));
  }

  private simulateMemoryUsage(current: number): number {
    // Memory tends to be more stable with gradual changes
    const variance = (Math.random() - 0.5) * 10;
    const newValue = current + variance;
    return Math.max(30, Math.min(90, newValue));
  }

  private simulateDiskUsage(current: number): number {
    // Disk usage changes very slowly
    const variance = (Math.random() - 0.5) * 2;
    const newValue = current + variance;
    return Math.max(20, Math.min(95, newValue));
  }

  private simulateNetworkTraffic(): number {
    // Simulate network traffic in bytes/sec (0-10MB/s)
    return Math.random() * 10 * 1024 * 1024;
  }
}
